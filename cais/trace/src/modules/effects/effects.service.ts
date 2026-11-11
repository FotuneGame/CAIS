import { Injectable } from '@nestjs/common';
import { BootstrapService } from '../bootstrap/bootstrap.service';
import { CausalModel } from '../causal/types/causal.types';
import { CounterfactualService } from '../counterfactual/counterfactual.service';
import { History } from '../history/types/history.types';
import { Effect } from './types/effects.types';

@Injectable()
export class EffectsService {
  constructor(
    private readonly counterfactualService: CounterfactualService,
    private readonly bootstrapService: BootstrapService,
  ) {}

  estimate(
    history: History,
    model: CausalModel,
    options: { k: number; b: number; epsilon: number },
    rng: () => number,
  ): Effect[] {
    const cf = this.counterfactualService;
    const factual = cf.factual(history);
    const factualCurve = cf.cumulative(factual);
    const outcome = cf.total(factual);
    return history.agents.map((_, i) => {
      const runs = cf.runs(history, model, new Set([i]), options.k, rng);
      const counterfactual = cf.mean(runs);
      const critical = new Set<string>();
      for (const run of runs) {
        cf.cumulative(run).forEach((y, t) => {
          if (Math.abs(y - factualCurve[t]) > options.epsilon) {
            critical.add(history.steps[t].time);
          }
        });
      }
      const differences = factual.map(
        (r, t) => r - runs.reduce((sum, run) => sum + run[t], 0) / options.k,
      );
      return {
        ate: outcome - counterfactual,
        counterfactual,
        critical: [...critical].sort(),
        ci: this.bootstrapService.interval(differences, options.b, rng),
      };
    });
  }
}
