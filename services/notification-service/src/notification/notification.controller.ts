import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SendMailMessageInterface } from 'src/utilities/interfaces/mail-interface';
import { NotificationService } from './notification.service';
import { MICROSERVICES_MESSAGE_COMMANDS } from 'src/utilities/constant/microservice-constant';

@Controller()
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @MessagePattern(MICROSERVICES_MESSAGE_COMMANDS.NOTIFICATION_SERVICE.TRIGGER_EMAIL)
    async handleEmailNotification(@Payload() data: SendMailMessageInterface) {
        console.log('Received email notification data:', data);
        return this.notificationService.sendEmailNotification(data);
    }

}
