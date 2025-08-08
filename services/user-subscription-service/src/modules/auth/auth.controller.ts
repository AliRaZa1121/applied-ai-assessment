import { Body, HttpStatus, Post } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ApiRouting } from 'src/core/decorators/api-controller.decorator';
import {
  LoginResponseDto,
  RefreshTokenResponseDTO,
} from 'src/modules/auth/dto/auth-response';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import AuthService from './auth.service';
import { ForgetPasswordRequestDTO } from './dto/forget-password.dto';
import { RefreshAccessTokenRequestDTO } from './dto/refresh-token.dto';
import ResetPasswordRequestDTO from './dto/reset-password.dto';
import { LoginRequestDTO } from './dto/signin.dto';
import { SignupRequestDTO } from './dto/signup.dto';

@ApiRouting({ tag: 'Auth', path: '/auth' })
export default class AuthController {
  constructor(private _authService: AuthService) {}

  @Post('/login')
  @ApiResponse({ status: HttpStatus.OK, type: LoginResponseDto })
  Login(
    @Body() data: LoginRequestDTO,
  ): Promise<BaseResponseDto<LoginResponseDto>> {
    return this._authService.login(data);
  }

  @Post('/signup')
  @ApiResponse({ status: HttpStatus.OK, type: LoginResponseDto })
  Signup(
    @Body() data: SignupRequestDTO,
  ): Promise<BaseResponseDto<LoginResponseDto>> {
    return this._authService.signup(data);
  }

  @Post('/forget-password')
  @ApiResponse({ status: HttpStatus.OK, type: BaseResponseDto })
  ForgetPassword(
    @Body() data: ForgetPasswordRequestDTO,
  ): Promise<BaseResponseDto<void>> {
    return this._authService.forgetPassword(data);
  }

  @Post('/resend-link')
  @ApiResponse({ status: HttpStatus.OK, type: BaseResponseDto })
  ResendOTP(
    @Body() data: ForgetPasswordRequestDTO,
  ): Promise<BaseResponseDto<void>> {
    return this._authService.forgetPassword(data);
  }

  @Post('/reset-password')
  @ApiResponse({ status: HttpStatus.OK, type: BaseResponseDto })
  async ResetPassword(
    @Body() data: ResetPasswordRequestDTO,
  ): Promise<BaseResponseDto<void>> {
    return this._authService.resetPassword(data);
  }

  @Post('/refresh-token')
  @ApiResponse({ status: HttpStatus.OK, type: RefreshTokenResponseDTO })
  RefreshToken(
    @Body() data: RefreshAccessTokenRequestDTO,
  ): Promise<BaseResponseDto<RefreshTokenResponseDTO>> {
    return this._authService.refreshAccessToken(data);
  }
}
