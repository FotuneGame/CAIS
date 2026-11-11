import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { OntologyService } from './ontology.service';

@Module({
  imports: [ToolsModule],
  providers: [OntologyService],
  exports: [OntologyService],
})
export class OntologyModule {}
