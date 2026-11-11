import { Global, Module } from '@nestjs/common';
import { InjectionService } from './injection.service';

@Global()
@Module({
  providers: [InjectionService],
  exports: [InjectionService],
})
export class InjectionModule {}
