import { Injectable } from '@nestjs/common';
import { MailService } from 'src/mail/mail.service';
import { SendMailMessageInterface } from 'src/utilities/interfaces/mail-interface';

@Injectable()
export class NotificationService {
    constructor(private readonly mailService: MailService) { }

    sendEmailNotification(data: SendMailMessageInterface) {
        this.mailService.sendMail(data);
    }
}
