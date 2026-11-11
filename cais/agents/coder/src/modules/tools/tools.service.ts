import { Injectable } from '@nestjs/common';
import { BusClientService } from '../../shared/bus-client/bus-client.service';
import { Tools } from '../agent/types/agent.types';
import { FilesService } from '../files/files.service';
import { ShellService } from '../shell/shell.service';
import { Found } from './types/tools.types';

@Injectable()
export class ToolsService {
  constructor(
    private readonly filesService: FilesService,
    private readonly shellService: ShellService,
    private readonly busClientService: BusClientService,
  ) {}

  create(root: string): Tools {
    const tools = {
      ...this.filesService.tools(root),
      ...this.shellService.tools(root),
    };
    if (!this.busClientService.enabled) return tools;
    return {
      ...tools,
      search: {
        args: ['query'],
        description: 'поиск по базе знаний (документация, примеры кода)',
        run: ({ query }) => this.search(query),
      },
    };
  }

  private async search(query: string) {
    const { hits } = await this.busClientService.request<Found>(
      'ebrb',
      'facts.search',
      { query, limit: 3 },
    );
    const text = hits.map((hit) => `[${hit.title}]\n${hit.text}`).join('\n\n');
    return text || '(ничего не найдено)';
  }
}
