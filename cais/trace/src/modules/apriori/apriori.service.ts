import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';
import { ItemsetsService } from '../itemsets/itemsets.service';
import { MeasuresService } from '../measures/measures.service';
import { ObservationsService } from '../observations/observations.service';
import { APRIORI_DEFAULTS } from './constants/apriori.constants';
import { AprioriDto } from './dto/apriori.dto';

@Injectable()
export class AprioriService {
  constructor(
    private readonly itemsetsService: ItemsetsService,
    private readonly measuresService: MeasuresService,
    private readonly observationsService: ObservationsService,
    private readonly eventsService: EventsService,
  ) {}

  async analyze(body: AprioriDto) {
    const minSupport = body.minSupport ?? APRIORI_DEFAULTS.minSupport;
    const { factors, observations } = body.observations
      ? this.observationsService.fromBinary(body.observations)
      : this.observationsService.fromEvents(
          await this.eventsService.find({ minutes: body.minutes }),
        );
    const matrix = this.itemsetsService.matrix(observations, factors);
    const methods = this.measuresService.select(
      observations,
      factors,
      body.expertPairs ?? [],
      body.clusters ?? APRIORI_DEFAULTS.clusters,
      body.weights ?? APRIORI_DEFAULTS.weights,
    );
    return {
      observations: observations.length,
      itemsets: this.itemsetsService.frequent(
        observations,
        factors,
        minSupport,
        body.maxSize ?? APRIORI_DEFAULTS.maxSize,
      ),
      matrix,
      graph: this.itemsetsService.graph(matrix, minSupport),
      methods,
      best: methods[0]?.name,
    };
  }
}
