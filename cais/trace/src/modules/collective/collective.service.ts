import { Injectable } from '@nestjs/common';
import { CausalService } from '../causal/causal.service';
import { CausalModel } from '../causal/types/causal.types';
import { History } from '../history/types/history.types';
import { InformationService } from '../information/information.service';
import { Collective, Outcome, Synergy } from './types/collective.types';

@Injectable()
export class CollectiveService {
  constructor(
    private readonly informationService: InformationService,
    private readonly causalService: CausalService,
  ) {}

  measure(
    history: History,
    model: CausalModel,
    outcome: Outcome,
    phi: number[],
    threshold: number,
  ): Collective {
    const n = history.agents.length;
    const all = Array.from({ length: n }, (_, i) => i);
    const yA = outcome(all);
    const synergy: Synergy[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const without = all.filter((k) => k !== i && k !== j);
        const sigma = yA - outcome(without) - phi[i] - phi[j];
        synergy.push({ pair: [history.agents[i], history.agents[j]], sigma });
      }
    }
    const singles = all.reduce((sum, i) => sum + outcome([i]), 0);
    const denominator = Math.max(Math.abs(yA), Math.abs(singles));
    return {
      si: denominator ? (yA - singles) / denominator : 0,
      cs: this.coordination(history, model),
      ii: this.integration(history, model),
      interactions: synergy.filter((s) => Math.abs(s.sigma) > threshold),
      synergy,
    };
  }

  coordination({ steps }: History, model: CausalModel) {
    if (steps.length < 2) return 0;
    const encode = (actions: string[]) =>
      model.actions.flatMap((space, i) =>
        space.map((a) => (actions[i] === a ? 1 : 0)),
      );
    let sum = 0;
    for (let t = 1; t < steps.length; t++) {
      sum += this.informationService.correlation(
        encode(steps[t].actions),
        encode(steps[t - 1].actions),
      );
    }
    return sum / (steps.length - 1);
  }

  integration({ agents, steps }: History, model: CausalModel) {
    if (steps.length < 2) return 0;
    const rows = steps.slice(1);
    let total = 0;
    agents.forEach((_, i) =>
      agents.forEach((__, j) => {
        if (i === j) return;
        const parents = [
          ...new Set([...model.parents[i], ...model.parents[j]]),
        ].sort((a, b) => a - b);
        total += this.informationService.conditional(
          rows.map((s) => s.actions[i]),
          rows.map((s) => s.actions[j]),
          rows.map((s, t) =>
            this.causalService.key(parents, s.state, steps[t].actions),
          ),
        );
      }),
    );
    return total;
  }
}
