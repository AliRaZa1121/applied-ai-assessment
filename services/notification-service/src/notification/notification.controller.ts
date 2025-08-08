import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { MicroserviceMessagePatternEnum } from 'src/utilities/enums/microservice.enum';
import { SendMailMessageInterface } from 'src/utilities/interfaces/mail-interface';
import { NotificationService } from './notification.service';

@Controller()
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @MessagePattern(MicroserviceMessagePatternEnum.EMAIL)
    async handleEmailNotification(@Payload() data: SendMailMessageInterface) {
        return this.notificationService.sendEmailNotification(data);
    }

}
