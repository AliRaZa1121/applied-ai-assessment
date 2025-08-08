import { Get } from '@nestjs/common';
import { User } from '@prisma/client';
import { AppService } from './app.service';
import { ApiRouting } from './core/decorators/api-controller.decorator';
import { AuthUser } from './core/decorators/auth-user.decorator';
import { Authorized } from './core/decorators/authorize.decorator';
import { BaseResponseDto } from './utilities/swagger-responses/base-response';

@ApiRouting({ tag: 'App', path: '/' })
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/welcome')
  @Authorized()
  getWelcome(
    @AuthUser() authUser: User,
  ): Promise<BaseResponseDto<User>> {
    return this.appService.getWelcome(authUser);
  }
  
}
