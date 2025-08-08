import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsBoolean, IsInt, Min, IsString, IsArray } from 'class-validator';
import { BillingInterval } from '@prisma/client';

export class PlanListFilterDto {
    @ApiPropertyOptional({
        example: true,
        description: 'Filter by active status'
    })
    @IsOptional()
    @IsBoolean()
    @Type(() => Boolean)
    isActive?: boolean;

    @ApiPropertyOptional({
        enum: BillingInterval,
        example: BillingInterval.MONTHLY,
        description: 'Filter by billing interval'
    })
    @IsOptional()
    @IsEnum(BillingInterval)
    billingInterval?: BillingInterval;

    @ApiPropertyOptional({
        example: 1000,
        description: 'Filter by minimum price in cents'
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minPrice?: number;

    @ApiPropertyOptional({
        example: 5000,
        description: 'Filter by maximum price in cents'
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxPrice?: number;

    @ApiPropertyOptional({
        example: 'USD',
        description: 'Filter by currency'
    })
    @IsOptional()
    @IsString()
    currency?: string;

    @ApiPropertyOptional({
        example: 'Premium',
        description: 'Search by plan name (partial match)'
    })
    @IsOptional()
    @IsString()
    name?: string;

    @ApiPropertyOptional({
        example: 7,
        description: 'Filter by minimum trial days'
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    minTrialDays?: number;

    @ApiPropertyOptional({
        example: 30,
        description: 'Filter by maximum trial days'
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(0)
    maxTrialDays?: number;

    @ApiPropertyOptional({
        example: 1,
        description: 'Page number for pagination',
        default: 1
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number;

    @ApiPropertyOptional({
        example: 10,
        description: 'Number of items per page',
        default: 10
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number;

    @ApiPropertyOptional({
        example: 'name',
        description: 'Sort field',
        enum: ['name', 'price', 'createdAt', 'updatedAt']
    })
    @IsOptional()
    @IsString()
    sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';

    @ApiPropertyOptional({
        example: 'asc',
        description: 'Sort order',
        enum: ['asc', 'desc']
    })
    @IsOptional()
    @IsString()
    sortOrder?: 'asc' | 'desc';
}
