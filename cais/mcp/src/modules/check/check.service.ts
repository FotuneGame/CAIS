import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { BusClientService } from '../../shared/bus-client/bus-client.service';
import { AuditService } from '../audit/audit.service';
import { Guard, ToolGroup } from '../mcp/types/mcp.types';

@Injectable()
export class CheckService implements ToolGroup {
  constructor(
    private readonly busClientService: BusClientService,
    private readonly auditService: AuditService,
  ) {}

  register(server: McpServer, guard: Guard) {
    server.registerTool(
      'action_check',
      {
        description:
          'Оценить действие базой правил EBRB: LLM извлекает атрибуты из описания, ответ — гипотеза эксперта (например ALLOW, BLOCK) или ESCALATE',
        inputSchema: { action: z.string().min(1).max(4000) },
      },
      guard('action_check', ({ action }) =>
        this.busClientService.request('ebrb', 'infer', { input: action }),
      ),
    );
    server.registerTool(
      'group_report',
      {
        description: 'Отчёт о поведении агентов: свойства группы и аномалии',
        inputSchema: {
          minutes: z.number().int().min(1).max(10080).default(60),
        },
      },
      guard('group_report', (args) =>
        this.busClientService.request('trace', 'report', args),
      ),
    );
    server.registerTool(
      'audit_check',
      {
        description:
          'Проверить целостность журнала вызовов MCP (цепочка хешей)',
      },
      guard('audit_check', () => this.auditService.verify()),
    );
  }
}
