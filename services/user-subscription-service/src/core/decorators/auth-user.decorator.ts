import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserAuthInterface } from 'src/utilities/interfaces/user.interface';

export const AuthUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const userAuthInterface: UserAuthInterface = ctx
      .switchToHttp()
      .getRequest().user;
    if (!userAuthInterface) {
      return null;
    }
    return data ? userAuthInterface[data]?.user : userAuthInterface?.user;
  },
);
