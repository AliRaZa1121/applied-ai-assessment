import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';

@Module({
    imports: [MailModule],
    controllers: [NotificationController],
    providers: [NotificationService],
})
export class NotificationModule { }
