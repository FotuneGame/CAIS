import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir } from 'node:fs/promises';
import { InjectionService } from '../../shared/injection/injection.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { ActService } from '../act/act.service';
import { GoalsService } from '../goals/goals.service';
import { MemoryService } from '../memory/memory.service';
import { PlannerService } from '../planner/planner.service';
import { ReflectionService } from '../reflection/reflection.service';
import { ToolsService } from '../tools/tools.service';
import { ActContext, AgentResult, Review } from './types/agent.types';

@Injectable()
export class AgentService {
  constructor(
    private readonly goalsService: GoalsService,
    private readonly plannerService: PlannerService,
    private readonly actService: ActService,
    private readonly reflectionService: ReflectionService,
    private readonly memoryService: MemoryService,
    private readonly toolsService: ToolsService,
    private readonly injectionService: InjectionService,
    private readonly kafkaService: KafkaService,
    private readonly configService: ConfigService,
  ) {}

  async run(run: string, task: string): Promise<AgentResult> {
    const dataPath = this.configService.get<string>(
      'app.appDataPath',
      './app-data',
    );
    const root = `${dataPath}/sandbox/${run}`;
    await mkdir(root, { recursive: true });
    const findings = this.injectionService.findings(task);
    if (findings.length)
      this.kafkaService.publish({ type: 'injection', run, findings });
    const tools = this.toolsService.create(root);
    const goal = await this.goalsService.create(task);
    this.kafkaService.publish({ type: 'goal', run, goal: goal.goal });
    const memories = await this.memoryService.recall(task);
    const context: ActContext = {
      run,
      root,
      tools,
      messages: this.plannerService.start(goal, memories, tools),
      steps: [],
    };
    let answer: string | null = null;
    let review: Review = { passed: false, note: 'нет ответа' };
    const attempts = this.configService.get<number>('agent.maxAttempts', 2);
    for (let attempt = 1; attempt <= attempts; attempt++) {
      answer = await this.actService.act(context);
      if (answer !== null) {
        review = await this.reflectionService.check(
          goal,
          answer,
          context.steps,
        );
      }
      this.kafkaService.publish({
        type: 'reflection',
        run,
        attempt,
        ...review,
      });
      await this.memoryService.rememberLesson(task, review.note);
      if (review.passed) break;
      this.plannerService.notice(context.messages, 'retry', {
        note: review.note,
      });
    }
    await this.memoryService.rememberTask(task, answer);
    const { passed, note } = review;
    return {
      goal,
      answer,
      passed,
      review: note,
      steps: context.steps,
      sandbox: root,
    };
  }
}
