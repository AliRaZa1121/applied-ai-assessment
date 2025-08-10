import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString, IsUUID } from 'class-validator';

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
        example: 'e3b8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1d',
        description: 'Payment method ID to use for the subscription'
    })
    @IsDefined()
    @IsString()
    @IsUUID()
    paymentId: string;

}


export class UpdateSubscriptionRequestDTO {
    @ApiProperty({
        example: 'e4c8f8a2-4b8c-4a5d-9b2a-8c7e5f3a9b1c',
        description: 'New plan ID to upgrade to'
    })
    @IsDefined()
    @IsString()
    @IsUUID()
    newPlanId: string;
}
