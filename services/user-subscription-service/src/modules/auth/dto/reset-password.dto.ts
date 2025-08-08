import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export default class ResetPasswordRequestDTO {
  @ApiProperty()
  @IsNotEmpty()
  token: string;

  @ApiProperty()
  @Length(1, 255)
  password: string;
}
