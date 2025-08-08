import { ApiProperty } from '@nestjs/swagger';
import { IsDefined, IsString } from 'class-validator';

export class ProcessWebhookDTO {
    @ApiProperty({
        example: 'payment_succeeded',
        description: 'Type of webhook event from payment gateway',
        enum: ['payment_succeeded', 'payment_failed', 'payment_refunded', 'subscription_created', 'subscription_updated']
    })
    @IsDefined()
    @IsString()
    eventType: string;

    @ApiProperty({
        example: {
            subscriptionId: 'sub_123',
            paymentId: 'pay_456',
            amount: 2999,
            currency: 'USD',
            status: 'succeeded'
        },
        description: 'Webhook payload data from payment gateway'
    })
    @IsDefined()
    eventData: any;

    @ApiProperty({
        example: 'whsec_1234567890abcdef',
        description: 'Webhook signature for verification',
        required: false
    })
    signature?: string;
}
