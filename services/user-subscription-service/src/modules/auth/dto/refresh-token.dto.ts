import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class RefreshAccessTokenRequestDTO {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}
