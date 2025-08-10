import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RedisModule } from './apps/cache/redis.module';
import { NotificationIntegrationModule } from './apps/notification-integration/notification-integration.module';
import { PaymentIntegrationModule } from './apps/payment-integration/payment-integration.module';
import { HttpExceptionFilter } from './core/exceptions/http.exception';
import { MicroserviceExceptionFilter } from './core/exceptions/RpcExceptionFilter';
import DatabaseModule from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import PlanModule from './modules/plan/plan.module';
import SubscriptionModule from './modules/subscription/subscription.module';
import { TokenModule } from './modules/tokens/token.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [],
    }),
    RedisModule,
    DatabaseModule,
    AuthModule,
    TokenModule,
    SubscriptionModule,
    PlanModule,
    NotificationIntegrationModule,
    PaymentIntegrationModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: MicroserviceExceptionFilter },
  ],
})
export class AppModule {}
