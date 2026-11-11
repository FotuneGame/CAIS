import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { WinstonService } from '../../shared/logger/winston.service';

const quiet = ['/health', '/metrics'];

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: WinstonService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const { method, url } = context.switchToHttp().getRequest<Request>();
    if (quiet.some((path) => url.startsWith(path))) return next.handle();
    const started = Date.now();
    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - started;
        this.logger.log(`${method} ${url}`, 'HTTP', { durationMs });
      }),
      catchError((error: Error) => {
        const durationMs = Date.now() - started;
        this.logger.warn(`${method} ${url}: ${error.message}`, 'HTTP', {
          durationMs,
        });
        return throwError(() => error);
      }),
    );
  }
}
