import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErpProcessingException } from '../exceptions/erp-processing.exception';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof ErpProcessingException) {
      response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        error: 'ERP_FAILURE',
        message: 'Falha temporária. Tente novamente.',
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (status === HttpStatus.BAD_REQUEST && typeof body === 'object') {
        const raw = body as Record<string, unknown>;
        const messages: string[] = Array.isArray(raw.message)
          ? (raw.message as string[])
          : [String(raw.message)];

        const details = messages.map((m) => {
          const parts = m.split(' ');
          return { field: parts[0], message: parts.slice(1).join(' ') || m };
        });

        response.status(status).json({ error: 'VALIDATION_ERROR', details });
        return;
      }

      response.status(status).json(body);
      return;
    }

    this.logger.error('Unhandled exception', exception);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: 'INTERNAL_ERROR',
      message: 'Unexpected error',
    });
  }
}
