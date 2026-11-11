import { Module } from '@nestjs/common';
import { GateModule } from '../gate/gate.module';
import { OntologyModule } from '../ontology/ontology.module';
import { PlannerModule } from '../planner/planner.module';
import { ActService } from './act.service';

@Module({
  imports: [PlannerModule, GateModule, OntologyModule],
  providers: [ActService],
  exports: [ActService],
})
export class ActModule {}
