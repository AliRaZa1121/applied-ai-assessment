import { ApiProperty } from '@nestjs/swagger';
import { BillingStatus, SubscriptionStatus } from '@prisma/client';
import { PlanResponseDto } from 'src/modules/plan/dto/plan-response.dto';

export class SubscriptionResponseDto {
    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'Unique subscription identifier'
    })
    id: string;

    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'User ID who owns this subscription'
    })
    userId: string;

    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'Plan ID associated with this subscription'
    })
    planId: string;

    @ApiProperty({
        example: 'ACTIVE',
        description: 'Current subscription status',
        enum: SubscriptionStatus
    })
    status: SubscriptionStatus;

    @ApiProperty({
        example: '2025-08-08T00:00:00.000Z',
        description: 'Current billing period start date',
        nullable: true
    })
    currentPeriodStart: Date | null;

    @ApiProperty({
        example: '2025-09-08T00:00:00.000Z',
        description: 'Current billing period end date',
        nullable: true
    })
    currentPeriodEnd: Date | null;

    @ApiProperty({
        example: null,
        description: 'Date when subscription was cancelled',
        nullable: true
    })
    cancelledAt: Date | null;

    @ApiProperty({
        example: '2025-08-08T10:30:00.000Z',
        description: 'Subscription creation timestamp'
    })
    createdAt: Date;

    @ApiProperty({
        example: '2025-08-08T10:30:00.000Z',
        description: 'Subscription last update timestamp'
    })
    updatedAt: Date;

    @ApiProperty({
        type: PlanResponseDto,
        description: 'Associated plan details',
        required: false
    })
    plan?: PlanResponseDto;
}

export class SubscriptionWithPlanResponseDto extends SubscriptionResponseDto {
    @ApiProperty({
        type: PlanResponseDto,
        description: 'Associated plan details'
    })
    declare plan: PlanResponseDto;
}

export class BillingHistoryResponseDto {
    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'Unique billing history record identifier'
    })
    id: string;

    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'Associated subscription ID'
    })
    subscriptionId: string;

    @ApiProperty({
        example: 2999,
        description: 'Billing amount in cents'
    })
    amount: number;

    @ApiProperty({
        example: 'USD',
        description: 'Currency code'
    })
    currency: string;

    @ApiProperty({
        example: 'PAID',
        description: 'Billing status',
        enum: BillingStatus
    })
    status: BillingStatus;

    @ApiProperty({
        example: 'payment_intent_1234567890',
        description: 'Payment ID from payment service',
        nullable: true
    })
    paymentId: string | null;

    @ApiProperty({
        example: 'Monthly subscription charge',
        description: 'Billing description',
        nullable: true
    })
    description: string | null;

    @ApiProperty({
        example: '2025-08-08T00:00:00.000Z',
        description: 'Billing date'
    })
    billingDate: Date;

    @ApiProperty({
        example: '2025-08-08T10:30:00.000Z',
        description: 'Record creation timestamp'
    })
    createdAt: Date;

    @ApiProperty({
        example: '2025-08-08T10:30:00.000Z',
        description: 'Record last update timestamp'
    })
    updatedAt: Date;
}

