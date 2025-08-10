
export interface PlanUpdateInterface {
    planId: string;
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingInterval: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
}
