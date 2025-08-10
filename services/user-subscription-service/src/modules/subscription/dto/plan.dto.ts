import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString, IsOptional, IsInt, Min, IsEnum, IsArray, IsBoolean } from 'class-validator';
import { BillingInterval } from '@prisma/client';

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
