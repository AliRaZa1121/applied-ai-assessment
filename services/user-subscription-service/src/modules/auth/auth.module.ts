import { Module } from '@nestjs/common';
import { RedisModule } from 'src/apps/cache/redis.module';
import AuthController from './auth.controller';
import AuthService from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { TokenModule } from '../tokens/token.module';

@Module({
  imports: [
    RedisModule,
    TokenModule,
    JwtModule.register({
      global: true,
      signOptions: {},
    }),
  ],
  exports: [AuthService],
  providers: [AuthService],
  controllers: [AuthController],
})
export class AuthModule {}
