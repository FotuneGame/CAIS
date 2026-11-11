import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { Injectable } from '@nestjs/common';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { AuditService } from '../audit/audit.service';
import { CheckService } from '../check/check.service';
import { DocsService } from '../docs/docs.service';
import { TaskService } from '../task/task.service';
import { Guard } from './types/mcp.types';

@Injectable()
export class McpService {
  constructor(
    private readonly auditService: AuditService,
    private readonly kafkaService: KafkaService,
    private readonly taskService: TaskService,
    private readonly docsService: DocsService,
    private readonly checkService: CheckService,
  ) {}

  create(user: string) {
    const server = new McpServer({ name: 'cais', version: '1.0.0' });
    const guard = this.guard(user);
    for (const group of [
      this.taskService,
      this.docsService,
      this.checkService,
    ]) {
      group.register(server, guard, user);
    }
    return server;
  }

  private guard(user: string): Guard {
    return (name, run) => async (args) => {
      const input =
        typeof args === 'object' && args !== null && 'signal' in args
          ? {}
          : args;
      await this.auditService.record(user, name, input, 'start');
      const { outcome, result } = await run(args).then(
        (data) => ({ outcome: 'ok', result: this.text(data) }),
        (error: Error) => ({
          outcome: `error: ${error.message}`,
          result: this.failure(error),
        }),
      );
      await this.auditService.record(user, name, input, outcome);
      this.kafkaService.publish({ type: 'tool', user, tool: name, outcome });
      return result;
    };
  }

  private text(data: unknown): CallToolResult {
    return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
  }

  private failure(error: Error): CallToolResult {
    return { isError: true, content: [{ type: 'text', text: error.message }] };
  }
}
