import { Injectable, Logger } from '@nestjs/common';
import { BillingStatus, SubscriptionStatus } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { DummyWebhookData } from 'src/utilities/interfaces/webhook-interface';

@Injectable()
export default class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly _databaseService: DatabaseService) { }

    async createSubscriptionHandler(data: DummyWebhookData): Promise<void> {
        // Logic to create subscription in the database     
        const { paymentId, eventType, status } = data;
        const { id, object, data: { object: subscriptionData } } = data.payload;

        const billingPaymentHistory = await this._databaseService.billingHistory.findFirst({
            where: {
                gatewayPaymentId: paymentId,
                status: BillingStatus.PENDING
            },
        });

        if (!billingPaymentHistory) {
            this.logger.warn(`No billing history found for payment ID: ${paymentId}`);
            return;
        }

        // Update Subscription based on event type
        if (eventType === 'PAYMENT_SUCCEEDED') {
            // Update Billing History to ACTIVE
            await this._databaseService.billingHistory.update({
                where: { id: billingPaymentHistory.id },
                data: {
                    status: BillingStatus.PAID
                },
            });

            // update subscription in the database
            await this._databaseService.subscription.update({
                where: { id: billingPaymentHistory.subscriptionId },
                data: {
                    status: SubscriptionStatus.ACTIVE,
                },
            });
        }


    }
}
