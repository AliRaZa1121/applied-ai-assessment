import { PrismaClient, PaymentIntentStatus, PaymentStatus, GatewayType, PaymentMethod, WebhookDeliveryStatus, RefundStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting payment gateway service seed...');

    // Clean existing data
    await prisma.webhookDelivery.deleteMany();
    await prisma.refund.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.paymentIntent.deleteMany();
    await prisma.paymentGatewayConfig.deleteMany();

    // Create Stripe Payment Gateway Configuration
    const stripeGateway = await prisma.paymentGatewayConfig.create({
        data: {
            name: 'Stripe Gateway',
            gatewayType: GatewayType.STRIPE,
            isActive: true,
            isDefault: true,
            sandboxMode: true,
            supportedMethods: [PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.DIGITAL_WALLET],
            settings: {
                webhookEndpoint: '/api/webhooks/stripe',
                supportedCurrencies: ['USD', 'EUR', 'GBP'],
            },
        },
    });

    console.log('✅ Created Stripe payment gateway config:', {
        stripeGateway: stripeGateway.id
    });

    // Create sample Payment Intents (for different subscriptions)
    const paymentIntent1 = await prisma.paymentIntent.create({
        data: {
            subscriptionId: 'sub_john_pro_monthly',
            userId: 'user_john_doe',
            amount: 2999, // $29.99
            currency: 'USD',
            status: PaymentIntentStatus.SUCCEEDED,
            paymentMethod: PaymentMethod.CREDIT_CARD,
            clientSecret: 'pi_1234567890_secret_abcdef',
            description: 'Monthly subscription - Pro Plan',
            metadata: {
                subscriptionId: 'sub_john_pro_monthly',
                planName: 'Pro',
                billingCycle: 'monthly',
            },
            confirmedAt: new Date(),
        },
    });

    const paymentIntent2 = await prisma.paymentIntent.create({
        data: {
            subscriptionId: 'sub_alice_enterprise_monthly',
            userId: 'user_alice_wilson',
            amount: 9999, // $99.99
            currency: 'USD',
            status: PaymentIntentStatus.SUCCEEDED,
            paymentMethod: PaymentMethod.CREDIT_CARD,
            clientSecret: 'pi_0987654321_secret_zyxwvu',
            description: 'Monthly subscription - Enterprise Plan',
            metadata: {
                subscriptionId: 'sub_alice_enterprise_monthly',
                planName: 'Enterprise',
                billingCycle: 'monthly',
            },
            confirmedAt: new Date(),
        },
    });

    const paymentIntent3 = await prisma.paymentIntent.create({
        data: {
            subscriptionId: 'sub_failed_attempt',
            userId: 'user_test_failure',
            amount: 999, // $9.99
            currency: 'USD',
            status: PaymentIntentStatus.FAILED,
            paymentMethod: PaymentMethod.CREDIT_CARD,
            clientSecret: 'pi_failed_secret_123456',
            description: 'Monthly subscription - Basic Plan',
            failureReason: 'Your card was declined.',
            failedAttempts: 2,
            lastAttemptAt: new Date(),
            metadata: {
                subscriptionId: 'sub_failed_attempt',
                planName: 'Basic',
                billingCycle: 'monthly',
            },
        },
    });

    console.log('✅ Created payment intents:', {
        paymentIntent1: paymentIntent1.id,
        paymentIntent2: paymentIntent2.id,
        paymentIntent3: paymentIntent3.id
    });

    // Create successful payments for the Payment Intents
    const payment1 = await prisma.payment.create({
        data: {
            paymentIntentId: paymentIntent1.id,
            amount: 2999, // $29.99
            currency: 'USD',
            status: PaymentStatus.SUCCEEDED,
            gatewayPaymentId: 'ch_1234567890',
            gatewayChargeId: 'ch_1234567890',
            gatewayResponse: {
                id: 'ch_1234567890',
                amount: 2999,
                currency: 'usd',
                status: 'succeeded',
                created: Math.floor(Date.now() / 1000),
            },
            processingFee: 117, // 2.9% + 30¢
            netAmount: 2882,
            processedAt: new Date(),
        },
    });

    const payment2 = await prisma.payment.create({
        data: {
            paymentIntentId: paymentIntent2.id,
            amount: 9999, // $99.99
            currency: 'USD',
            status: PaymentStatus.SUCCEEDED,
            gatewayPaymentId: 'ch_0987654321',
            gatewayChargeId: 'ch_0987654321',
            gatewayResponse: {
                id: 'ch_0987654321',
                amount: 9999,
                currency: 'usd',
                status: 'succeeded',
                created: Math.floor(Date.now() / 1000),
            },
            processingFee: 320, // 2.9% + 30¢
            netAmount: 9679,
            processedAt: new Date(),
        },
    });

    // Create failed payment for PaymentIntent3 (simulating a decline)
    const payment3 = await prisma.payment.create({
        data: {
            paymentIntentId: paymentIntent3.id,
            amount: 999, // $9.99
            currency: 'USD',
            status: PaymentStatus.FAILED,
            gatewayResponse: {
                error: {
                    code: 'card_declined',
                    message: 'Your card was declined.',
                    type: 'card_error',
                },
            },
            isSimulated: true,
            processedAt: new Date(),
        },
    });

    console.log('✅ Created payments:', {
        payment1: payment1.id,
        payment2: payment2.id,
        payment3: payment3.id
    });

    // Create Webhook Deliveries for Payment Intent status updates
    const webhook1 = await prisma.webhookDelivery.create({
        data: {
            paymentIntentId: paymentIntent1.id,
            eventType: 'PAYMENT_INTENT_SUCCEEDED',
            webhookUrl: 'http://user-subscription-service:3000/api/webhooks/payment',
            payload: {
                eventType: 'payment_intent.succeeded',
                data: {
                    object: {
                        id: paymentIntent1.id,
                        amount: paymentIntent1.amount,
                        currency: paymentIntent1.currency,
                        status: 'succeeded',
                        metadata: paymentIntent1.metadata,
                    },
                },
                timestamp: new Date().toISOString(),
            },
            httpStatus: 200,
            response: 'OK',
            deliveryAttempts: 1,
            status: WebhookDeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
        },
    });

    const webhook2 = await prisma.webhookDelivery.create({
        data: {
            paymentIntentId: paymentIntent3.id,
            eventType: 'PAYMENT_INTENT_FAILED',
            webhookUrl: 'http://user-subscription-service:3000/api/webhooks/payment',
            payload: {
                eventType: 'payment_intent.failed',
                data: {
                    object: {
                        id: paymentIntent3.id,
                        amount: paymentIntent3.amount,
                        currency: paymentIntent3.currency,
                        status: 'failed',
                        last_payment_error: {
                            code: 'card_declined',
                            message: 'Your card was declined.',
                        },
                        metadata: paymentIntent3.metadata,
                    },
                },
                timestamp: new Date().toISOString(),
            },
            httpStatus: 200,
            response: 'OK',
            deliveryAttempts: 1,
            status: WebhookDeliveryStatus.DELIVERED,
            deliveredAt: new Date(),
        },
    });

    console.log('✅ Created webhook deliveries:', {
        webhook1: webhook1.id,
        webhook2: webhook2.id
    });

    // Create a sample refund
    const refund1 = await prisma.refund.create({
        data: {
            paymentId: payment1.id,
            amount: 1000, // Partial refund of $10.00
            currency: 'USD',
            status: RefundStatus.SUCCEEDED,
            reason: 'REQUESTED_BY_CUSTOMER',
            gatewayRefundId: 're_1234567890',
            gatewayResponse: {
                id: 're_1234567890',
                amount: 1000,
                currency: 'usd',
                status: 'succeeded',
                created: Math.floor(Date.now() / 1000),
            },
            processedAt: new Date(),
        },
    });

    console.log('✅ Created refunds:', { refund1: refund1.id });

    console.log('🎉 Payment Gateway Service seed completed!');

    // Print summary
    console.log('\n📊 Seed Data Summary:');
    console.log(`⚙️  Gateway Configs: ${await prisma.paymentGatewayConfig.count()}`);
    console.log(`💳 Payment Intents: ${await prisma.paymentIntent.count()}`);
    console.log(`💰 Payments: ${await prisma.payment.count()}`);
    console.log(`↩️  Refunds: ${await prisma.refund.count()}`);
    console.log(`🔗 Webhook Deliveries: ${await prisma.webhookDelivery.count()}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
