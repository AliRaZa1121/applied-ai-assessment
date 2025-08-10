/**
 * Payment Gateway Service Usage Example
 * 
 * This file demonstrates how to use the payment gateway service
 * from the user-subscription service perspective.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewayIntegrationService } from '../src/integration/payment-gateway-integration.service';
import { PaymentModule } from '../src/payment/payment.module';
import DatabaseModule from '../src/database/database.module';
import { CreatePaymentIntentRequest, PaymentMethod } from '../src/utilities/interfaces/payment-gateway.interface';

describe('Payment Gateway Service Usage Example', () => {
    let paymentGatewayService: PaymentGatewayIntegrationService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [DatabaseModule, PaymentModule],
        }).compile();

        paymentGatewayService = module.get<PaymentGatewayIntegrationService>(PaymentGatewayIntegrationService);
    });

    describe('Complete Payment Flow Example', () => {
        it('should demonstrate a complete subscription payment flow', async () => {
            console.log('🚀 Starting payment gateway service demonstration...\n');

            // Step 1: Check service health
            console.log('📊 Checking payment service health...');
            const health = await paymentGatewayService.healthCheck();
            console.log('✅ Payment service status:', health.status);
            console.log('🕒 Service timestamp:', health.timestamp);
            console.log('');

            // Step 2: Create payment intent (called by user-subscription service)
            console.log('💳 Creating payment intent for subscription...');
            const createRequest: CreatePaymentIntentRequest = {
                subscriptionId: 'sub_example_12345',
                userId: 'user_example_67890',
                amount: 2999, // $29.99
                currency: 'USD',
                paymentMethod: PaymentMethod.CREDIT_CARD,
                description: 'Monthly Pro Plan Subscription',
                webhookUrl: 'http://user-subscription-service:3001/api/webhooks/payment'
            };

            const paymentIntent = await paymentGatewayService.createPaymentIntent(createRequest);
            console.log('✅ Payment intent created:');
            console.log('   ID:', paymentIntent.id);
            console.log('   Status:', paymentIntent.status);
            console.log('   Amount:', `$${paymentIntent.amount / 100}`);
            console.log('   Client Secret:', paymentIntent.clientSecret);
            console.log('');

            // Step 3: Simulate payment processing (would happen automatically)
            console.log('⚡ Simulating payment processing...');
            const processedPayment = await paymentGatewayService.simulatePaymentProcessing(
                paymentIntent.id, 
                true // Simulate success
            );

            console.log('✅ Payment processed successfully:');
            console.log('   Payment Intent Status:', processedPayment.paymentIntent.status);
            console.log('   Webhook Delivered:', processedPayment.webhookDelivered);
            console.log('   Processing Time:', `${processedPayment.simulation.processingTime}ms`);
            
            if (processedPayment.payment) {
                console.log('   Payment ID:', processedPayment.payment.id);
                console.log('   Gateway Payment ID:', processedPayment.payment.gatewayPaymentId);
                console.log('   Net Amount:', `$${(processedPayment.payment.netAmount || 0) / 100}`);
            }
            console.log('');

            // Step 4: Retrieve payment intent (for status checking)
            console.log('🔍 Retrieving payment intent status...');
            const retrievedIntent = await paymentGatewayService.getPaymentIntent(paymentIntent.id);
            console.log('✅ Retrieved payment intent:');
            console.log('   Status:', retrievedIntent.status);
            console.log('   Confirmed At:', retrievedIntent.confirmedAt);
            console.log('');

            // Step 5: Get user payment history
            console.log('📋 Getting user payment history...');
            const userPayments = await paymentGatewayService.getUserPaymentIntents('user_example_67890');
            console.log('✅ User has', userPayments.length, 'payment intent(s)');
            userPayments.forEach((payment, index) => {
                console.log(`   ${index + 1}. ${payment.id} - ${payment.status} - $${payment.amount / 100}`);
            });
            console.log('');

            // Step 6: Demonstrate batch processing (for subscription renewals)
            console.log('🔄 Demonstrating batch payment processing...');
            
            // Create a few more payment intents for batch processing
            const batchPaymentIntents: string[] = [];
            for (let i = 1; i <= 3; i++) {
                const batchIntent = await paymentGatewayService.createPaymentIntent({
                    subscriptionId: `sub_batch_${i}`,
                    userId: `user_batch_${i}`,
                    amount: 1999, // $19.99
                    description: `Batch payment ${i}`,
                    webhookUrl: 'http://user-subscription-service:3001/api/webhooks/payment'
                });
                batchPaymentIntents.push(batchIntent.id);
            }

            // Process them in batch
            const batchResults = await paymentGatewayService.batchProcessPayments(batchPaymentIntents);
            console.log('✅ Batch processing completed:');
            console.log('   Total processed:', batchResults.length);
            console.log('   Successful:', batchResults.filter(r => r.simulation.success).length);
            console.log('   Failed:', batchResults.filter(r => !r.simulation.success).length);
            console.log('');

            console.log('🎉 Payment gateway service demonstration completed!');
            console.log('');
            console.log('📝 Summary:');
            console.log('   ✅ Service health check');
            console.log('   ✅ Payment intent creation');
            console.log('   ✅ Payment processing simulation');
            console.log('   ✅ Payment status retrieval');
            console.log('   ✅ User payment history');
            console.log('   ✅ Batch payment processing');
            console.log('   ✅ Webhook delivery simulation');

            // Verify final status
            expect(processedPayment.paymentIntent.status).toBe('SUCCEEDED');
            expect(processedPayment.webhookDelivered).toBe(true);
            expect(processedPayment.simulation.success).toBe(true);
        }, 30000); // Increase timeout for demonstration

        it('should handle payment failures gracefully', async () => {
            console.log('❌ Demonstrating payment failure handling...\n');

            // Create payment intent
            const paymentIntent = await paymentGatewayService.createPaymentIntent({
                subscriptionId: 'sub_failure_test',
                userId: 'user_failure_test',
                amount: 999,
                description: 'Payment failure test'
            });

            // Simulate failure
            const failedPayment = await paymentGatewayService.simulatePaymentProcessing(
                paymentIntent.id, 
                false // Simulate failure
            );

            console.log('❌ Payment failed as expected:');
            console.log('   Status:', failedPayment.paymentIntent.status);
            console.log('   Failure Reason:', failedPayment.paymentIntent.failureReason);
            console.log('   Webhook Delivered:', failedPayment.webhookDelivered);
            console.log('');

            expect(failedPayment.paymentIntent.status).toBe('FAILED');
            expect(failedPayment.simulation.success).toBe(false);
        });
    });
});
