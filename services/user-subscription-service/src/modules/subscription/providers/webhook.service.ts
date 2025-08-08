import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { BillingStatus, SubscriptionStatus, WebhookEventType } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { ProcessWebhookDTO } from '../dto/webhook.dto';

@Injectable()
export default class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly _databaseService: DatabaseService) { }

    async processWebhook(data: ProcessWebhookDTO): Promise<void> {
        this.logger.log(`Processing webhook: ${data.eventType}`);

        try {
            // Create webhook event record for audit trail
            const webhookEvent = await this._databaseService.webhookEvent.create({
                data: {
                    subscriptionId: data.eventData.subscriptionId || null,
                    eventType: this.mapEventType(data.eventType),
                    eventData: data.eventData,
                    processed: false,
                    retryCount: 0,
                }
            });

            // Process different webhook event types
            switch (data.eventType) {
                case 'payment_succeeded':
                    await this.handlePaymentSucceeded(data.eventData);
                    break;
                case 'payment_failed':
                    await this.handlePaymentFailed(data.eventData);
                    break;
                case 'payment_refunded':
                    await this.handlePaymentRefunded(data.eventData);
                    break;
                case 'subscription_created':
                    await this.handleSubscriptionCreated(data.eventData);
                    break;
                case 'subscription_updated':
                    await this.handleSubscriptionUpdated(data.eventData);
                    break;
                default:
                    this.logger.warn(`Unhandled webhook event type: ${data.eventType}`);
            }

            // Mark webhook as processed
            await this._databaseService.webhookEvent.update({
                where: { id: webhookEvent.id },
                data: { processed: true }
            });

            this.logger.log(`Successfully processed webhook: ${data.eventType}`);
        } catch (error) {
            this.logger.error(`Failed to process webhook: ${data.eventType}`, error);
            throw new BadRequestException('Failed to process webhook');
        }
    }

    private mapEventType(eventType: string): WebhookEventType {
        const eventTypeMap: Record<string, WebhookEventType> = {
            'payment_succeeded': WebhookEventType.PAYMENT_SUCCEEDED,
            'payment_failed': WebhookEventType.PAYMENT_FAILED,
            'payment_refunded': WebhookEventType.PAYMENT_REFUNDED,
            'subscription_created': WebhookEventType.SUBSCRIPTION_CREATED,
            'subscription_updated': WebhookEventType.SUBSCRIPTION_UPDATED,
            'subscription_cancelled': WebhookEventType.SUBSCRIPTION_CANCELLED,
        };

        return eventTypeMap[eventType] || WebhookEventType.PAYMENT_SUCCEEDED;
    }

    private async handlePaymentSucceeded(eventData: any): Promise<void> {
        const { subscriptionId, amount, currency, paymentId } = eventData;

        // Update subscription status to active
        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.ACTIVE }
        });

        // Create billing history record
        await this._databaseService.billingHistory.create({
            data: {
                subscriptionId,
                amount: amount,
                currency: currency || 'USD',
                status: BillingStatus.PAID,
                paymentId: paymentId,
                billingDate: new Date(),
                description: `Payment succeeded for subscription ${subscriptionId}`,
            }
        });

        this.logger.log(`Payment succeeded for subscription: ${subscriptionId}`);
    }

    private async handlePaymentFailed(eventData: any): Promise<void> {
        const { subscriptionId, amount, currency, error, paymentId } = eventData;

        // Update subscription status to past due
        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.PAST_DUE }
        });

        // Create billing history record
        await this._databaseService.billingHistory.create({
            data: {
                subscriptionId,
                amount: amount,
                currency: currency || 'USD',
                status: BillingStatus.FAILED,
                paymentId: paymentId,
                billingDate: new Date(),
                description: `Payment failed for subscription ${subscriptionId}: ${error}`,
            }
        });

        this.logger.log(`Payment failed for subscription: ${subscriptionId}`);
    }

    private async handlePaymentRefunded(eventData: any): Promise<void> {
        const { subscriptionId, amount, currency, paymentId, reason } = eventData;

        // Create billing history record for refund
        await this._databaseService.billingHistory.create({
            data: {
                subscriptionId,
                amount: -amount, // Negative amount for refund
                currency: currency || 'USD',
                status: BillingStatus.REFUNDED,
                paymentId: paymentId,
                billingDate: new Date(),
                description: `Payment refunded for subscription ${subscriptionId}: ${reason}`,
            }
        });

        this.logger.log(`Payment refunded for subscription: ${subscriptionId}`);
    }

    private async handleSubscriptionCreated(eventData: any): Promise<void> {
        const { subscriptionId, status, planId } = eventData;

        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: { 
                status: status === 'active' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
                ...(planId && { planId })
            }
        });

        this.logger.log(`Subscription created: ${subscriptionId}`);
    }

    private async handleSubscriptionUpdated(eventData: any): Promise<void> {
        const { subscriptionId, status, planId, cancelledAt } = eventData;

        const updateData: any = {};
        
        if (status) {
            updateData.status = status === 'active' ? SubscriptionStatus.ACTIVE : 
                               status === 'cancelled' ? SubscriptionStatus.CANCELLED :
                               status === 'past_due' ? SubscriptionStatus.PAST_DUE :
                               status === 'trialing' ? SubscriptionStatus.TRIALING :
                               SubscriptionStatus.PENDING;
        }

        if (planId) {
            updateData.planId = planId;
        }

        if (cancelledAt) {
            updateData.cancelledAt = new Date(cancelledAt);
        }

        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: updateData
        });

        this.logger.log(`Subscription updated: ${subscriptionId}`);
    }
}
