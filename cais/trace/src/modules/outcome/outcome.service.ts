import { Injectable } from '@nestjs/common';
import { STATES } from '../history/constants/history.constants';
import { History, State } from '../history/types/history.types';
import { RegressionService } from '../regression/regression.service';
import { OutcomeModel } from './types/outcome.types';

@Injectable()
export class OutcomeService {
  constructor(private readonly regressionService: RegressionService) {}

  fit({ steps }: History, space: string[][]): OutcomeModel {
    const x = steps.map((s) => this.features(space, s.state, s.actions));
    const y = steps.map((s) => s.reward);
    const split =
      steps.length >= 5 ? Math.floor(steps.length * 0.8) : steps.length;
    const trained = this.regressionService.fit(
      x.slice(0, split),
      y.slice(0, split),
    );
    const test = split < steps.length ? split : 0;
    const r2 = this.regressionService.r2(trained, x.slice(test), y.slice(test));
    const weights = this.regressionService.fit(x, y);
    const noise = y.map(
      (r, t) => r - this.regressionService.predict(weights, x[t]),
    );
    return { weights, noise, r2 };
  }

  features(space: string[][], state: State, actions: string[]) {
    const row = [1, ...STATES.map((s) => (s === state ? 1 : 0))];
    space.forEach((values, i) =>
      values.forEach((a) => row.push(actions[i] === a ? 1 : 0)),
    );
    return row;
  }

  reward(
    model: OutcomeModel & { actions: string[][] },
    t: number,
    state: State,
    actions: string[],
  ) {
    const row = this.features(model.actions, state, actions);
    return this.regressionService.predict(model.weights, row) + model.noise[t];
  }
}
