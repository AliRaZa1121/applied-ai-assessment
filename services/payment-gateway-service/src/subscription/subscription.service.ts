import { Injectable } from '@nestjs/common';
import { Payment, PaymentStatus } from '@prisma/client';
import { UserSubscriptionService } from 'src/apps/user-subscription/user-subscription.service';
import DatabaseService from 'src/database/database.service';
import { generatePlanId } from 'src/utilities/helpers/string-generator-helper';
import { generateDummyWebhookData } from 'src/utilities/helpers/webhook-generator.helper';
import { CreatePaymentIntentRequest } from 'src/utilities/interfaces/payment-intent.interface';
import type { UpdateSubscriptionInterface } from 'src/utilities/interfaces/update-subscription.interface';

/**
 * SubscriptionService
 *
 * Contains the core business logic for subscription lifecycle management,
 * payment intent handling, and integration simulation with the payment gateway.
 */
@Injectable()
export class SubscriptionService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly userSubscriptionService: UserSubscriptionService,
    ) {}

    /**
     * Check if a given payment ID exists in the database.
     * Used to validate incoming payment references from other services.
     */
    async validatePaymentId(paymentId: string): Promise<boolean> {
        console.log('🔄 Validating payment ID via integration:', paymentId);

        const payment = await this.databaseService.payment.findFirst({
            where: { gatewayPaymentId: paymentId },
        });

        console.log('✅ Payment ID validation result:', payment ? 'Valid' : 'Invalid');
        return !!payment;
    }

    /**
     * Create a payment intent record in the database.
     * 
     * In production, this would communicate with the payment gateway (e.g., Stripe)
     * to create an actual payment intent and return its client secret.
     * 
     * Here, we:
     *  - Save the payment record with status PENDING
     *  - Simulate gateway delay with setTimeout
     *  - Generate a fake webhook event once the "intent" is ready
     *  - Pass that webhook to the UserSubscriptionService to create a subscription
     */
    async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<Payment> {
        // Store initial payment intent in DB
        const payment = await this.databaseService.payment.create({
            data: {
                amount: data.amount,
                currency: data.currency || 'USD',
                status: PaymentStatus.PENDING,
                gatewayPaymentId: data.paymentId,
            },
        });

        console.log('🔄 Creating payment intent:', data.subscriptionId, payment.id);

        // Simulate async gateway processing delay
        setTimeout(() => {
            console.log('🔄 Payment intent created successfully:', payment.id);

            // Create a fake webhook event to mimic gateway callback
            const dummyWebhook = generateDummyWebhookData(
                data.paymentId,
                data.amount,
                data.currency || 'USD'
            );

            // Pass fake webhook to subscription creation logic
            this.userSubscriptionService.createSubscription(dummyWebhook);
        }, 3000);

        return payment;
    }

    /**
     * Update an existing subscription in the payment gateway.
     * Returns a newly generated gateway plan ID to represent the updated subscription.
     */
    async updateSubscription(data: UpdateSubscriptionInterface): Promise<string> {
        const { subscriptionId, gatewayPlanId, userId } = data;
        console.log('Updating subscription via integration:', subscriptionId, gatewayPlanId, userId);

        // Simulated updated subscription ID from gateway
        const updatedSubscriptionId = generatePlanId();
        console.log('Subscription updated successfully:', updatedSubscriptionId);

        return updatedSubscriptionId;
    }

    /**
     * Cancel a subscription for a user in the payment gateway.
     * Always returns true in this simulation.
     */
    async cancelSubscription(userId: string): Promise<boolean> {
        console.log('Canceling subscription for user:', userId);
        return true;
    }
}
