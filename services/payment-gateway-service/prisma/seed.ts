import {
    GatewayType,
    PaymentMethod,
    PaymentStatus,
    PrismaClient,
    WebhookDeliveryStatus,
    WebhookEventType,
} from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Stripe-only payment gateway seed...');

    // Clean existing data (FK-safe order)
    await prisma.webhookDelivery.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.paymentGatewayConfig.deleteMany();

    // Create Stripe Payment Gateway Configuration
    const stripeGateway = await prisma.paymentGatewayConfig.create({
        data: {
            name: 'Stripe Gateway',
            gatewayType: GatewayType.STRIPE,
            isActive: true,
            isDefault: true,
            sandboxMode: true,
            supportedMethods: [
                PaymentMethod.CREDIT_CARD,
                PaymentMethod.DEBIT_CARD,
                PaymentMethod.DIGITAL_WALLET,
            ],
            settings: {
                webhookEndpoint: '/api/webhooks/stripe',
                supportedCurrencies: ['USD', 'EUR', 'GBP'],
                features: ['subscriptions', 'one-time-payments', 'refunds'],
            },
        },
    });

    console.log('✅ Created Stripe gateway config:', stripeGateway.id);

    // Create some Stripe payments
    const payment1 = await prisma.payment.create({
        data: {
            amount: 2999, // $29.99
            currency: 'USD',
            status: PaymentStatus.SUCCEEDED,
            gatewayPaymentId: 'pi_1234567890',
            gatewayChargeId: 'ch_1234567890',
            processingFee: 117, // 2.9% + 30¢
            netAmount: 2882,
            processedAt: new Date(),
        },
    });

    const payment2 = await prisma.payment.create({
        data: {
            amount: 999, // $9.99
            currency: 'USD',
            status: PaymentStatus.FAILED,
            gatewayPaymentId: 'pi_failed_987654',
            gatewayChargeId: null,
            processedAt: new Date(),
        },
    });

    console.log('✅ Created Stripe payments:', {
        payment1: payment1.id,
        payment2: payment2.id,
    });

    // Create webhook deliveries for Stripe events
    const webhook1 = await prisma.webhookDelivery.create({
        data: {
            paymentId: payment1.id,
            eventType: WebhookEventType.PAYMENT_SUCCEEDED,
            payload: {
                id: payment1.gatewayPaymentId,
                object: 'payment_intent',
                amount: payment1.amount,
                currency: payment1.currency.toLowerCase(),
                status: 'succeeded',
            },
            status: WebhookDeliveryStatus.DELIVERED,
        },
    });

    const webhook2 = await prisma.webhookDelivery.create({
        data: {
            paymentId: payment2.id,
            eventType: WebhookEventType.PAYMENT_FAILED,
            payload: {
                id: payment2.gatewayPaymentId,
                object: 'payment_intent',
                amount: payment2.amount,
                currency: payment2.currency.toLowerCase(),
                status: 'failed',
                last_payment_error: {
                    code: 'card_declined',
                    message: 'Your card was declined.',
                },
            },
            status: WebhookDeliveryStatus.DELIVERED,
        },
    });

    console.log('✅ Created Stripe webhook deliveries:', {
        webhook1: webhook1.id,
        webhook2: webhook2.id,
    });

    console.log('🎉 Stripe-only seed completed!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
