import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationService {

    // constructor(
    //     @Inject(MICROSERVICES.NOTIFICATION_SERVICE)
    //     private readonly client: ClientProxy,
    // ) { }

    async sendEmail(data: any) {
        // this.client.emit(MICROSERVICE_MESSAGE_PATTERN.EMAIL, data);
    }

    async doubleNumber(num: number): Promise<void> {
        // await firstValueFrom(
        //     this.client.send<number, number>('double_number', num),
        // );
    }
}
