import { Injectable } from '@nestjs/common';
import { CausalService } from '../causal/causal.service';
import { CausalModel } from '../causal/types/causal.types';
import { HistoryService } from '../history/history.service';
import { History } from '../history/types/history.types';
import { OutcomeService } from '../outcome/outcome.service';
import { RandomService } from '../random/random.service';

@Injectable()
export class CounterfactualService {
  constructor(
    private readonly causalService: CausalService,
    private readonly outcomeService: OutcomeService,
    private readonly historyService: HistoryService,
    private readonly randomService: RandomService,
  ) {}

  factual(history: History) {
    return history.steps.map((s) => s.reward);
  }

  simulate(
    { steps }: History,
    model: CausalModel,
    replaced: Set<number>,
    rng: () => number,
  ) {
    let previous: string[] = [];
    let state = steps[0].state;
    return steps.map((step, t) => {
      const before = t ? steps[t - 1].actions : [];
      const actions = step.actions.map((action, i) => {
        if (replaced.has(i))
          return this.randomService.pick(model.actions[i], rng);
        const changed =
          state !== step.state ||
          model.parents[i].some((p) => previous[p] !== before[p]);
        return t && changed
          ? this.causalService.sample(model, i, state, previous, rng)
          : action;
      });
      const reward = this.outcomeService.reward(model, t, state, actions);
      previous = actions;
      state = this.historyService.state(reward);
      return reward;
    });
  }

  runs(
    history: History,
    model: CausalModel,
    replaced: Set<number>,
    k: number,
    rng: () => number,
  ) {
    return Array.from({ length: k }, () =>
      this.simulate(history, model, replaced, rng),
    );
  }

  total(rewards: number[]) {
    return rewards.reduce((a, b) => a + b, 0);
  }

  mean(runs: number[][]) {
    return runs.reduce((sum, run) => sum + this.total(run), 0) / runs.length;
  }

  cumulative(rewards: number[]) {
    let sum = 0;
    return rewards.map((r) => (sum += r));
  }

  key(members: number[]) {
    return [...members].sort((a, b) => a - b).join(',');
  }

  outcomes(
    history: History,
    model: CausalModel,
    k: number,
    rng: () => number,
    known = new Map<string, number>(),
  ) {
    return (members: number[]) => {
      const key = this.key(members);
      if (!known.has(key)) {
        const replaced = new Set(
          model.agents.map((_, i) => i).filter((i) => !members.includes(i)),
        );
        const runs = replaced.size ? k : 1;
        known.set(
          key,
          this.mean(this.runs(history, model, replaced, runs, rng)),
        );
      }
      return known.get(key)!;
    };
  }
}
