import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { MICROSERVICES, MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';

@Injectable()
export class NotificationService {

    constructor(
        @Inject(MICROSERVICES.NOTIFICATION_SERVICE)
        private readonly client: ClientProxy,
    ) { }

    async sendEmail(data: any) {
        this.client.emit(MICROSERVICES_MESSAGE_COMMANDS.NOTIFICATION_SERVICE.TRIGGER_EMAIL, data);
    }
}
