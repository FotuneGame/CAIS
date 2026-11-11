import { Global, Module } from '@nestjs/common';
import { BusServerService } from './bus-server.service';

@Global()
@Module({
  providers: [BusServerService],
  exports: [BusServerService],
})
export class BusServerModule {}
