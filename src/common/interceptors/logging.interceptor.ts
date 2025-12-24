import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
  const request = context.switchToHttp().getRequest<Request>();
  const { method, url, body } = request;
  const now = Date.now();

  this.logger.log(`➡️  ${method} ${url}`);

  // FIX: Added 'body &&' to check if body exists before calling Object.keys()
  if (process.env.NODE_ENV === 'development' && body && Object.keys(body).length) {
    this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
  }

  return next.handle().pipe(
    tap({
      next: () => {
        const responseTime = Date.now() - now;
        this.logger.log(`✅ ${method} ${url} - ${responseTime}ms`);
      },
      error: (error) => {
        const responseTime = Date.now() - now;
        this.logger.error(
          `❌ ${method} ${url} - ${responseTime}ms - ${error.message}`,
        );
      },
    }),
  );
}
}