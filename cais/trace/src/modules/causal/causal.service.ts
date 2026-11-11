import { Injectable } from '@nestjs/common';
import { IDLE } from '../history/constants/history.constants';
import { History, State } from '../history/types/history.types';
import { InformationService } from '../information/information.service';
import { OutcomeService } from '../outcome/outcome.service';
import { RandomService } from '../random/random.service';
import { CausalModel } from './types/causal.types';

@Injectable()
export class CausalService {
  constructor(
    private readonly outcomeService: OutcomeService,
    private readonly informationService: InformationService,
    private readonly randomService: RandomService,
  ) {}

  fit(history: History): CausalModel {
    const { agents, steps } = history;
    const actions = agents.map((_, i) => [
      ...new Set([IDLE, ...steps.map((s) => s.actions[i])]),
    ]);
    const model: CausalModel = {
      agents,
      actions,
      ...this.outcomeService.fit(history, actions),
      parents: [],
      edges: [],
      conditionals: [],
      marginals: [],
    };
    const column = (i: number, from: number, to: number) =>
      steps.slice(from, to).map((s) => s.actions[i]);
    agents.forEach((_, j) => {
      model.parents[j] = agents
        .map((__, i) => i)
        .filter((i) => i !== j)
        .filter((i) =>
          this.informationService.dependent(
            column(i, 0, steps.length - 1),
            column(j, 1, steps.length),
          ),
        );
      model.parents[j].forEach((i) => model.edges.push([i, j]));
      model.marginals[j] = this.informationService.counts(
        column(j, 0, steps.length),
      );
      model.conditionals[j] = new Map();
      steps.slice(1).forEach((step, t) => {
        const key = this.key(model.parents[j], step.state, steps[t].actions);
        const counts = model.conditionals[j].get(key) ?? new Map();
        counts.set(step.actions[j], (counts.get(step.actions[j]) ?? 0) + 1);
        model.conditionals[j].set(key, counts);
      });
    });
    return model;
  }

  sample(
    model: CausalModel,
    j: number,
    state: State,
    previous: string[],
    rng: () => number,
  ) {
    const counts = model.conditionals[j].get(
      this.key(model.parents[j], state, previous),
    );
    return this.randomService.sample(counts ?? model.marginals[j], rng);
  }

  key(parents: number[], state: State, previous: string[]) {
    return [state, ...parents.map((i) => previous[i])].join('\u0001');
  }
}
