import { Injectable, Logger } from '@nestjs/common';
import { BillingStatus, SubscriptionStatus, WebhookEventType } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { DummyWebhookData } from 'src/utilities/interfaces/webhook-interface';

@Injectable()
export default class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly _databaseService: DatabaseService) { }

    async createSubscriptionHandler(data: DummyWebhookData): Promise<void> {
        const { paymentId, eventType, status } = data;
        const objectId = data?.payload?.id;
        const objectType = data?.payload?.object;
        const subscriptionData = data?.payload?.data?.object;

        try {
            await this._databaseService.$transaction(async (tx) => {
                
                // Find the pending billing history inside the transaction
                const billingPaymentHistory = await tx.billingHistory.findFirst({
                    where: {
                        gatewayPaymentId: paymentId,
                        status: BillingStatus.PENDING,
                    },
                    select: { id: true, subscriptionId: true },
                });

                if (!billingPaymentHistory) {
                    this.logger.warn(`No billing history found for payment ID: ${paymentId}`);
                    return;
                }

                if (eventType === WebhookEventType.PAYMENT_SUCCEEDED) {
                    await tx.billingHistory.update({
                        where: { id: billingPaymentHistory.id },
                        data: { status: BillingStatus.PAID },
                    });

                    await tx.subscription.update({
                        where: { id: billingPaymentHistory.subscriptionId },
                        data: { status: SubscriptionStatus.ACTIVE },
                    });
                }

                // Always create webhook event (when billing history exists), as before
                await tx.webhookEvent.create({
                    data: {
                        subscriptionId: billingPaymentHistory.subscriptionId,
                        eventType: WebhookEventType.PAYMENT_SUCCEEDED,
                        eventData: {
                            id: objectId,
                            object: objectType,
                            status,
                            subscriptionData,
                        },
                    },
                });
            });

            this.logger.log(`Handled webhook event: ${eventType} for payment ID: ${paymentId}`);
        } catch (err) {
            this.logger.error(
                `Failed to handle webhook event: ${eventType} for payment ID: ${paymentId}`,
                err instanceof Error ? err.stack : undefined,
            );
        }
    }
}
