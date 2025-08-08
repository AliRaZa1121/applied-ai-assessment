import { ApiProperty } from '@nestjs/swagger';
import { BillingInterval } from '@prisma/client';

export class PlanResponseDto {
    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'Unique plan identifier'
    })
    id: string;

    @ApiProperty({
        example: 'Premium Plan',
        description: 'Name of the subscription plan'
    })
    name: string;

    @ApiProperty({
        example: 'Full access to all premium features',
        description: 'Description of the plan',
        nullable: true
    })
    description: string | null;

    @ApiProperty({
        example: 2999,
        description: 'Price in cents (e.g., 2999 = $29.99)'
    })
    price: number;

    @ApiProperty({
        example: 'USD',
        description: 'Currency code'
    })
    currency: string;

    @ApiProperty({
        example: 'MONTHLY',
        description: 'Billing interval',
        enum: BillingInterval
    })
    billingInterval: BillingInterval;

    @ApiProperty({
        example: 7,
        description: 'Trial period in days'
    })
    trialDays: number;

    @ApiProperty({
        example: ['Feature 1', 'Feature 2', 'Unlimited access'],
        description: 'Array of plan features'
    })
    features: any;

    @ApiProperty({
        example: true,
        description: 'Whether the plan is active'
    })
    isActive: boolean;

    @ApiProperty({
        example: '2025-08-08T10:30:00.000Z',
        description: 'Plan creation timestamp'
    })
    createdAt: Date;

    @ApiProperty({
        example: '2025-08-08T10:30:00.000Z',
        description: 'Plan last update timestamp'
    })
    updatedAt: Date;
    
}
