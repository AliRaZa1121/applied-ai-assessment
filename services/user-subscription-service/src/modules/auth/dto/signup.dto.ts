import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsEmail, IsString, Length } from 'class-validator';

export class SignupRequestDTO {
  @ApiProperty()
  @IsDefined()
  @IsString()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    example: 'string@gmail.com',
    description: 'Email must be unique',
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
