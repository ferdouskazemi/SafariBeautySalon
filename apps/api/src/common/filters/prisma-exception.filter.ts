import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import type { Response } from 'express';
import { Prisma } from '../../generated/prisma/client.js';

const KNOWN_ERRORS: Record<string, { status: HttpStatus; message: string }> = {
  P2002: { status: HttpStatus.CONFLICT, message: 'این مورد قبلاً ثبت شده است' },
  P2003: {
    status: HttpStatus.CONFLICT,
    message: 'این مورد در جای دیگری استفاده شده است. به جای حذف، آن را غیرفعال کنید',
  },
  P2025: { status: HttpStatus.NOT_FOUND, message: 'مورد درخواستی پیدا نشد' },
};

/** Maps database errors that reach the top level to clean HTTP responses. */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const known = KNOWN_ERRORS[error.code];
    if (!known) this.logger.error(error.message, error.stack);

    const status = known?.status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      message: known?.message ?? 'خطای داخلی سرور',
    });
  }
}
