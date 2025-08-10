import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Payment } from '@prisma/client';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import type { CreatePaymentIntentRequest } from 'src/utilities/interfaces/payment-intent.interface';
import type { PlanCreateInterface } from 'src/utilities/interfaces/plan-create-interface';
import type { PlanUpdateInterface } from 'src/utilities/interfaces/plan-update-interface';
import type { UpdateSubscriptionInterface } from 'src/utilities/interfaces/update-subscription.interface';
import { PaymentService } from './payment.service';


@Injectable()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    // =====================================
    // PAYMENT INTENT MANAGEMENT
    // =====================================

    // Validate Payment Id 
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.VALIDATE_PAYMENT_ID)
    async validatePaymentId(@Payload() paymentId: string): Promise<boolean> {
        console.log('PaymentController: Validating payment ID:', paymentId);
        return await this.paymentService.validatePaymentId(paymentId);
    }
    
    /**
     * Create a payment intent
     * Called by user-subscription service to initiate payment
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PAYMENT_INTENT)
    async createPaymentIntent(@Payload() data: CreatePaymentIntentRequest): Promise<Payment> {
        console.log('PaymentController: Creating payment intent:', data);
        return await this.paymentService.createPaymentIntent(data);
    }

    /**
     * Update a subscription
     * Called by user-subscription service to update an existing subscription
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_SUBSCRIPTION)
    async updateSubscription(@Payload() data: UpdateSubscriptionInterface): Promise<string> {
        console.log('PaymentController: Updating subscription:', data);
        return await this.paymentService.updateSubscription(data);
    }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CANCEL_SUBSCRIPTION)
    async cancelSubscription(@Payload() userId: string): Promise<boolean> {
        return await this.paymentService.cancelSubscription(userId);
    }



    // =====================================
    // PLAN MANAGEMENT
    // =====================================

    /** 
    * Create a new plan
    * Called by user-subscription service to create a new subscription plan
    */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PLAN)
    async createPlan(@Payload() planData: PlanCreateInterface): Promise<string> {
        console.log('PaymentController: Creating plan:', planData);
        return await this.paymentService.createPlan(planData);
    }

    /**
     * Update an existing plan
     * Called by user-subscription service to update a subscription plan
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_PLAN)
    async updatePlan(@Payload() data:  PlanUpdateInterface): Promise<boolean> {
        const { planId } = data; 
        return await this.paymentService.updatePlan(planId, data);
    }

    /**
     * Delete a plan
     * Called by user-subscription service to delete a subscription plan
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.DELETE_PLAN)
    async deletePlan(planId: string): Promise<boolean> {
        console.log('PaymentController: Deleting plan:', planId);
        return await this.paymentService.deletePlan(planId);
    }
}
