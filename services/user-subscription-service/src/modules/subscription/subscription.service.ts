import {
    BadRequestException,
    HttpStatus,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import {
    BillingInterval,
    BillingStatus,
    Plan,
    Prisma,
    Subscription,
    SubscriptionStatus,
} from '@prisma/client';
import { PaymentIntegrationService } from 'src/apps/payment-integration/payment-integration.service';
import DatabaseService from 'src/database/database.service';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import {
    BillingHistoryResponseDto,
    SubscriptionResponseDto,
    SubscriptionWithPlanResponseDto,
} from './dto/subscription-response.dto';
import {
    CreateSubscriptionRequestDTO,
    UpdateSubscriptionRequestDTO,
} from './dto/subscription.dto';

type Tx = Prisma.TransactionClient;

@Injectable()
export default class SubscriptionService {
    private readonly logger = new Logger(SubscriptionService.name);
    private static readonly DEFAULT_CURRENCY = 'USD';

    constructor(
        private readonly db: DatabaseService,
        private readonly payments: PaymentIntegrationService,
    ) { }

    // =====================================
    // SUBSCRIPTION MANAGEMENT
    // =====================================

    // On This Function, I will initiate payment intent on payment gateway service with card token
    async createSubscription(
        userId: string,
        data: CreateSubscriptionRequestDTO,
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        try {
            const { planId, paymentId } = data;

            // Check if user exists and doesn't have an active subscription
            await this.ensureNoActiveOrPendingSubscription(userId);

            // Verify plan exists and is active
            const plan = await this.getActivePlanOrThrow(planId);

            // Validate payment ID with payment gateway service (keep original logic)
            await this.ensurePaymentIdIsUsable(paymentId);

            const { start: currentPeriodStart, end: currentPeriodEnd } = this.computePeriod(
                plan.billingInterval,
            );

            // Transactional block
            const result = await this.db.$transaction(async (tx) => {
                // Create subscription with PENDING status initially
                const subscription = await tx.subscription.create({
                    data: {
                        userId,
                        planId,
                        status: SubscriptionStatus.PENDING,
                        currentPeriodStart,
                        currentPeriodEnd,
                    },
                });

                // Billing history record for subscription creation
                await this.createBillingHistory(tx, {
                    subscriptionId: subscription.id,
                    amount: plan.price,
                    currency: SubscriptionService.DEFAULT_CURRENCY,
                    gatewayPaymentId: paymentId,
                    status: BillingStatus.PENDING,
                    description: `Subscription to ${plan.name} plan`,
                    billingDate: new Date(),
                });

                // Initiate payment intent with payment gateway service (kept in the transaction as in original)
                await this.payments.createPaymentIntent({
                    subscriptionId: subscription.id,
                    userId,
                    paymentId,
                    amount: plan.price,
                    currency: SubscriptionService.DEFAULT_CURRENCY,
                    description: `Subscription to ${plan.name} plan (Payment ID: ${paymentId})`,
                });

                return subscription;
            });

            return successApiWrapper(result, 'Subscription created successfully', HttpStatus.CREATED);
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            this.logger.error('Failed to create subscription', error as any);
            throw new BadRequestException('Failed to create subscription');
        }
    }

    async getUserSubscriptions(
        userId: string,
    ): Promise<BaseResponseDto<SubscriptionWithPlanResponseDto[]>> {
        try {
            const subscriptions = await this.db.subscription.findMany({
                where: { userId },
                include: { plan: true },
                orderBy: { createdAt: 'desc' },
            });

            return successApiWrapper(
                subscriptions as SubscriptionWithPlanResponseDto[],
                'User subscriptions retrieved successfully',
                HttpStatus.OK,
            );
        } catch (error) {
            this.logger.error('Failed to retrieve user subscriptions', error as any);
            throw new BadRequestException('Failed to retrieve user subscriptions');
        }
    }

    async getActiveSubscription(
        userId: string,
    ): Promise<BaseResponseDto<SubscriptionWithPlanResponseDto | null>> {
        try {
            const subscription = await this.findLatestActiveOrPastDue(userId, { includePlan: true });

            return successApiWrapper(
                subscription as SubscriptionWithPlanResponseDto | null,
                'Active subscription retrieved successfully',
                HttpStatus.OK,
            );
        } catch (error) {
            this.logger.error('Failed to retrieve active subscription', error as any);
            throw new BadRequestException('Failed to retrieve active subscription');
        }
    }

    async updateSubscription(
        userId: string,
        data: UpdateSubscriptionRequestDTO,
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        const { newPlanId } = data;

        // Check if user has an active subscription
        const existingSubscription = await this.findLatestActiveOrPastDue(userId);
        if (!existingSubscription) {
            throw new BadRequestException('No active subscription found for user');
        }

        if (existingSubscription.planId === newPlanId) {
            throw new BadRequestException('You are already subscribed to this plan');
        }

        // Verify new plan exists and is active
        const newPlan = await this.getActivePlanOrThrow(newPlanId);

        if (newPlan.gatewayPlanId == null) {
            throw new BadRequestException('Plan does not have a valid gateway plan ID');
        }

        // Call payment gateway to update subscription (kept order & check)
        const gatewayPaymentId = await this.payments.updateSubscription({
            subscriptionId: existingSubscription.id,
            gatewayPlanId: newPlan.gatewayPlanId,
            userId,
        });

        if (!gatewayPaymentId) {
            throw new BadRequestException('Failed to update subscription with payment gateway');
        }

        // Transactional block for all DB changes
        const result = await this.db.$transaction(async (tx) => {
            // Cancel existing subscription
            await tx.subscription.update({
                where: { id: existingSubscription.id },
                data: { status: SubscriptionStatus.CANCELLED },
            });

            // Create new subscription with the new plan
            const { start: currentPeriodStart, end: currentPeriodEnd } = this.computePeriod(
                newPlan.billingInterval,
            );

            const newSubscription = await tx.subscription.create({
                data: {
                    userId,
                    planId: newPlanId,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart,
                    currentPeriodEnd,
                },
            });

            // Billing history record for subscription update
            await this.createBillingHistory(tx, {
                subscriptionId: newSubscription.id,
                amount: newPlan.price,
                currency: SubscriptionService.DEFAULT_CURRENCY,
                gatewayPaymentId,
                status: BillingStatus.PENDING,
                description: `Updated subscription to ${newPlan.name} plan`,
                billingDate: new Date(),
            });

            return newSubscription;
        });

        return successApiWrapper(
            result as SubscriptionResponseDto,
            'Subscription updated successfully',
            HttpStatus.OK,
        );
    }

    async cancelSubscription(userId: string): Promise<BaseResponseDto<void>> {
        const subscription = await this.findLatestActiveOrPastDue(userId);
        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        // Cancel any active payment intents with the payment gateway service
        try {
            await this.payments.cancelSubscription(userId);
        } catch (error) {
            // Log error but don't fail the cancellation process (kept behavior)
            this.logger.warn('Failed to cancel payment intent:', error as any);
        }

        await this.db.subscription.update({
            where: { id: subscription.id },
            data: { cancelledAt: new Date(), status: SubscriptionStatus.CANCELLED },
        });

        return successApiWrapper(null, 'Subscription cancelled successfully', HttpStatus.OK);
    }


    /** Throws if user already has ACTIVE/PENDING/PAST_DUE subscription. */
    private async ensureNoActiveOrPendingSubscription(userId: string): Promise<void> {
        const existing = await this.db.subscription.findFirst({
            where: {
                userId,
                status: {
                    in: [
                        SubscriptionStatus.ACTIVE,
                        SubscriptionStatus.PENDING,
                        SubscriptionStatus.PAST_DUE,
                    ],
                },
            },
            select: { id: true },
        });

        if (existing) {
            throw new BadRequestException('User already has an active subscription');
        }
    }

    /** Ensures plan exists and is active; returns it. */
    private async getActivePlanOrThrow(planId: string): Promise<Plan> {
        const plan = await this.db.plan.findUnique({ where: { id: planId } });
        if (!plan || !plan.isActive) {
            throw new BadRequestException('Invalid or inactive plan');
        }
        return plan;
    }

    /**
     * NOTE: keeps your original logic where validatePaymentId() returning true means "invalid/not usable".
     */
    private async ensurePaymentIdIsUsable(paymentId: string): Promise<void> {
        const isValidPaymentId = await this.payments.validatePaymentId(paymentId);
        // console.log kept out; replace with logger for cleaner output
        this.logger.debug(`Payment ID validation result: ${isValidPaymentId}`);
        if (isValidPaymentId) {
            throw new BadRequestException('Invalid payment ID');
        }
    }

    /** Returns the latest ACTIVE or PAST_DUE subscription (optionally with plan). */
    private async findLatestActiveOrPastDue(
        userId: string,
        opts?: { includePlan?: boolean },
    ): Promise<(Subscription & { plan?: Plan }) | null> {
        return this.db.subscription.findFirst({
            where: { userId, status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] } },
            include: { plan: !!opts?.includePlan },
            orderBy: { createdAt: 'desc' },
        }) as any;
    }

    /** Computes current billing period {start, end} based on interval (kept same behavior). */
    private computePeriod(
        interval: BillingInterval,
        from: Date = new Date(),
    ): { start: Date; end: Date } {
        const start = new Date(from);
        let end = new Date(from);

        if (interval === BillingInterval.MONTHLY) {
            end = new Date(start);
            end.setMonth(end.getMonth() + 1);
        } else if (interval === BillingInterval.YEARLY) {
            end = new Date(start);
            end.setFullYear(end.getFullYear() + 1);
        } else if (interval === BillingInterval.WEEKLY) {
            end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
        }

        return { start, end };
    }

    /** Creates a billingHistory entry. */
    private async createBillingHistory(
        tx: Tx,
        input: {
            subscriptionId: string;
            amount: number;
            currency: string;
            gatewayPaymentId: string;
            status: BillingStatus;
            description: string;
            billingDate: Date;
        },
    ): Promise<void> {
        await tx.billingHistory.create({ data: input });
    }
}
