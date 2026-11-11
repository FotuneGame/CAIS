import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { ConsumerService } from './consumer.service';

@Module({
  imports: [EventsModule],
  providers: [ConsumerService],
  exports: [ConsumerService],
})
export class ConsumerModule {}
