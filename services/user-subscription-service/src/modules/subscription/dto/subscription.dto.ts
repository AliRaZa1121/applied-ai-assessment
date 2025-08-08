import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDefined, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSubscriptionRequestDTO {
    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'Plan ID to subscribe to'
    })
    @IsDefined()
    @IsString()
    @IsUUID()
    planId: string;

    @ApiProperty({
        example: 'tok_visa',
        description: 'Payment method token from the payment gateway'
    })
    @IsDefined()
    @IsString()
    @IsUUID()
    cardToken: string;

}


export class UpgradeSubscriptionRequestDTO {
    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'New plan ID to upgrade to'
    })
    @IsDefined()
    @IsString()
    @IsUUID()
    newPlanId: string;

    @ApiProperty({
        example: false,
        description: 'Whether to prorate the upgrade',
        default: true,
        required: false
    })
    @IsOptional()
    @IsBoolean()
    prorate?: boolean;
}
