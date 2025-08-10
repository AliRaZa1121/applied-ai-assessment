import { Injectable } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import type { PlanCreateInterface } from 'src/utilities/interfaces/plan-create-interface';
import type { PlanUpdateInterface } from 'src/utilities/interfaces/plan-update-interface';
import type { CreatePaymentIntentRequest } from 'src/utilities/interfaces/payment-intent.interface';
import { PaymentService } from './payment.service';


@Injectable()
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    // =====================================
    // PAYMENT INTENT MANAGEMENT
    // =====================================

    /**
     * Create a payment intent
     * Called by user-subscription service to initiate payment
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PAYMENT_INTENT)
    async createPaymentIntent(@Payload() data: CreatePaymentIntentRequest): Promise<any> {
        console.log('PaymentController: Creating payment intent:', data);
        return await this.paymentService.createPaymentIntent(data);
    }

    /**
     * Confirm a payment
     * Called by user-subscription service to process payment
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CONFIRM_PAYMENT)
    async confirmPayment(@Payload() data: any): Promise<any> {
        console.log('PaymentController: Confirming payment:', data);
        return await this.paymentService.confirmPayment(data);
    }

    /**
     * Process a payment
     * Called by user-subscription service for automatic processing
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.PROCESS_PAYMENT)
    async processPayment(@Payload() data: any): Promise<any> {
        console.log('PaymentController: Processing payment:', data);
        return await this.paymentService.processPayment(data);
    }

    /**
     * Cancel a payment
     * Called by user-subscription service to cancel payment
     */
    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CANCEL_PAYMENT)
    async cancelPayment(@Payload() data: any): Promise<any> {
        console.log('PaymentController: Cancelling payment:', data);
        return await this.paymentService.cancelPayment(data);
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
