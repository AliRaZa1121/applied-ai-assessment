import { Injectable } from '@nestjs/common';
import { Payment, PaymentStatus } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { generatePlanId } from 'src/utilities/helpers/string-generator-helper';
import { generateDummyWebhookData } from 'src/utilities/helpers/webhook-generator.helper';
import { CreatePaymentIntentRequest } from 'src/utilities/interfaces/payment-intent.interface';
import type { PlanCreateInterface } from 'src/utilities/interfaces/plan-create-interface';
import type { PlanUpdateInterface } from 'src/utilities/interfaces/plan-update-interface';
import { UserSubscriptionService } from '../apps/user-subscription/user-subscription.service';

@Injectable()
export class PaymentService {
    constructor(
        private readonly databaseService: DatabaseService,
        private readonly userSubscriptionService: UserSubscriptionService, 
        ) { }

    // =====================================
    // PAYMENT INTENT MANAGEMENT
    // =====================================

    async createPaymentIntent(data: CreatePaymentIntentRequest): Promise<Payment> {
        const payment = await this.databaseService.payment.create({
            data: {
                amount: data.amount,
                currency: data.currency || 'USD',
                status: PaymentStatus.PENDING,
                gatewayPaymentId: data.paymentId,
            },
        });
        console.log('🔄 Creating payment intent:', data.subscriptionId, payment.id);

        setTimeout(() => {
            // Simulate payment intent creation delay
            console.log('🔄 Payment intent created successfully:', payment.id)
            
            const dummyWebhook = generateDummyWebhookData(payment.id, data.amount, data.currency || 'USD');
            this.userSubscriptionService.createSubscription(dummyWebhook);
        }, 3000);

        return payment;
    }

    // =====================================
    // PLAN MANAGEMENT
    // =====================================

    async createPlan(planData: PlanCreateInterface): Promise<string> {
        console.log('Creating plan via integration for example: Stripe, Paypal', planData);
        // In a real implementation, this would create the plan in the external gateway
        return generatePlanId();

    }

    async updatePlan(planId: string, planData: PlanUpdateInterface): Promise<boolean> {

        console.log('Updating plan via integration for example: Stripe, Paypal', planId, planData);
        // In a real implementation, this would update the plan in the external gateway
        return true; // Simulate success
    }

    async deletePlan(planId: string): Promise<boolean> {
        console.log('Deleting plan via integration for example: Stripe, Paypal', planId);
        // In a real implementation, this would delete the plan in the external gateway
        return true; // Simulate success
    }
}
