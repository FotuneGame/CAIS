import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsModule } from '../stats/stats.module';
import { Note } from './entity/note.entity';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Note]), StatsModule],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
