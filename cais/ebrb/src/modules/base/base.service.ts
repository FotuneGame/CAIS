import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'node:fs/promises';
import { WinstonService } from '../../shared/logger/winston.service';
import { ActionsService } from '../actions/actions.service';
import { AttributesService } from '../attributes/attributes.service';
import { RulesService } from '../rules/rules.service';
import { BaseDto } from './dto/base.dto';

@Injectable()
export class BaseService implements OnApplicationBootstrap {
  constructor(
    private readonly attributesService: AttributesService,
    private readonly actionsService: ActionsService,
    private readonly rulesService: RulesService,
    private readonly logger: WinstonService,
    private readonly configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    if (this.rulesService.current().length) return;
    const dataPath = this.configService.get<string>(
      'app.appDataPath',
      './app-data',
    );
    const text = await readFile(`${dataPath}/base.json`, 'utf8').catch(
      () => '',
    );
    if (!text) return;
    try {
      const result = await this.import(JSON.parse(text) as BaseDto);
      this.logger.log(
        `база загружена из base.json: ${result.rules} правил`,
        'Base',
      );
    } catch (error) {
      const { message, stack } = error as Error;
      this.logger.error(`base.json не загружен: ${message}`, stack, 'Base');
    }
  }

  async import({ attributes, actions, rules }: BaseDto) {
    if (attributes.length) await this.attributesService.save(attributes);
    if (actions.length) await this.actionsService.save(actions);
    if (rules.length) await this.rulesService.save(rules);
    return {
      attributes: attributes.length,
      actions: actions.length,
      rules: rules.length,
    };
  }

  export() {
    return {
      attributes: this.attributesService.current(),
      actions: this.actionsService.current(),
      rules: this.rulesService.current(),
      hypotheses: this.rulesService.hypotheses(),
    };
  }
}
