
export interface PlanUpdateInterface {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingInterval: 'MONTHLY' | 'YEARLY' | 'WEEKLY';
}
