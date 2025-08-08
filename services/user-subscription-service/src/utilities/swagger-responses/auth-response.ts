import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class UserResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class LoginResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  @ApiProperty()
  user: UserResponse;
}

export class ForgetPasswordVerificationResponseDTO {
  @ApiProperty()
  @IsUUID('4')
  token: string;
}

export class ResendOTPResponseDTO {
  @ApiProperty()
  @IsUUID('4')
  token: string;
}

export class RefreshTokenResponseDTO {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
