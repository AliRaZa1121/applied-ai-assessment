import { ApiProperty } from "@nestjs/swagger";
import { BillingInterval } from "@prisma/client";
import { IsArray, IsBoolean, IsDefined, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreatePlanRequestDTO {
    @ApiProperty({
        example: 'Premium Plan',
        description: 'Name of the subscription plan'
    })
    @IsDefined()
    @IsString()
    name: string;

    @ApiProperty({
        example: 'Full access to all premium features',
        description: 'Description of the plan',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: 2999,
        description: 'Price in cents (e.g., 2999 = $29.99)'
    })
    @IsDefined()
    @IsInt()
    @Min(0)
    price: number;

    @ApiProperty({
        example: 'USD',
        description: 'Currency code',
        default: 'USD'
    })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiProperty({
        example: 'MONTHLY',
        description: 'Billing interval',
        enum: BillingInterval
    })
    @IsDefined()
    @IsEnum(BillingInterval)
    billingInterval: BillingInterval;

    @ApiProperty({
        example: 7,
        description: 'Trial period in days',
        default: 0
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    trialDays?: number;

    @ApiProperty({
        example: ['Feature 1', 'Feature 2', 'Unlimited access'],
        description: 'Array of plan features',
        required: false
    })
    @IsOptional()
    @IsArray()
    features?: string[];

    @ApiProperty({
        example: true,
        description: 'Whether the plan is active',
        default: true
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}