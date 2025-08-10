import { BillingInterval } from "@prisma/client";

export interface PlanCreateInterface {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingInterval: BillingInterval;
}
