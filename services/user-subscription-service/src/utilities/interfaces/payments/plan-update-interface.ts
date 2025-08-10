import { BillingInterval } from "@prisma/client";

export interface PlanUpdateInterface {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingInterval: BillingInterval;
}
