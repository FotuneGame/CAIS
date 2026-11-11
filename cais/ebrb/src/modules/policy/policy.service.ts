import { Injectable } from '@nestjs/common';
import { Decision, Evaluation, Thresholds } from './types/policy.types';

@Injectable()
export class PolicyService {
  decide(
    { belief, ignorance, conflict, action, safe }: Evaluation,
    t: Thresholds,
  ): { decision: Decision; hypothesis: string | null; reason: string } {
    const [hypothesis, max] = Object.entries(belief).sort(
      (a, b) => b[1] - a[1],
    )[0] ?? [null, 0];
    const f = (value: number) => value.toFixed(2);
    const state = `βmax = ${f(max)}, βΘ = ${f(ignorance)}, C = ${f(conflict)}`;
    if (
      max >= t.confidence &&
      ignorance <= t.ignorance &&
      conflict <= t.conflict &&
      safe
    ) {
      return {
        decision: 'APPROVE',
        hypothesis,
        reason: `${state}, действие ${action} безопасно`,
      };
    }
    if (ignorance > t.ignorance || conflict > t.conflict) {
      return {
        decision: 'REFINE',
        hypothesis,
        reason: `нужно больше данных: ${state}`,
      };
    }
    const why = safe
      ? `βmax < ${t.confidence}`
      : `действие ${action ?? '—'} не в A_safe`;
    return {
      decision: 'ESCALATE',
      hypothesis,
      reason: `нужна проверка человеком: ${why}; ${state}`,
    };
  }
}
