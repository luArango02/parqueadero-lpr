import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

// Los errores inesperados se registran en el log, pero al cliente no se le muestran detalles internos.
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpError = exception instanceof HttpException;
    const status = isHttpError
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = isHttpError
      ? this.extractMessage(exception)
      : 'Error interno del servidor';

    if (!isHttpError) {
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private extractMessage(exception: HttpException): string | string[] {
    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }
    const { message } = body as { message?: string | string[] };
    return message ?? exception.message;
  }
}
