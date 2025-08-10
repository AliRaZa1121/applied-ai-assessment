import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenReason, TokenStatus, User } from '@prisma/client';
import RedisService from 'src/apps/cache/redis.service';
import { NotificationIntegrationService } from 'src/apps/notification-integration/notification-integration.service';
import DatabaseService from 'src/database/database.service';
import { ComparePassword, HashPassword } from 'src/helpers/hashing.helper';
import {
  LoginResponseDto,
  RefreshTokenResponseDTO,
  UserResponse,
} from 'src/modules/auth/dto/auth-response';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { SendMailMessageInterface } from 'src/utilities/interfaces/notifications/mail-interface';
import { UserAuthInterface, UserAuthTokenInterface } from 'src/utilities/interfaces/user.interface';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import { TokenService } from '../tokens/token.service';
import { ForgetPasswordRequestDTO } from './dto/forget-password.dto';
import { RefreshAccessTokenRequestDTO } from './dto/refresh-token.dto';
import ResetPasswordRequestDTO from './dto/reset-password.dto';
import { LoginRequestDTO } from './dto/signin.dto';
import { SignupRequestDTO } from './dto/signup.dto';
@Injectable()
export default class AuthService {
  constructor(
    private _databaseService: DatabaseService, // Prisma database service
    private _jwtService: JwtService,
    private _configService: ConfigService,
    private _tokenService: TokenService,
    private _notificationService: NotificationIntegrationService,
    private _redisCacheService: RedisService,
  ) { }

