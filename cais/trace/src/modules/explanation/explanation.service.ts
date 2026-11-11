import { Injectable } from '@nestjs/common';
import { CRITICAL_SHOWN } from '../macie/constants/macie.constants';
import type {
  AgentEffect,
  MacieOptions,
  MacieReport,
  Verbosity,
} from '../macie/types/macie.types';

@Injectable()
export class ExplanationService {
  build(
    report: Omit<MacieReport, 'explanation'>,
    options: Pick<MacieOptions, 'si' | 'verbosity'>,
  ) {
    const f = (value: number) => value.toFixed(3);
    const { effects, collective, outcome, model } = report;
    const full = options.verbosity === 'full';
    const shown =
      options.verbosity === 'concise' ? effects.slice(0, 1) : effects;
    const lines: string[] = [];
    if (full) {
      lines.push(
        `Фактический исход Y = ${f(outcome)} за ${report.steps} шагов; R² модели исхода ${f(model.r2)}; межагентных связей: ${model.edges.length}; CS = ${f(collective.cs)}, II = ${f(collective.ii)}.`,
      );
    }
    lines.push(...shown.map((e) => this.agent(e, options.verbosity, f)));
    lines.push(
      collective.si > options.si
        ? `Обнаружена положительная эмерджентность: коллективный результат превышает сумму индивидуальных (SI = ${f(collective.si)} > ${options.si}).`
        : `Эмерджентность не обнаружена: SI = ${f(collective.si)}.`,
    );
    if (options.verbosity !== 'concise') {
      lines.push(
        ...collective.interactions.map((s) =>
          s.sigma > 0
            ? `${s.pair[0]} и ${s.pair[1]} действуют кооперативно: синергия σ = ${f(s.sigma)}.`
            : `${s.pair[0]} и ${s.pair[1]} мешают друг другу: синергия σ = ${f(s.sigma)}.`,
        ),
      );
    }
    const top = effects[0];
    if (top) {
      lines.push(
        `Без ${top.agent} исход изменится на ${f(-top.ate)}: с ${f(outcome)} до ${f(top.counterfactual)}.`,
      );
    }
    return lines;
  }

  private agent(
    e: AgentEffect,
    verbosity: Verbosity,
    f: (value: number) => string,
  ) {
    const sign = e.phi >= 0 ? 'положительный' : 'отрицательный';
    const share = (Math.abs(e.share) * 100).toFixed(1);
    const times =
      verbosity === 'full' ? e.critical : e.critical.slice(0, CRITICAL_SHOWN);
    const more = e.critical.length > times.length ? ' …' : '';
    const critical =
      verbosity !== 'concise' && times.length
        ? `; критические моменты: ${times.join(', ')}${more}`
        : '';
    return `${e.agent}: ${sign} вклад φ = ${f(e.phi)} (${share}%), 95% ДИ эффекта [${f(e.ci[0])}; ${f(e.ci[1])}]${critical}.`;
  }
}
