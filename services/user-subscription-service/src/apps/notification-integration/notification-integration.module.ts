import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { NotificationIntegrationService } from './notification-integration.service';
import { MICROSERVICES } from 'src/utilities/constant/microservice-constant';

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
    providers: [NotificationIntegrationService],
    exports: [NotificationIntegrationService],
})
export class NotificationIntegrationModule { }
