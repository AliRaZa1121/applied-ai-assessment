import { applyDecorators, Controller, UseFilters } from '@nestjs/common';
import { ApiTags, ApiResponse } from '@nestjs/swagger';
import { HttpExceptionFilter } from '../exceptions/http.exception';
import { ErrorResponseDto } from 'src/utilities/swagger-responses/error-response';

type ApiRoutingArgs = {
  path?: string;
  tag?: string;
};

export function ApiRouting(args: ApiRoutingArgs) {
  return applyDecorators(
    ApiTags(args.tag || 'default'),
    Controller(args.path || ''),
    UseFilters(HttpExceptionFilter),
    ApiResponse({
      status: 400,
      description: 'Bad Request',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 404,
      description: 'Not Found',
      type: ErrorResponseDto,
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      type: ErrorResponseDto,
    }),
  );
}