  // Signup logic
  async signup(
    payload: SignupRequestDTO,
  ): Promise<BaseResponseDto<LoginResponseDto>> {
    const { name, email, password } = payload;
    const existingUser = await this._databaseService.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashPassword = await HashPassword(password);

    const user = await this._databaseService.user.create({
      data: {
        name,
        email,
        password: hashPassword,
      },
    });

    const userResponse: UserResponse = {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const { accessToken, refreshToken } =
      await this.createAccessTokenRefreshTokenPair(user);
    const data: LoginResponseDto = {
      accessToken,
      refreshToken,
      user: userResponse,
    };

    return successApiWrapper(
      data,
      `Account registered successfully`,
      HttpStatus.CREATED,
    );
  }

  // Login logic
  async login(
    payload: LoginRequestDTO,
  ): Promise<BaseResponseDto<LoginResponseDto>> {
    const { email, password } = payload;

    const user = await this._databaseService.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    const isPasswordMatched = await ComparePassword(password, user.password);
    if (!isPasswordMatched) {
      throw new BadRequestException('Password does not match');
    }

    const { accessToken, refreshToken } =
      await this.createAccessTokenRefreshTokenPair(user);

    const userResponse: UserResponse = {
      id: user.id.toString(),
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    const data: LoginResponseDto = {
      accessToken,
      refreshToken,
      user: userResponse,
    };

    return successApiWrapper(data, `Login successfully`, HttpStatus.OK);
  }

  // Forget password logic
  async forgetPassword(
    payload: ForgetPasswordRequestDTO,
  ): Promise<BaseResponseDto<void>> {
    const { email } = payload;
    const user = await this._databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User does not exist');
    }

    await this._databaseService.token.deleteMany({
      where: {
        userId: user.id,
        reason: TokenReason.FORGOT_PASSWORD,
      },
    });

    const token = await this._tokenService.createPasswordToken({
      userId: user.id,
      reason: TokenReason.FORGOT_PASSWORD,
    });

    await this._sendForgetPasswordEmail(user, token);
    return successApiWrapper(
      null,
      `Password reset link sent successfully`,
      HttpStatus.OK,
    );
  }

  // Reset password logic
  async resetPassword(
    data: ResetPasswordRequestDTO,
  ): Promise<BaseResponseDto<void>> {
    const token = await this._tokenService.getToken({
      identifier: data.token,
      reason: TokenReason.FORGOT_PASSWORD,
      status: TokenStatus.ACTIVE,
    });

    if (!token) {
      throw new BadRequestException(`Invalid token`);
    }

    const encryptedPassword = await HashPassword(data.password);
    const user = await this._databaseService.user.update({
      where: { id: token.userId },
      data: { password: encryptedPassword },
    });

    if (!user) {
      throw new BadRequestException(`Password not updated`);
    }

    await this._databaseService.token.update({
      where: { identifier: data.token },
      data: { status: TokenStatus.EXPIRED },
    });

    return successApiWrapper(
      null,
      `Password reset successfully`,
      HttpStatus.OK,
    );
  }

  // Refresh token logic
  async refreshAccessToken(
    data: RefreshAccessTokenRequestDTO,
  ): Promise<BaseResponseDto<RefreshTokenResponseDTO>> {
    const { refreshToken: refToken } = data;
    const isRefreshTokenValid = await this._validateRefreshToken(refToken);

    if (!isRefreshTokenValid) {
      throw new ForbiddenException();
    }

    const auth = await this.getSession(refToken);

    if (!auth) {
      throw new ForbiddenException();
    }

    if (auth.id !== isRefreshTokenValid.id) {
      throw new ForbiddenException();
    }
    await this.destroySession(refToken);

    const { accessToken, refreshToken } =
      await this.createAccessTokenRefreshTokenPair(auth.user);

    return successApiWrapper(
      { accessToken, refreshToken },
      `Token refreshed successfully`,
      HttpStatus.OK,
    );
  }

  // Generate access and refresh tokens
  private async createAccessTokenRefreshTokenPair(
    user: User,
  ): Promise<UserAuthTokenInterface> {
    const userId = user.id;

    const accessToken = await this._jwtService.signAsync(
      { id: userId },
      {
        secret: process.env.ACCESS_TOKEN_SECRET,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
      },
    );

    const refreshToken = await this._jwtService.signAsync(
      { id: userId },
      {
        secret: process.env.REFRESH_TOKEN_SECRET,
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
      },
    );

    const Auth: UserAuthInterface = { id: userId.toString(), user };

    const ACCESS_TOKEN_CACHE_EXPIRY: number = Number(
      this._configService.get('ACCESS_TOKEN_CACHE_EXPIRY'),
    );
    const REFRESH_TOKEN_CACHE_EXPIRY: number = Number(
      this._configService.get('REFRESH_TOKEN_CACHE_EXPIRY'),
    );

    await this._redisCacheService.Set(
      accessToken,
      Auth,
      ACCESS_TOKEN_CACHE_EXPIRY,
    );
    await this._redisCacheService.Set(
      refreshToken,
      Auth,
      REFRESH_TOKEN_CACHE_EXPIRY,
    );

    const userTokensKey = `${userId}-tokens`;

    const userTokens = (await this._redisCacheService.Get(userTokensKey)) || [];
    userTokens.push(refreshToken);
    userTokens.push(accessToken);

    const USER_TOKENS_CACHE_EXPIRY: number = Number(
      this._configService.get('USER_TOKENS_CACHE_EXPIRY'),
    );
    await this._redisCacheService.Set(
      userTokensKey,
      userTokens,
      USER_TOKENS_CACHE_EXPIRY,
    );

    return { accessToken, refreshToken };
  }

  // Destroy user session
  async destroySession(token: string): Promise<boolean> {
    const Auth: UserAuthInterface | null = await this.getSession(token);
    if (!Auth) return false;
    await this._redisCacheService.Delete(token);
    return true;
  }

  // Retrieve user session from cache
  async getSession(token: string): Promise<UserAuthInterface | null> {
    const Auth: UserAuthInterface = await this._redisCacheService.Get(token);
    if (!Auth) return null;

    return Auth;
  }

  // Validate refresh token
  private async _validateRefreshToken(refreshToken: string) {
    return await this._jwtService.verifyAsync(refreshToken, {
      secret: this._configService.get('REFRESH_TOKEN_SECRET'),
    });
  }

  // Send email for forget password
  private async _sendForgetPasswordEmail(user: User, token: string) {
    const data: SendMailMessageInterface = {
      email: user.email,
      subject: 'Reset Password',
      body: `We have received a request to reset your password. Please click on the link below to reset your password.\n\nIf you did not request a password reset, please ignore this email.\n\nThank you,\nThe Team`,
      name: user.name,
      link: `${this._configService.get('FRONTEND_RESET_PASSWORD_URL')}?token=${token}`,
      linkText: 'Reset Password',
    };

    await this._notificationService.sendEmail(data);
  }
}
