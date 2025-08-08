import { Module } from '@nestjs/common';
import WebhookService from './providers/webhook.service';
import SubscriptionController from './subscription.controller';
import SubscriptionService from './subscription.service';

@Module({
    imports: [],
    controllers: [SubscriptionController],
    providers: [SubscriptionService, WebhookService],
    exports: [SubscriptionService],
})
export default class SubscriptionModule { }
