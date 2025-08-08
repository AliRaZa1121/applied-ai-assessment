import { ApiProperty } from '@nestjs/swagger';
import { SuccessApiWrapperInterface } from '../interfaces/response.interface';

export class JsonApiVersion {
  @ApiProperty()
  version: string;
}

export class BaseResponseDto<TData>
  implements SuccessApiWrapperInterface<TData>
{
  @ApiProperty({ default: ['Success'] })
  message?: string[];

  @ApiProperty()
  data: TData | null;

  @ApiProperty({ default: 200 })
  statusCode: number;

  @ApiProperty({ default: { version: '1.0' } })
  jsonApiVersion: JsonApiVersion;
}
