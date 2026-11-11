import { Injectable } from '@nestjs/common';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve, sep } from 'node:path';
import { Tools } from '../agent/types/agent.types';

@Injectable()
export class FilesService {
  inside(root: string, path = '.') {
    const full = resolve(root, path);
    if (full !== resolve(root) && !full.startsWith(resolve(root) + sep)) {
      throw new Error(`путь вне песочницы: ${path}`);
    }
    return full;
  }

  limit(text: string, size = 4000) {
    return text.length > size ? `${text.slice(0, size)}\n…обрезано` : text;
  }

  tools(root: string): Tools {
    return {
      list: {
        args: ['path'],
        description: 'список файлов папки',
        run: async ({ path }) => {
          const entries = await readdir(this.inside(root, path), {
            recursive: true,
            withFileTypes: true,
          });
          const files = entries
            .filter((e) => e.isFile() && !e.parentPath.includes('node_modules'))
            .map((e) => relative(root, resolve(e.parentPath, e.name)));
          return files.join('\n') || '(пусто)';
        },
      },
      read: {
        args: ['path'],
        description: 'прочитать файл',
        run: async ({ path }) =>
          this.limit(await readFile(this.inside(root, path), 'utf8')),
      },
      write: {
        args: ['path', 'content'],
        description: 'создать или перезаписать файл',
        run: async ({ path, content }) => {
          const full = this.inside(root, path);
          await mkdir(dirname(full), { recursive: true });
          await writeFile(full, String(content));
          return `записано ${String(content).length} символов в ${path}`;
        },
      },
    };
  }
}
