import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, BillingStatus, SubscriptionStatus } from '@prisma/client';
import DatabaseService from 'src/database/database.service';
import { successApiWrapper } from 'src/utilities/constant/response-constant';
import { BaseResponseDto } from 'src/utilities/swagger-responses/base-response';
import {
    BillingHistoryResponseDto,
    PaymentInitiationResponseDto,
    SubscriptionResponseDto,
    SubscriptionWithPlanResponseDto
} from './dto/subscription-response.dto';
import {
    CreateSubscriptionRequestDTO,
    UpgradeSubscriptionRequestDTO
} from './dto/subscription.dto';
import { ProcessWebhookDTO } from './dto/webhook.dto';

@Injectable()
export default class SubscriptionService {
    constructor(private readonly _databaseService: DatabaseService) { }

    // =====================================
    // SUBSCRIPTION MANAGEMENT
    // =====================================

    // On This Function, I will initiate payment intent on payment gateway service with card token
    async createSubscription(
        userId: string,
        data: CreateSubscriptionRequestDTO
    ): Promise<BaseResponseDto<PaymentInitiationResponseDto>> {
        try {
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

            const now = new Date();
            let trialStart: Date | null = null;
            let trialEnd: Date | null = null;
            let currentPeriodStart = now;
            let currentPeriodEnd = new Date();

            // Calculate trial period if requested and available
            if (plan.trialDays > 0) {
                trialStart = now;
                trialEnd = new Date(now.getTime() + (plan.trialDays * 24 * 60 * 60 * 1000));
                currentPeriodStart = trialEnd;
            }

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

            const subscription = await this._databaseService.subscription.create({
                data: {
                    userId,
                    planId: data.planId,
                    status: trialStart ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING,
                    currentPeriodStart,
                    currentPeriodEnd,
                    trialStart,
                    trialEnd,
                }
            });

            // If trial, no payment needed immediately
            if (trialStart) {
                const paymentInitiation: PaymentInitiationResponseDto = {
                    subscriptionId: subscription.id,
                    status: 'trial_started',
                    paymentUrl: null,
                    paymentId: null,
                    trialEnd: trialEnd?.toISOString() || null
                };

                return successApiWrapper(
                    paymentInitiation,
                    'Subscription created successfully with trial',
                    HttpStatus.CREATED
                );
            }

            // TODO: Integrate with payment gateway service to create payment
            // For now, return mock payment data
            const paymentInitiation: PaymentInitiationResponseDto = {
                subscriptionId: subscription.id,
                status: 'payment_required',
                paymentUrl: `https://payment-gateway.example.com/pay/${subscription.id}`,
                paymentId: `pay_${Date.now()}`,
                trialEnd: null
            };

            return successApiWrapper(
                paymentInitiation,
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


    //NOTE: In This Function, I will call the payment-gateway service to cancel the subscription from payment gateway as well
    async cancelSubscription(
        userId: string,
        subscriptionId: string,
    ): Promise<BaseResponseDto<SubscriptionResponseDto>> {
        const subscription = await this._databaseService.subscription.findFirst({
            where: {
                id: subscriptionId,
                userId
            }
        });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        if (subscription.status === SubscriptionStatus.CANCELLED) {
            throw new BadRequestException('Subscription is already cancelled');
        }

        const updateData: any = {
            cancelledAt: new Date(),
        };

        const updatedSubscription = await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: updateData
        });

        return successApiWrapper(
            updatedSubscription as SubscriptionResponseDto,
            'Subscription cancelled successfully',
            HttpStatus.OK
        );

    }

    async upgradeSubscription(
        userId: string,
        subscriptionId: string,
        data: UpgradeSubscriptionRequestDTO
    ): Promise<BaseResponseDto<PaymentInitiationResponseDto>> {
        try {

            const subscription = await this._databaseService.subscription.findFirst({
                where: {
                    id: subscriptionId,
                    userId
                },
                include: { plan: true }
            });

            if (!subscription) {
                throw new NotFoundException('Subscription not found');
            }

            if (subscription.status !== SubscriptionStatus.ACTIVE && subscription.status !== SubscriptionStatus.TRIALING) {
                throw new BadRequestException('Only active subscriptions can be upgraded');
            }

            const newPlan = await this._databaseService.plan.findUnique({
                where: { id: data.newPlanId }
            });

            if (!newPlan || !newPlan.isActive) {
                throw new BadRequestException('Invalid or inactive plan');
            }

            if (newPlan.price <= subscription.plan.price) {
                throw new BadRequestException('New plan must have a higher price for upgrade');
            }

            // Create payment for upgrade
            const paymentInitiation: PaymentInitiationResponseDto = {
                subscriptionId: subscription.id,
                status: 'payment_processing',
                paymentUrl: `https://payment-gateway.example.com/pay/${subscription.id}/upgrade`,
                paymentId: `pay_upgrade_${Date.now()}`,
                trialEnd: null
            };

            await this._databaseService.subscription.update({
                where: { id: subscriptionId },
                data: {
                    planId: data.newPlanId,
                    status: SubscriptionStatus.PENDING, // Will be activated after payment
                }
            });

            return successApiWrapper(
                paymentInitiation,
                'Subscription upgrade initiated successfully',
                HttpStatus.OK
            );
        } catch (error) {
            if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
            throw new BadRequestException('Failed to upgrade subscription');
        }
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
                paymentId: record.paymentId,
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



    // =====================================
    // WEBHOOK PROCESSING
    // =====================================

    async processWebhook(data: ProcessWebhookDTO): Promise<BaseResponseDto<void>> {
        try {
            // Create webhook event record for audit trail
            await this._databaseService.webhookEvent.create({
                data: {
                    subscriptionId: data.eventData.subscriptionId || null,
                    eventType: data.eventType as any,
                    eventData: data.eventData,
                    processed: true,
                    retryCount: 0,
                }
            });

            // Process different webhook event types
            switch (data.eventType) {
                case 'payment_succeeded':
                    await this.handlePaymentSucceeded(data.eventData);
                    break;
                case 'payment_failed':
                    await this.handlePaymentFailed(data.eventData);
                    break;
                case 'subscription_created':
                    await this.handleSubscriptionCreated(data.eventData);
                    break;
                case 'subscription_updated':
                    await this.handleSubscriptionUpdated(data.eventData);
                    break;
                default:
                    console.warn(`Unhandled webhook event type: ${data.eventType}`);
            }

            return successApiWrapper(
                undefined,
                'Webhook processed successfully',
                HttpStatus.OK
            );
        } catch (error) {
            throw new BadRequestException('Failed to process webhook');
        }
    }

    // =====================================
    // PRIVATE WEBHOOK HANDLERS
    // =====================================

    private async handlePaymentSucceeded(eventData: any): Promise<void> {
        const { subscriptionId, amount, currency, paymentId } = eventData;

        // Update subscription status to active
        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.ACTIVE }
        });

