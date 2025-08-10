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
    CreateSubscriptionRequestDTO
} from './dto/subscription.dto';
import { ProcessWebhookDTO } from './dto/webhook.dto';

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

            // Create subscription with PENDING status initially
            const subscription = await this._databaseService.subscription.create({
                data: {
                    userId,
                    planId: data.planId,
                    status: SubscriptionStatus.PENDING,
                    currentPeriodStart,
                    currentPeriodEnd,
                }
            });

            // Billing history record for subscription creation
            await this._databaseService.billingHistory.create({
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
            this._paymentService.createPaymentIntent({
                subscriptionId: subscription.id,
                userId,
                paymentId: paymentId,
                amount: plan.price,
                currency: 'USD',
                description: `Subscription to ${plan.name} plan (Payment ID: ${paymentId})`
            });

            return successApiWrapper(
                subscription,
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

        // Cancel any active payment intents with the payment gateway service
        try {
            await this._paymentService.cancelPayment(subscriptionId);
        } catch (error) {
            // Log error but don't fail the cancellation process
            console.error('Failed to cancel payment intent:', error);
        }

        const updateData: any = {
            cancelledAt: new Date(),
            status: SubscriptionStatus.CANCELLED
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
                gatewayPaymentId: paymentId,
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
                gatewayPaymentId: paymentId,
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
