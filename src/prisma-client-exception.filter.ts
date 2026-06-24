import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[]) || [];
        const fieldName = target.join(', ');
        response.status(status).json({
          statusCode: status,
          message: `Dữ liệu bị trùng lặp ở trường duy nhất: ${fieldName || 'unique constraint'}.`,
          error: 'Conflict',
        });
        break;
      }
      case 'P2025': {
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message: (exception.meta?.cause as string) || 'Không tìm thấy bản ghi yêu cầu.',
          error: 'Not Found',
        });
        break;
      }
      case 'P2003': {
        const status = HttpStatus.BAD_REQUEST;
        response.status(status).json({
          statusCode: status,
          message: 'Lỗi ràng buộc khóa ngoại (foreign key constraint failed).',
          error: 'Bad Request',
        });
        break;
      }
      default: {
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(status).json({
          statusCode: status,
          message: 'Lỗi cơ sở dữ liệu xảy ra.',
          error: 'Internal Server Error',
        });
        break;
      }
    }
  }
}
