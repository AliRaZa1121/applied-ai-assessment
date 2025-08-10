import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICROSERVICES, MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';
import { DummyWebhookData } from 'src/utilities/interfaces/webhook-interface';

@Injectable()
export class UserSubscriptionService {

    constructor(
        @Inject(MICROSERVICES.USER_SUBSCRIPTION_SERVICE)
        private readonly client: ClientProxy,
    ) { }

    async createSubscription(data: DummyWebhookData) {
        console.log('UserSubscriptionService: Creating subscription:', data);
        this.client.emit(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.CREATE_SUBSCRIPTION, data);
    }

    async updateSubscription(data: any) {
        console.log('UserSubscriptionService: Updating subscription:', data);
        this.client.emit(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.UPDATE_SUBSCRIPTION, data);
    }

    async cancelSubscription(data: any) {
        console.log('UserSubscriptionService: Cancelling subscription:', data);
        this.client.emit(MICROSERVICES_MESSAGE_COMMANDS.USER_SUBSCRIPTION_SERVICE.CANCEL_SUBSCRIPTION, data);
    }

}
