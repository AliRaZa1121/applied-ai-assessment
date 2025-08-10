import { ApiProperty } from '@nestjs/swagger';
import { BillingInterval } from '@prisma/client';
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';



export class UpdatePlanRequestDTO {
    @ApiProperty({
        example: 'Premium Plan Updated',
        description: 'Name of the subscription plan',
        required: false
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiProperty({
        example: 'Updated description',
        description: 'Description of the plan',
        required: false
    })
    @IsOptional()
    @IsString()
    description?: string;

    @ApiProperty({
        example: 3499,
        description: 'Price in cents',
        required: false
    })
    @IsOptional()
    @IsInt()
    @Min(0)
    price?: number;

    @ApiProperty({
        example: 'USD',
        description: 'Currency code',
        required: false
    })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiProperty({
        example: 'YEARLY',
        description: 'Billing interval',
        enum: BillingInterval,
        required: false
    })
    @IsOptional()
    @IsEnum(BillingInterval)
    billingInterval?: BillingInterval;

    @ApiProperty({
        example: ['Updated Feature 1', 'New Feature'],
        description: 'Array of plan features',
        required: false
    })
    @IsOptional()
    @IsArray()
    features?: string[];

    @ApiProperty({
        example: false,
        description: 'Whether the plan is active',
        required: false
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}
