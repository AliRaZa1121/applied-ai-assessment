import { Module } from '@nestjs/common';
import { PaymentIntegrationModule } from 'src/apps/payment-integration/payment-integration.module';
import WebhookService from './providers/webhook.service';
import SubscriptionController from './subscription.controller';
import SubscriptionService from './subscription.service';

@Module({
    imports: [PaymentIntegrationModule],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, WebhookService],
    exports: [SubscriptionService],
})
export default class SubscriptionModule { }
