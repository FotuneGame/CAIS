import { Module } from '@nestjs/common';
import { FilesModule } from '../files/files.module';
import { ShellService } from './shell.service';

@Module({
  imports: [FilesModule],
  providers: [ShellService],
  exports: [ShellService],
})
export class ShellModule {}
