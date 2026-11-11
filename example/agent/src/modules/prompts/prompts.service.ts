import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { defaultPrompts, PromptName } from './constants/prompts.constants';
import { Prompt } from './entity/prompt.entity';

@Injectable()
export class PromptsService implements OnModuleInit {
  private texts: Record<string, string> = { ...defaultPrompts };
  private readonly agent: string;

  constructor(
    @InjectRepository(Prompt) private readonly prompts: Repository<Prompt>,
    configService: ConfigService,
  ) {
    this.agent = configService.get<string>('app.name', 'coder');
  }

  async onModuleInit() {
    const existing = await this.prompts.findBy({ agent: this.agent });
    const names = new Set(existing.map((prompt) => prompt.name));
    const missing = Object.entries(defaultPrompts)
      .filter(([name]) => !names.has(name))
      .map(([name, text]) => ({ agent: this.agent, name, text }));
    if (missing.length) await this.prompts.save(missing);
    await this.reload();
  }

  async reload() {
    const rows = await this.prompts.findBy({ agent: this.agent });
    const saved = Object.fromEntries(rows.map((row) => [row.name, row.text]));
    this.texts = { ...defaultPrompts, ...saved };
    return this.texts;
  }

  async update(name: PromptName, text: string) {
    await this.prompts.save({ agent: this.agent, name, text });
    return this.reload();
  }

  text(name: PromptName, vars: Record<string, string | number> = {}) {
    return this.texts[name].replace(/\{(\w+)\}/g, (all, key: string) =>
      key in vars ? String(vars[key]) : all,
    );
  }
}
