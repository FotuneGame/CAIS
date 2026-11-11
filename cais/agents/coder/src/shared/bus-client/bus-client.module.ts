import { Global, Module } from '@nestjs/common';
import { BusClientService } from './bus-client.service';

@Global()
@Module({
  providers: [BusClientService],
  exports: [BusClientService],
})
export class BusClientModule {}
