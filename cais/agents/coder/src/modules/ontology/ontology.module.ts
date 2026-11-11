import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { OntologyService } from './ontology.service';

@Module({
  imports: [FilesModule],
  providers: [OntologyService],
  exports: [OntologyService],
})
export class OntologyModule {}
