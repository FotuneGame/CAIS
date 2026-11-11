import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Client } from 'minio';
import { Readable } from 'node:stream';
import { ServicesConfig } from '../../config/services.config';
import { Connection } from '../health/types/health.types';

@Injectable()
export class S3Service implements Connection {
  readonly name = 's3';
  readonly enabled: boolean;
  private readonly s3?: Client;
  private readonly bucket: string;

  constructor(configService: ConfigService) {
    const { url, accessKey, secretKey, bucket } =
      configService.getOrThrow<ServicesConfig['s3']>('services.s3');
    this.bucket = bucket;
    this.enabled = Boolean(url);
    if (!url) return;
    const parsed = new URL(url);
    this.s3 = new Client({
      endPoint: parsed.hostname,
      port: Number(parsed.port) || undefined,
      useSSL: parsed.protocol === 'https:',
      accessKey,
      secretKey,
    });
  }

  get client(): Client {
    if (!this.s3)
      throw new ServiceUnavailableException('Сервис не настроен: S3_URL');
    return this.s3;
  }

  async put(key: string, body: Buffer, contentType: string) {
    await this.client.putObject(this.bucket, key, body, body.length, {
      'Content-Type': contentType,
    });
  }

  get(key: string): Promise<Readable> {
    return this.client.getObject(this.bucket, key);
  }

  async ping() {
    if (!(await this.client.bucketExists(this.bucket))) {
      throw new Error(`Нет bucket ${this.bucket}`);
    }
  }
}
