import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'node:stream';
import { Repository } from 'typeorm';
import { ElasticService } from '../../shared/elastic/elastic.service';
import { KafkaService } from '../../shared/kafka/kafka.service';
import { LlmService } from '../../shared/llm/llm.service';
import { MetricsService } from '../../shared/metrics/metrics.service';
import { RedisService } from '../../shared/redis/redis.service';
import { S3Service } from '../../shared/s3/s3.service';
import { CACHE_KEY, INDEX, TOPIC } from './constants/notes.constants';
import { CreateDto } from './dto/create.dto';
import { Note } from './entity/note.entity';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note) private readonly notes: Repository<Note>,
    private readonly redisService: RedisService,
    private readonly elasticService: ElasticService,
    private readonly kafkaService: KafkaService,
    private readonly s3Service: S3Service,
    private readonly llmService: LlmService,
    private readonly metricsService: MetricsService,
  ) {}

  async create(body: CreateDto) {
    const note = await this.notes.save(this.notes.create(body));
    await this.dropCache();
    if (this.elasticService.enabled) {
      await this.elasticService.client.index({
        index: INDEX,
        id: String(note.id),
        document: { title: note.title, text: note.text },
      });
    }
    if (this.kafkaService.enabled) await this.kafkaService.send(TOPIC, note);
    this.metricsService.noteCreated();
    return note;
  }

  async list(): Promise<Note[]> {
    const redis = this.redisService.enabled ? this.redisService.client : null;
    const cached = await redis?.get(CACHE_KEY);
    if (cached) return JSON.parse(cached) as Note[];
    const notes = await this.notes.find({ order: { id: 'DESC' }, take: 100 });
    await redis?.set(CACHE_KEY, JSON.stringify(notes), 'EX', 30);
    return notes;
  }

  async get(id: number) {
    const note = await this.notes.findOneBy({ id });
    if (!note) throw new NotFoundException(`Нет заметки ${id}`);
    return note;
  }

  async attach(id: number, file: Express.Multer.File) {
    const note = await this.get(id);
    const name = Buffer.from(file.originalname, 'latin1').toString('utf8');
    note.file = `notes/${id}/${name}`;
    await this.s3Service.put(note.file, file.buffer, file.mimetype);
    await this.dropCache();
    return this.notes.save(note);
  }

  async download(id: number): Promise<{ name: string; stream: Readable }> {
    const { file } = await this.get(id);
    if (!file) throw new NotFoundException(`У заметки ${id} нет файла`);
    return {
      name: file.split('/').pop()!,
      stream: await this.s3Service.get(file),
    };
  }

  async summarize(id: number) {
    const note = await this.get(id);
    const summary = await this.llmService.chat(
      `Кратко перескажи заметку в одном предложении.\n\n${note.title}\n${note.text}`,
    );
    return { summary };
  }

  private async dropCache() {
    if (this.redisService.enabled)
      await this.redisService.client.del(CACHE_KEY);
  }
}
