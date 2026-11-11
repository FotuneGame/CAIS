import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { ShellModule } from '../shell/shell.module';
import { ToolsService } from './tools.service';

@Module({
  imports: [FilesModule, ShellModule],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
