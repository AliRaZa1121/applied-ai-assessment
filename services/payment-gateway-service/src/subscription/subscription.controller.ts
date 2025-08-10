import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Payment } from '@prisma/client';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import type { CreatePaymentIntentRequest } from 'src/utilities/interfaces/payment-intent.interface';
import type { UpdateSubscriptionInterface } from 'src/utilities/interfaces/update-subscription.interface';
import { SubscriptionService } from './subscription.service';

/**
 * SubscriptionController
 *
 * Acts as a microservice message listener for subscription-related commands.
 * Receives events from other services (e.g., user-subscription service) and
 * delegates business logic to the SubscriptionService.
 */
@Injectable()
export class SubscriptionController {
    constructor(private readonly subscriptionService: SubscriptionService) {}

    /**
     * Validate a payment ID in the database.
     * Triggered by another microservice to check if a given payment exists.
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.VALIDATE_PAYMENT_ID)
    async validatePaymentId(@Payload() paymentId: string): Promise<boolean> {
        console.log('PaymentController: Validating payment ID:', paymentId);
        return await this.subscriptionService.validatePaymentId(paymentId);
    }
    
    /**
     * Create a new payment intent for a subscription.
     * This is called by the user-subscription service to start a payment flow.
     * Returns the Payment record stored in our database.
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PAYMENT_INTENT)
    async createPaymentIntent(@Payload() data: CreatePaymentIntentRequest): Promise<Payment> {
        console.log('PaymentController: Creating payment intent:', data);
        return await this.subscriptionService.createPaymentIntent(data);
    }
    
    /**
     * Update an existing subscription in the payment gateway.
     * Returns the updated gateway subscription ID.
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_SUBSCRIPTION)
    async updateSubscription(@Payload() data: UpdateSubscriptionInterface): Promise<string> {
        console.log('SubscriptionController: Updating subscription:', data);
        return await this.subscriptionService.updateSubscription(data);
    }

    /**
     * Cancel a subscription for a given user in the payment gateway.
     * Returns a boolean indicating whether the operation succeeded.
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CANCEL_SUBSCRIPTION)
    async cancelSubscription(@Payload() userId: string): Promise<boolean> {
        return await this.subscriptionService.cancelSubscription(userId);
    }
}
