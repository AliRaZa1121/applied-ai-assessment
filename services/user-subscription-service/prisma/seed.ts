import { BillingInterval, PrismaClient, SubscriptionStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting user & subscription service seed...');

    // Clean existing data
    await prisma.billingHistory.deleteMany();
    await prisma.webhookEvent.deleteMany();
    await prisma.subscription.deleteMany();
    await prisma.plan.deleteMany();
    await prisma.token.deleteMany();
    await prisma.user.deleteMany();

    // Create Plans
    const basicPlan = await prisma.plan.create({
        data: {
            name: 'Basic',
            description: 'Basic plan with essential features',
            price: 999, // $9.99
            currency: 'USD',
            billingInterval: BillingInterval.MONTHLY,
            trialDays: 7,
            features: [
                'Up to 5 projects',
                'Basic support',
                '1GB storage',
                'Standard templates'
            ],
            isActive: true,
        },
    });

    const proPlan = await prisma.plan.create({
        data: {
            name: 'Pro',
            description: 'Professional plan with advanced features',
            price: 2999, // $29.99
            currency: 'USD',
            billingInterval: BillingInterval.MONTHLY,
            trialDays: 14,
            features: [
                'Unlimited projects',
                'Priority support',
                '10GB storage',
                'Premium templates',
                'Advanced analytics',
                'API access'
            ],
            isActive: true,
        },
    });

    const enterprisePlan = await prisma.plan.create({
        data: {
            name: 'Enterprise',
            description: 'Enterprise plan with custom solutions',
            price: 9999, // $99.99
            currency: 'USD',
            billingInterval: BillingInterval.MONTHLY,
            trialDays: 30,
            features: [
                'Everything in Pro',
                'Dedicated support',
                'Unlimited storage',
                'Custom integrations',
                'White-label solution',
                'SLA guarantee'
            ],
            isActive: true,
        },
    });

    const yearlyProPlan = await prisma.plan.create({
        data: {
            name: 'Pro Yearly',
            description: 'Professional plan billed annually (20% discount)',
            price: 28799, // $287.99 (20% discount)
            currency: 'USD',
            billingInterval: BillingInterval.YEARLY,
            trialDays: 14,
            features: [
                'All Pro features',
                '20% annual discount',
                'Priority support',
                'Advanced analytics'
            ],
            isActive: true,
        },
    });

    console.log('✅ Created plans:', { basicPlan: basicPlan.id, proPlan: proPlan.id, enterprisePlan: enterprisePlan.id, yearlyProPlan: yearlyProPlan.id });

    // Create Users
    const hashedPassword = await argon2.hash('Click123');

    const johnDoe = await prisma.user.create({
        data: {
            email: 'john.doe@example.com',
            name: 'John Doe',
            password: hashedPassword,
            emailVerified: true,
            isActive: true,
        },
    });

    const janeSmith = await prisma.user.create({
        data: {
            email: 'jane.smith@example.com',
            name: 'Jane Smith',
            password: hashedPassword,
            emailVerified: true,
            isActive: true,
        },
    });

    const bobJohnson = await prisma.user.create({
        data: {
            email: 'bob.johnson@example.com',
            name: 'Bob Johnson',
            password: hashedPassword,
            emailVerified: false,
            isActive: true,
        },
    });

    const aliceWilson = await prisma.user.create({
        data: {
            email: 'alice.wilson@example.com',
            name: 'Alice Wilson',
            password: hashedPassword,
            emailVerified: true,
            isActive: true,
        },
    });

    console.log('✅ Created users:', { johnDoe: johnDoe.id, janeSmith: janeSmith.id, bobJohnson: bobJohnson.id, aliceWilson: aliceWilson.id });

    // Create Subscriptions
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    const johnSubscription = await prisma.subscription.create({
        data: {
            userId: johnDoe.id,
            planId: proPlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: currentDate,
            currentPeriodEnd: futureDate,
            trialStart: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            trialEnd: currentDate,
        },
    });

    const janeSubscription = await prisma.subscription.create({
        data: {
            userId: janeSmith.id,
            planId: basicPlan.id,
            status: SubscriptionStatus.TRIALING,
            trialStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            trialEnd: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        },
    });

    const aliceSubscription = await prisma.subscription.create({
        data: {
            userId: aliceWilson.id,
            planId: enterprisePlan.id,
            status: SubscriptionStatus.ACTIVE,
            currentPeriodStart: currentDate,
            currentPeriodEnd: futureDate,
        },
    });

    // Bob has no subscription (free user)

    console.log('✅ Created subscriptions:', {
        johnSubscription: johnSubscription.id,
        janeSubscription: janeSubscription.id,
        aliceSubscription: aliceSubscription.id
    });

    // Create sample billing history
    await prisma.billingHistory.create({
        data: {
            subscriptionId: johnSubscription.id,
            amount: proPlan.price,
            currency: 'USD',
            status: 'PAID',
            paymentId: 'pay_1234567890',
            description: 'Monthly subscription - Pro Plan',
            billingDate: currentDate,
        },
    });

    await prisma.billingHistory.create({
        data: {
            subscriptionId: aliceSubscription.id,
            amount: enterprisePlan.price,
            currency: 'USD',
            status: 'PAID',
            paymentId: 'pay_0987654321',
            description: 'Monthly subscription - Enterprise Plan',
            billingDate: currentDate,
        },
    });

    console.log('✅ Created billing history records');

    // Create sample webhook events
    await prisma.webhookEvent.create({
        data: {
            subscriptionId: johnSubscription.id,
            eventType: 'PAYMENT_SUCCEEDED',
            eventData: {
                paymentId: 'pay_1234567890',
                amount: proPlan.price,
                currency: 'USD',
                timestamp: currentDate.toISOString(),
            },
            processed: true,
        },
    });

    await prisma.webhookEvent.create({
        data: {
            subscriptionId: janeSubscription.id,
            eventType: 'SUBSCRIPTION_CREATED',
            eventData: {
                subscriptionId: janeSubscription.id,
                planId: basicPlan.id,
                trialEnd: janeSubscription.trialEnd?.toISOString(),
                timestamp: janeSubscription.createdAt.toISOString(),
            },
            processed: true,
        },
    });

    console.log('✅ Created webhook events');

    console.log('🎉 User & Subscription Service seed completed!');

    // Print summary
    console.log('\n📊 Seed Data Summary:');
    console.log(`👥 Users: ${await prisma.user.count()}`);
    console.log(`📋 Plans: ${await prisma.plan.count()}`);
    console.log(`💳 Subscriptions: ${await prisma.subscription.count()}`);
    console.log(`💰 Billing Records: ${await prisma.billingHistory.count()}`);
    console.log(`🔗 Webhook Events: ${await prisma.webhookEvent.count()}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
