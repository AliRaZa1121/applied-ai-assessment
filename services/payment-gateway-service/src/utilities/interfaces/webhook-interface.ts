
export interface DummyWebhookData {
    paymentId: string;
    eventType: "PAYMENT_INTENT_CREATED" | "PAYMENT_INTENT_SUCCEEDED" | "PAYMENT_INTENT_FAILED" | "PAYMENT_INTENT_CANCELLED" | "PAYMENT_SUCCEEDED" | "PAYMENT_FAILED";
    status: "PENDING" | "DELIVERED" | "FAILED" | "RETRYING" | "ABANDONED";
    payload: {
        id: string; // e.g., evt_xxxO
        object: 'event';
        type: 'SUBSCRIPTION_CREATED' | 'SUBSCRIPTION_UPDATED' | 'SUBSCRIPTION_CANCELLED'; 
        data: {
            object: {
                id: string; // e.g., pi_xxx
                amount: number;
                currency: string; // lowercase ISO code
                status: string; // e.g., "succeeded"
                metadata: {
                    refId: string;
                };
            };
        };
        created: number; // Unix timestamp
    };
}
