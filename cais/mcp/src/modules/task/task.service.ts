import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { z } from 'zod';
import { BusClientService } from '../../shared/bus-client/bus-client.service';
import { InjectionService } from '../../shared/injection/injection.service';
import { Guard, ToolGroup } from '../mcp/types/mcp.types';
import { AGENT } from './constants/task.constants';
import { Run } from './types/task.types';

@Injectable()
export class TaskService implements ToolGroup {
  private readonly agents: string[];

  constructor(
    private readonly busClientService: BusClientService,
    private readonly injectionService: InjectionService,
    configService: ConfigService,
  ) {
    this.agents = configService.get<string[]>('services.agents', []);
  }

  register(server: McpServer, guard: Guard, owner: string) {
    server.registerTool(
      'agents',
      { description: 'Агенты CAIS, которым можно поручить задачу' },
      guard('agents', () => Promise.resolve(this.agents)),
    );
    server.registerTool(
      'task_start',
      {
        description:
          'Поручить задачу агенту (coder пишет и запускает код в песочнице). Ждёт до wait секунд, иначе вернёт id для task_result',
        inputSchema: {
          agent: AGENT,
          task: z.string().min(1).max(4000),
          wait: z.number().int().min(0).max(50).default(45),
        },
      },
      guard('task_start', async ({ agent, task, wait }) => {
        const findings = this.injectionService.findings(task);
        if (findings.length) {
          throw new Error(
            `задача отклонена, признаки инъекции: ${findings.join(', ')}`,
          );
        }
        const body = { task, wait, owner };
        return this.summary(
          await this.busClientService.request<Run>(
            this.agent(agent),
            'runs.start',
            body,
          ),
        );
      }),
    );
    server.registerTool(
      'task_result',
      {
        description: 'Состояние и результат задачи по id из task_start',
        inputSchema: { agent: AGENT, id: z.uuid() },
      },
      guard('task_result', async ({ agent, id }) =>
        this.summary(
          await this.busClientService.request<Run>(
            this.agent(agent),
            'runs.status',
            {
              id,
              owner,
            },
          ),
        ),
      ),
    );
  }

  private agent(name: string) {
    if (!this.agents.includes(name)) {
      throw new Error(`нет агента ${name}, есть: ${this.agents.join(', ')}`);
    }
    return name;
  }

  private summary(run: Run) {
    if (!run.result)
      return { id: run.id, status: run.status, error: run.error };
    const { goal, answer, passed, review, steps, sandbox } = run.result;
    return {
      id: run.id,
      status: run.status,
      goal: goal.goal,
      answer,
      passed,
      review,
      sandbox,
      steps: steps.map((step) => `${step.tool} → ${step.decision}`),
    };
  }
}