        // Create billing history record
        await this._databaseService.billingHistory.create({
            data: {
                subscriptionId,
                amount: amount,
                currency: currency || 'USD',
                status: BillingStatus.PAID,
                paymentId: paymentId,
                billingDate: new Date(),
                description: `Payment for subscription ${subscriptionId}`,
            }
        });
    }

    private async handlePaymentFailed(eventData: any): Promise<void> {
        const { subscriptionId, amount, currency, error, paymentId } = eventData;

        // Update subscription status to past due
        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: { status: SubscriptionStatus.PAST_DUE }
        });

        // Create billing history record
        await this._databaseService.billingHistory.create({
            data: {
                subscriptionId,
                amount: amount,
                currency: currency || 'USD',
                status: BillingStatus.FAILED,
                paymentId: paymentId,
                billingDate: new Date(),
                description: `Failed payment for subscription ${subscriptionId}: ${error}`,
            }
        });
    }

    private async handleSubscriptionCreated(eventData: any): Promise<void> {
        // Handle subscription creation from payment provider
        const { subscriptionId, status } = eventData;

        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: status === 'active' ? SubscriptionStatus.ACTIVE : SubscriptionStatus.PENDING
            }
        });
    }

    private async handleSubscriptionUpdated(eventData: any): Promise<void> {
        // Handle subscription updates from payment provider
        const { subscriptionId, status, planId } = eventData;

        const updateData: any = {};

        if (status) {
            updateData.status = status === 'active' ? SubscriptionStatus.ACTIVE :
                status === 'cancelled' ? SubscriptionStatus.CANCELLED :
                    status === 'past_due' ? SubscriptionStatus.PAST_DUE :
                        SubscriptionStatus.PENDING;
        }

        if (planId) {
            updateData.planId = planId;
        }

        await this._databaseService.subscription.update({
            where: { id: subscriptionId },
            data: updateData
        });
    }
}
