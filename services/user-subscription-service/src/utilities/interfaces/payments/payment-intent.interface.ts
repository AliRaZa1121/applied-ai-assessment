export interface CreatePaymentIntentRequest {
    subscriptionId: string;
    userId: string;
    amount: number;
    paymentId: string;
    currency?: string;
    description?: string;
}