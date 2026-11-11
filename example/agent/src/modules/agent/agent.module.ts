import { Module } from '@nestjs/common';
import { MemoryModule } from '../memory/memory.module';
import { OntologyModule } from '../ontology/ontology.module';
import { PromptsModule } from '../prompts/prompts.module';
import { ToolsModule } from '../tools/tools.module';
import { AgentController } from './agent.controller';
import { AgentService } from './agent.service';

@Module({
  imports: [MemoryModule, PromptsModule, ToolsModule, OntologyModule],
  controllers: [AgentController],
  providers: [AgentService],
})
export class AgentModule {}
