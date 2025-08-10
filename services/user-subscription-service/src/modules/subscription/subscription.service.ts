import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, BillingStatus, SubscriptionStatus } from '@prisma/client';
import { PaymentService } from 'src/apps/payment/payment.service';
import DatabaseService from 'src/database/database.service';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import {
    BillingHistoryResponseDto,
    SubscriptionResponseDto,
    SubscriptionWithPlanResponseDto
} from './dto/subscription-response.dto';
import {
    CreateSubscriptionRequestDTO,
    UpdateSubscriptionRequestDTO
} from './dto/subscription.dto';

@Injectable()
export default class SubscriptionService {
    constructor(
        private readonly _databaseService: DatabaseService,
        private readonly _paymentService: PaymentService
    ) { }

    // =====================================
    // SUBSCRIPTION MANAGEMENT
    // =====================================

    // On This Function, I will initiate payment intent on payment gateway service with card token
    async createSubscription(
        userId: string,
        data: CreateSubscriptionRequestDTO
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        try {
            const { planId, paymentId } = data;

            // Check if user exists and doesn't have an active subscription
            const existingSubscription = await this._databaseService.subscription.findFirst({
                where: {
                    userId,
                    status: {
                        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PENDING, SubscriptionStatus.PAST_DUE]
                    }
                }
            });

            if (existingSubscription) {
                throw new BadRequestException('User already has an active subscription');
            }

            // Verify plan exists and is active
            const plan = await this._databaseService.plan.findUnique({
                where: { id: data.planId }
            });

            if (!plan || !plan.isActive) {
                throw new BadRequestException('Invalid or inactive plan');
            }

            // Validate payment ID with payment gateway service
            const isValidPaymentId = await this._paymentService.validatePaymentId(paymentId);
            console.log('Payment ID validation result:', isValidPaymentId);
            if (isValidPaymentId) {
                throw new BadRequestException('Invalid payment ID');
            }

            const now = new Date();
            let currentPeriodStart = now;
            let currentPeriodEnd = new Date();

            // Calculate current period end based on billing interval
            if (plan.billingInterval === BillingInterval.MONTHLY) {
                currentPeriodEnd = new Date(currentPeriodStart);
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            } else if (plan.billingInterval === BillingInterval.YEARLY) {
                currentPeriodEnd = new Date(currentPeriodStart);
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            } else if (plan.billingInterval === BillingInterval.WEEKLY) {
                currentPeriodEnd = new Date(currentPeriodStart.getTime() + (7 * 24 * 60 * 60 * 1000));
            }

            // Transactional block
            const result = await this._databaseService.$transaction(async (prisma) => {
                // Create subscription with PENDING status initially
                const subscription = await prisma.subscription.create({
                    data: {
                        userId,
                        planId: data.planId,
                        status: SubscriptionStatus.PENDING,
                        currentPeriodStart,
                        currentPeriodEnd,
                    }
                });

                // Billing history record for subscription creation
                await prisma.billingHistory.create({
                    data: {
                        subscriptionId: subscription.id,
                        amount: plan.price,
                        currency: 'USD',
                        gatewayPaymentId: paymentId,
                        status: BillingStatus.PENDING,
                        description: `Subscription to ${plan.name} plan`,
                        billingDate: new Date(),
                    }
                });

                // Initiate payment intent with payment gateway service
                await this._paymentService.createPaymentIntent({
                    subscriptionId: subscription.id,
                    userId,
                    paymentId: paymentId,
                    amount: plan.price,
                    currency: 'USD',
                    description: `Subscription to ${plan.name} plan (Payment ID: ${paymentId})`
                });

                return subscription;
            });

            return successApiWrapper(
                result,
                'Subscription created successfully',
                HttpStatus.CREATED
            );
        } catch (error) {
            if (error instanceof BadRequestException) throw error;
            throw new BadRequestException('Failed to create subscription');
        }
    }

    async getUserSubscriptions(userId: string): Promise<BaseResponseDto<SubscriptionWithPlanResponseDto[]>> {
        try {
            const subscriptions = await this._databaseService.subscription.findMany({
                where: { userId },
                include: { plan: true },
                orderBy: { createdAt: 'desc' }
            });

            return successApiWrapper(
                subscriptions as SubscriptionWithPlanResponseDto[],
                'User subscriptions retrieved successfully',
                HttpStatus.OK
            );
        } catch (error) {
            throw new BadRequestException('Failed to retrieve user subscriptions');
        }
    }

    async getActiveSubscription(userId: string): Promise<BaseResponseDto<SubscriptionWithPlanResponseDto | null>> {
        try {
            const subscription = await this._databaseService.subscription.findFirst({
                where: {
                    userId,
                    status: {
                        in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]
                    }
                },
                include: { plan: true },
                orderBy: { createdAt: 'desc' }
            });

            return successApiWrapper(
                subscription as SubscriptionWithPlanResponseDto | null,
                'Active subscription retrieved successfully',
                HttpStatus.OK
            );
        } catch (error) {
            throw new BadRequestException('Failed to retrieve active subscription');
        }
    }


    async updateSubscription(userId: string, data: UpdateSubscriptionRequestDTO): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        const { newPlanId } = data;

        // Check if user has an active subscription
        const existingSubscription = await this._databaseService.subscription.findFirst({
            where: {
                userId,
                status: {
                    in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]
                }
            }
        });

        if (!existingSubscription) {
            throw new BadRequestException('No active subscription found for user');
        }

        if (existingSubscription.planId === newPlanId) {
            throw new BadRequestException('You are already subscribed to this plan');
        }

        // Verify new plan exists and is active
        const newPlan = await this._databaseService.plan.findUnique({
            where: { id: newPlanId }
        });

        if (!newPlan || !newPlan.isActive) {
            throw new BadRequestException('Invalid or Inactive Plan');
        }

        if (newPlan.gatewayPlanId == null || newPlan.gatewayPlanId == undefined) {
            throw new BadRequestException('Plan does not have a valid gateway plan ID');
        }

        // Call payment gateway to update subscription
        const gatewayPaymentId = await this._paymentService.updateSubscription({
            subscriptionId: existingSubscription.id,
            gatewayPlanId: newPlan.gatewayPlanId,
            userId
        });

        if (!gatewayPaymentId) {
            throw new BadRequestException('Failed to update subscription with payment gateway');
        }


        // Transactional block for all DB changes
        const result = await this._databaseService.$transaction(async (prisma) => {
            // Cancel existing subscription
            await prisma.subscription.update({
                where: { id: existingSubscription.id },
                data: {
                    status: SubscriptionStatus.CANCELLED,
                }
            });

            // Create new subscription with the new plan
            const now = new Date();
            let currentPeriodStart = now;
            let currentPeriodEnd = new Date();
            // Calculate current period end based on billing interval
            if (newPlan.billingInterval === BillingInterval.MONTHLY) {
                currentPeriodEnd = new Date(currentPeriodStart);
                currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
            } else if (newPlan.billingInterval === BillingInterval.YEARLY) {
                currentPeriodEnd = new Date(currentPeriodStart);
                currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
            } else if (newPlan.billingInterval === BillingInterval.WEEKLY) {
                currentPeriodEnd = new Date(currentPeriodStart.getTime() + (7 * 24 * 60 * 60 * 1000));
            }

            const newSubscription = await prisma.subscription.create({
                data: {
                    userId,
                    planId: newPlanId,
                    status: SubscriptionStatus.ACTIVE,
                    currentPeriodStart,
                    currentPeriodEnd,
                }
            });

            // Billing history record for subscription update
            await prisma.billingHistory.create({
                data: {
                    subscriptionId: newSubscription.id,
                    amount: newPlan.price,
                    currency: 'USD',
                    gatewayPaymentId: gatewayPaymentId,
                    status: BillingStatus.PENDING,
                    description: `Updated subscription to ${newPlan.name} plan`,
                    billingDate: new Date(),
                }
            });

            return newSubscription;
        });

        return successApiWrapper(
            result as SubscriptionResponseDto,
            'Subscription updated successfully',
            HttpStatus.OK
        );

    }


    async cancelSubscription(
        userId: string,
    ): Promise<BaseResponseDto<void>> {
        const subscription = await this._databaseService.subscription.findFirst({
            where: {
                userId,
                status: {
                    in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE]
                }
            }
        });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        // Cancel any active payment intents with the payment gateway service
        try {
            await this._paymentService.cancelSubscription(userId);
        } catch (error) {
            // Log error but don't fail the cancellation process
            console.error('Failed to cancel payment intent:', error);
        }

        const updateData: any = {
            cancelledAt: new Date(),
            status: SubscriptionStatus.CANCELLED
        };

        const updatedSubscription = await this._databaseService.subscription.update({
            where: { id: subscription.id },
            data: updateData
        });

        return successApiWrapper(
            null,
            'Subscription cancelled successfully',
            HttpStatus.OK
        );

    }

    // =====================================
    // BILLING HISTORY & STATISTICS
    // =====================================

    async getBillingHistory(
        userId: string,
        subscriptionId?: string
    ): Promise<BaseResponseDto<BillingHistoryResponseDto[]>> {
        try {
            const whereClause: any = {
                subscription: {
                    userId
                }
            };

            if (subscriptionId) {
                whereClause.subscriptionId = subscriptionId;
            }

            const billingHistory = await this._databaseService.billingHistory.findMany({
                where: whereClause,
                include: {
                    subscription: {
                        include: {
                            plan: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            });

            const formattedHistory: BillingHistoryResponseDto[] = billingHistory.map(record => ({
                id: record.id,
                subscriptionId: record.subscriptionId,
                amount: record.amount,
                currency: record.currency,
                status: record.status,
                paymentId: record.gatewayPaymentId,
                description: record.description,
                billingDate: record.billingDate,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            }));

            return successApiWrapper(
                formattedHistory,
                'Billing history retrieved successfully',
                HttpStatus.OK
            );
        } catch (error) {
            throw new BadRequestException('Failed to retrieve billing history');
        }
    }

}
