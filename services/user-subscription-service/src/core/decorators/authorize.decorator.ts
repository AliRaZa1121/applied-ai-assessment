import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AllowAny, AuthGuard } from '../guards/auth.guard';

export function Authorized(isAuth = true) {
  if (isAuth) {
    return applyDecorators(UseGuards(AuthGuard), ApiBearerAuth('JWT'));
  } else {
    return applyDecorators(AllowAny());
  }
}
