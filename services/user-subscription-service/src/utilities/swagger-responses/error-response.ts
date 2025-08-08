import { ApiProperty } from '@nestjs/swagger';
import { ErrorApiWrapperInterface } from '../interfaces/response.interface';
import { JsonApiVersion } from './base-response';

export class ErrorResponseDto implements ErrorApiWrapperInterface {
  @ApiProperty({ default: ['Error Message'] })
  message: string[];

  @ApiProperty({ default: 'Error Message' })
  error: string;

  @ApiProperty()
  statusCode: number;

  @ApiProperty({ default: { version: '1.0' } })
  jsonApiVersion: JsonApiVersion;
}
