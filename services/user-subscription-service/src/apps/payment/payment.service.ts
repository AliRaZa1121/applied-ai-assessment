import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICROSERVICES, MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import { PlanCreateInterface } from 'src/utilities/interfaces/payments/plan-create-interface';
import { PlanUpdateInterface } from 'src/utilities/interfaces/payments/plan-update-interface';

export interface CreatePaymentIntentRequest {
    subscriptionId: string;
    userId: string;
    amount: number;
    cardToken: string;
    currency?: string;
    description?: string;
}

export interface ConfirmPaymentRequest {
    paymentIntentId: string;
    paymentMethodToken?: string;
    simulateSuccess?: boolean;
}

export interface PaymentIntentResponse {
    id: string;
    subscriptionId: string;
    userId: string;
    amount: number;
    currency: string;
    status: string;
    clientSecret?: string;
    description?: string;
    createdAt: Date;
}

export interface PaymentProcessingResponse {
    paymentIntent: PaymentIntentResponse;
    payment?: any;
    webhookDelivered: boolean;
    simulation: {
        success: boolean;
        processingTime: number;
        gatewayResponse: any;
    };
}

@Injectable()
export class PaymentService {

    constructor(
        @Inject(MICROSERVICES.PAYMENT_SERVICE)
        private readonly client: ClientProxy,
    ) { }

    /**
     * Create payment intent for subscription
     * Used when user creates a new subscription or upgrades
     */
    async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<PaymentIntentResponse> {
        console.log('🔄 Creating payment intent via RabbitMQ:', data.subscriptionId);

        try {
            const result = await this.client.send<PaymentIntentResponse>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PAYMENT_INTENT,
                data
            ).toPromise();

            console.log('✅ Payment intent created:', result?.id);
            return result!;
        } catch (error) {
            console.error('❌ Error creating payment intent:', error);
            throw error;
        }
    }

    /**
     * Confirm payment intent
     * Used to process the payment
     */
    async confirmPayment(data: ConfirmPaymentRequest): Promise<PaymentProcessingResponse> {
        console.log('🔄 Confirming payment via RabbitMQ:', data.paymentIntentId);

        try {
            const result = await this.client.send<PaymentProcessingResponse>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CONFIRM_PAYMENT,
                data
            ).toPromise();

            console.log('✅ Payment confirmed:', result?.paymentIntent.status);
            return result!;
        } catch (error) {
            console.error('❌ Error confirming payment:', error);
            throw error;
        }
    }

    /**
     * Process payment automatically
     * Used for subscription renewals and automatic billing
     */
    async processPayment(paymentIntentId: string, shouldSucceed: boolean = true): Promise<PaymentProcessingResponse> {
        console.log('🔄 Processing payment via RabbitMQ:', paymentIntentId);

        try {
            const result = await this.client.send<PaymentProcessingResponse>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.PROCESS_PAYMENT,
                { paymentIntentId, shouldSucceed }
            ).toPromise();

            console.log('✅ Payment processed:', result?.simulation.success ? 'SUCCESS' : 'FAILED');
            return result!;
        } catch (error) {
            console.error('❌ Error processing payment:', error);
            throw error;
        }
    }

    /**
     * Cancel payment intent
     * Used when subscription is cancelled before payment
     */
    async cancelPayment(paymentIntentId: string): Promise<{ cancelled: boolean }> {
        console.log('🔄 Cancelling payment via RabbitMQ:', paymentIntentId);

        try {
            const result = await this.client.send<{ cancelled: boolean }>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CANCEL_PAYMENT,
                { paymentIntentId }
            ).toPromise();

            console.log('✅ Payment cancelled:', result?.cancelled);
            return result!;
        } catch (error) {
            console.error('❌ Error cancelling payment:', error);
            throw error;
        }
    }

    /**
     * Get payment status
     * Used to check payment status
     */
    async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntentResponse> {
        console.log('🔄 Getting payment status via RabbitMQ:', paymentIntentId);

        try {
            const result = await this.client.send<PaymentIntentResponse>(
                'payment_service_get_payment_status',
                { paymentIntentId }
            ).toPromise();

            console.log('✅ Payment status retrieved:', result?.status);
            return result!;
        } catch (error) {
            console.error('❌ Error getting payment status:', error);
            throw error;
        }
    }

    /**
     * Emit payment event (fire and forget)
     * Used for notifications and events that don't need response
     */
    emitPaymentEvent(eventType: string, data: any): void {
        console.log('📤 Emitting payment event:', eventType);
        this.client.emit(`payment_service_${eventType}`, data);
    }


    // =====================================
    // PLAN MANAGEMENT
    // =====================================

    async createPlan(data: PlanCreateInterface): Promise<string> {
        console.log('🔄 Creating plan via RabbitMQ:', data.name);

        const result: string = await this.client.send<any>(
            MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PLAN,
            data
        ).toPromise();

        console.log('✅ Plan created:', result);
        return result;


    }


    async updatePlan(data: PlanUpdateInterface): Promise<boolean> {
        const { planId } = data;
        
        console.log('🔄 Updating plan via RabbitMQ:', planId);

        const result: boolean = await this.client.send<any>(
            MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_PLAN,
            data
        ).toPromise();

        console.log('✅ Plan updated:', planId);
        return result;
    }

    async deletePlan(planId: string): Promise<boolean> {
        console.log('🔄 Deleting plan via RabbitMQ:', planId);
        const result: boolean = await this.client.send<any>(
            MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.DELETE_PLAN,
            { planId }
        ).toPromise();

        console.log('✅ Plan deleted:', planId);
        return result;
    }

}
