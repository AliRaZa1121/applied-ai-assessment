import { Injectable, Logger } from '@nestjs/common';
import DatabaseService from 'src/database/database.service';
import { DummyWebhookData } from 'src/utilities/interfaces/webhook-interface';

@Injectable()
export default class WebhookService {
    private readonly logger = new Logger(WebhookService.name);

    constructor(private readonly _databaseService: DatabaseService) { }

    async createSubscriptionHandler(data: DummyWebhookData): Promise<void> {
        // Logic to create subscription in the database        
    }

    async updateSubscriptionHandler(data: DummyWebhookData): Promise<void> {
        // Logic to update subscription in the database
    }

    async cancelSubscriptionHandler(data: DummyWebhookData): Promise<void> {
        // Logic to cancel subscription in the database
    }
}
