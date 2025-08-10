import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { NotificationModule } from './apps/notification/notification.module';
import { MicroserviceExceptionFilter } from './core/exceptions/RpcExceptionFilter';
import DatabaseModule from './database/database.module';
import { PlanModule } from './plan/plan.module';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, 
      cache: true,
      load: [],
    }),
    DatabaseModule,
    PlanModule,
    SubscriptionModule,
    NotificationModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_FILTER, useClass: MicroserviceExceptionFilter },
  ],
})
export class AppModule {}