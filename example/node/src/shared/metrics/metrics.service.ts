import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, register } from 'prom-client';

collectDefaultMetrics();

const notesCreated = new Counter({
  name: 'notes_created_total',
  help: 'Созданные заметки',
});

@Injectable()
export class MetricsService {
  readonly contentType = register.contentType;

  noteCreated() {
    notesCreated.inc();
  }

  metrics() {
    return register.metrics();
  }
}
