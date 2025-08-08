import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendMailMessageInterface } from 'src/utilities/interfaces/mail-interface';

@Injectable()
export class MailService {
  constructor(
    private mailerService: MailerService,
    private readonly _configService: ConfigService,
  ) { }

  async sendMail(
    sendMailMessageInterface: SendMailMessageInterface,
  ): Promise<boolean> {
    try {
      return await this.mailerService.sendMail({
        to: sendMailMessageInterface.email,
        from: this._configService.get<string>('FROM_EMAIL'),
        subject: `${sendMailMessageInterface.subject} - ${this._configService.get<string>('APP_NAME')}`,
        ...(sendMailMessageInterface?.cc && {
          cc: sendMailMessageInterface?.cc,
        }),
        ...(sendMailMessageInterface?.bcc && {
          bcc: sendMailMessageInterface?.bcc,
        }),
        template: 'common-mail',
        context: {
          app_name: this._configService.get<string>('APP_NAME'),
          current_year: new Date().getFullYear(),
          subject: sendMailMessageInterface.subject,
          name: sendMailMessageInterface.name,
          body: sendMailMessageInterface.body,
          ...(sendMailMessageInterface.link && {
            link: sendMailMessageInterface.link,
          }),
          ...(sendMailMessageInterface.linkText && {
            linkText: sendMailMessageInterface.linkText,
          }),
        },
        ...(sendMailMessageInterface?.attachments && {
          attachments: sendMailMessageInterface?.attachments,
        }),
      });
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}
