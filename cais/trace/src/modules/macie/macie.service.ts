import { BadRequestException, Injectable } from '@nestjs/common';
import { CausalService } from '../causal/causal.service';
import { CollectiveService } from '../collective/collective.service';
import { CounterfactualService } from '../counterfactual/counterfactual.service';
import { EffectsService } from '../effects/effects.service';
import { EventsService } from '../events/events.service';
import { ExplanationService } from '../explanation/explanation.service';
import { HistoryService } from '../history/history.service';
import { History } from '../history/types/history.types';
import { RandomService } from '../random/random.service';
import { ShapleyService } from '../shapley/shapley.service';
import { MacieOptions, MacieReport } from './types/macie.types';

@Injectable()
export class MacieService {
  constructor(
    private readonly eventsService: EventsService,
    private readonly historyService: HistoryService,
    private readonly causalService: CausalService,
    private readonly counterfactualService: CounterfactualService,
    private readonly effectsService: EffectsService,
    private readonly shapleyService: ShapleyService,
    private readonly collectiveService: CollectiveService,
    private readonly explanationService: ExplanationService,
    private readonly randomService: RandomService,
  ) {}

  async analyze(options: MacieOptions) {
    const events = await this.eventsService.find({ minutes: options.minutes });
    return this.explain(this.historyService.build(events), options);
  }

  explain(history: History, options: MacieOptions): MacieReport {
    if (!history.agents.length || history.steps.length < 2) {
      throw new BadRequestException(
        'мало событий для анализа: нужно хотя бы 2 шага',
      );
    }
    const rng = this.randomService.create(options.seed);
    const cf = this.counterfactualService;
    const model = this.causalService.fit(history);
    const n = history.agents.length;
    const all = Array.from({ length: n }, (_, i) => i);
    const effects = this.effectsService.estimate(history, model, options, rng);
    const ate = effects.map((e) => e.ate);
    const known = new Map(
      effects.map((e, i) => [
        cf.key(all.filter((j) => j !== i)),
        e.counterfactual,
      ]),
    );
    const outcome = cf.outcomes(history, model, options.k, rng, known);
    const empty = outcome([]);
    const m = options.m ?? Math.ceil(n * Math.log(Math.max(2, n)));
    const shapley = options.shapley
      ? this.shapleyService.compute(n, (c) => outcome(c) - empty, m, rng)
      : ate;
    const collective = this.collectiveService.measure(
      history,
      model,
      outcome,
      ate,
      options.synergy,
    );
    const z = shapley.reduce((sum, phi) => sum + Math.abs(phi), 0);
    const ranked = effects
      .map((e, i) => ({
        agent: history.agents[i],
        phi: shapley[i],
        share: z > 0 ? shapley[i] / z : 1 / n,
        ...e,
      }))
      .sort((a, b) => Math.abs(b.phi) - Math.abs(a.phi));
    const gain = outcome(all) - empty;
    const total = shapley.reduce((a, b) => a + b, 0);
    const report = {
      agents: history.agents,
      steps: history.steps.length,
      outcome: outcome(all),
      model: {
        r2: model.r2,
        edges: model.edges.map(
          ([i, j]) =>
            [history.agents[i], history.agents[j]] as [string, string],
        ),
      },
      effects: ranked,
      collective,
      efficiency: { gain, shapley: total, residual: gain - total },
      emergence: collective.si > options.si,
    };
    return {
      ...report,
      explanation: this.explanationService.build(report, options),
    };
  }
}
