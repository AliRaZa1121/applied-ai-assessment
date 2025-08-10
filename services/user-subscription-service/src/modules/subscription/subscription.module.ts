import { Module } from '@nestjs/common';
import { PaymentModule } from 'src/apps/payment/payment.module';
import WebhookService from './providers/webhook.service';
import SubscriptionController from './subscription.controller';
import SubscriptionService from './subscription.service';

@Module({
    imports: [PaymentModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, WebhookService],
    exports: [SubscriptionService],
})
export default class SubscriptionModule { }
