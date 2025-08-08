import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { Logger } from 'src/helpers/logger.helper';
import { ErrorApiWrapperInterface } from 'src/utilities/interfaces/response.interface';

@Catch(HttpException, Error)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response: any = ctx.getResponse<Response>();

    if (!(exception instanceof HttpException)) {
      Logger.Error(exception.stack ? exception.stack : exception, 'ERROR');

      let errorMessages = 'Something went wrong!';

      if (process.env.APP_DEBUG === 'true') {
        errorMessages = exception.message;
      }

      const ResponseToSend: ErrorApiWrapperInterface = {
        message: [errorMessages],
        error: errorMessages,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        jsonApiVersion: {
          version: process.env.APP_VERSION || '1.0.0',
        },
      };

      response.__ss_body = ResponseToSend;
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(ResponseToSend);

      return;
    } else {
      const status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      if (
        exception instanceof BadRequestException &&
        exceptionResponse.message &&
        Array.isArray(exceptionResponse.message)
      ) {
        const ResponseToSend: ErrorApiWrapperInterface = {
          message: [...exceptionResponse.message],
          error: 'Please check your request body',
          statusCode: exception.getStatus(),
          jsonApiVersion: {
            version: process.env.APP_VERSION || '1.0.0',
          },
        };

        response.__ss_body = ResponseToSend;
        response.status(status).json(ResponseToSend);
      } else if (
        exception instanceof HttpException &&
        Boolean(exceptionResponse.message)
      ) {
        const ResponseToSend: ErrorApiWrapperInterface = {
          message: [exceptionResponse.message],
          error: exceptionResponse.message,
          statusCode: exception.getStatus(),
          jsonApiVersion: {
            version: process.env.APP_VERSION || '1.0.0',
          },
        };

        response.__ss_body = ResponseToSend;
        response.status(status).json(ResponseToSend);
      } else {
        Logger.Fatal(exception.stack ? exception.stack : exception, 'ERROR');
        const ResponseToSend: ErrorApiWrapperInterface = {
          message: [`Unprocessable Entity, Please contact support`],
          error: `Unprocessable Entity, Please contact support`,
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          jsonApiVersion: {
            version: process.env.APP_VERSION || '1.0.0',
          },
        };
        response.__ss_body = ResponseToSend;
        response.status(HttpStatus.UNPROCESSABLE_ENTITY).json(ResponseToSend);
        return;
      }
    }
  }
}
