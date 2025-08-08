import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID } from 'class-validator';

export class ForgetPasswordRequestDTO {
  @ApiProperty({
    example: 'string@gmail.com',
  })
  @IsEmail()
  email: string;
}
