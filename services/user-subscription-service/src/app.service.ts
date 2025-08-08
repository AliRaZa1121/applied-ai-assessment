import { HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { successApiWrapper } from './utilities/constant/response-constant';
import { BaseResponseDto } from './utilities/swagger-responses/base-response';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async getWelcome(authUser: User): Promise<BaseResponseDto<User>> {
    return successApiWrapper(
      authUser,
      `Hello ${authUser?.name}! Welcome to the Authenticated Screen`,
      HttpStatus.OK,
    );
  }

}
