import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { MICROSERVICES, MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import { CreatePaymentIntentRequest } from 'src/utilities/interfaces/payments/payment-intent.interface';
import { PlanCreateInterface } from 'src/utilities/interfaces/payments/plan-create-interface';
import { PlanUpdateInterface } from 'src/utilities/interfaces/payments/plan-update-interface';
import { SubscriptionUpdateRequestDTO } from 'src/utilities/interfaces/payments/subscription-update.interface';

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
export class PaymentIntegrationService {
    constructor(
        @Inject(MICROSERVICES.PAYMENT_SERVICE)
        private readonly client: ClientProxy,
    ) { }

    async validatePaymentId(paymentId: string): Promise<boolean> {
        console.log('🔄 Validating payment ID via RabbitMQ:', paymentId);
        const result = await firstValueFrom(
            this.client.send<boolean>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.VALIDATE_PAYMENT_ID,
                paymentId
            )
        );
        console.log('✅ Payment ID validation result:', result);
        return result;
    }

    async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<void> {
        console.log('🔄 Creating payment intent via RabbitMQ:', data.subscriptionId);
        this.client.emit(MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PAYMENT_INTENT, data);
    }

    async updateSubscription(data: SubscriptionUpdateRequestDTO): Promise<string> {
        console.log('🔄 Updating subscription via RabbitMQ:', data.subscriptionId);
        const result: string = await firstValueFrom(
            this.client.send<string>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_SUBSCRIPTION,
                data
            )
        );
        console.log('✅ Subscription updated:', result);
        return result;
    }

    async cancelSubscription(userId: string): Promise<boolean> {
        console.log('🔄 Canceling subscription via RabbitMQ for user:', userId);
        const result: boolean = await firstValueFrom(
            this.client.send<boolean>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CANCEL_SUBSCRIPTION,
                userId
            )
        );
        console.log('✅ Subscription canceled:', result);
        return result;
    }


    // =====================================
    // PLAN MANAGEMENT
    // =====================================

    async createPlan(data: PlanCreateInterface): Promise<string> {
        console.log('🔄 Creating plan via RabbitMQ:', data.name);

        const result: string = await firstValueFrom(
            this.client.send<string>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.CREATE_PLAN,
                data
            )
        );

        console.log('✅ Plan created:', result);
        return result;


    }


    async updatePlan(data: PlanUpdateInterface): Promise<boolean> {
        const { planId } = data;

        console.log('🔄 Updating plan via RabbitMQ:', planId);

        const result: boolean = await firstValueFrom(
            this.client.send<boolean>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.UPDATE_PLAN,
                data
            )
        );

        console.log('✅ Plan updated:', planId);
        return result;
    }

    async deletePlan(planId: string): Promise<boolean> {
        console.log('🔄 Deleting plan via RabbitMQ:', planId);

        const result: boolean = await firstValueFrom(
            this.client.send<boolean>(
                MICROSERVICES_MESSAGE_COMMANDS.PAYMENT_SERVICE.DELETE_PLAN,
                planId
            )
        );

        console.log('✅ Plan deleted:', planId);
        return result;
    }
}
