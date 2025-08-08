import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from 'src/utilities/constant/microservice-constant';
import { NotificationService } from './notification.service';

@Global()
@Module({
    imports: [
        ClientsModule.register([
            {
                name: MICROSERVICES.NOTIFICATION_SERVICE,
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://guest:guest@rabbitmq:5672'],  
                    queue: MICROSERVICES.NOTIFICATION_SERVICE,
                    queueOptions: {
                        durable: false,
                    },
                },
            },
        ]),
    ],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }
