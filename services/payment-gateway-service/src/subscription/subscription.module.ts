import { Module } from '@nestjs/common';
import { UserSubscriptionModule } from 'src/apps/user-subscription/user-subscription.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

@Module({
    imports: [UserSubscriptionModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService],
    exports: [SubscriptionService],
})
export class SubscriptionModule {}
