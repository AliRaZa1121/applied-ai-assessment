import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsString, Length } from 'class-validator';

export class LoginRequestDTO {
  @ApiProperty({
    example: 'string@gmail.com',
  })
  @IsDefined()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @Length(6, 128)
  password: string;
}
