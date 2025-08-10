import { WebhookDeliveryStatus, WebhookEventType } from '@prisma/client';
import { randomUUID } from 'crypto';
import { DummyWebhookData } from '../interfaces/webhook-interface';

export function generateDummyWebhookData(
    paymentId: string,
    amount: number,
    currency: string,
) : DummyWebhookData  {
    return {
        paymentId,
        eventType: WebhookEventType.PAYMENT_SUCCEEDED,
        status: WebhookDeliveryStatus.DELIVERED,
        payload: {
            id: `evt_${randomUUID()}`,
            object: 'event',
            type: 'payment_succeeded',
            data: {
                object: {
                    id: `pi_${randomUUID()}`,
                    amount,
                    currency: currency.toLowerCase(),
                    status: 'succeeded',
                    metadata: {
                        refId: randomUUID(),
                    },
                },
            },
            created: Math.floor(Date.now() / 1000), // Unix timestamp
        },
    };
}
