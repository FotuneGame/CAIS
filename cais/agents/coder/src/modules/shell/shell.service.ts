import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Tools } from '../agent/types/agent.types';
import { FilesService } from '../files/files.service';
import { ExecError } from './types/shell.types';

@Injectable()
export class ShellService {
  private readonly timeoutMs: number;
  private readonly exec = promisify(execFile);

  constructor(
    private readonly filesService: FilesService,
    configService: ConfigService,
  ) {
    this.timeoutMs = configService.get<number>('agent.commandTimeoutMs', 60000);
  }

  tools(root: string): Tools {
    return {
      run: {
        args: ['command'],
        description: `команда sh в песочнице, таймаут ${this.timeoutMs / 1000} с (node, npm, тесты)`,
        run: ({ command }) => this.run(root, command),
      },
    };
  }

  private async run(root: string, command: string) {
    try {
      const { stdout, stderr } = await this.exec('sh', ['-c', command], {
        cwd: root,
        timeout: this.timeoutMs,
        maxBuffer: 1 << 20,
      });
      return this.filesService.limit(`код 0\n${stdout}${stderr}`);
    } catch (error) {
      const e = error as ExecError;
      const output = `${e.stdout ?? ''}${e.stderr ?? e.message}`;
      return this.filesService.limit(`код ${e.code ?? 'timeout'}\n${output}`);
    }
  }
}
