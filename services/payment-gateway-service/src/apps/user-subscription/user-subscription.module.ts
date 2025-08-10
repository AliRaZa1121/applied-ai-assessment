import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { MICROSERVICES } from 'src/utilities/constant/microservice-constant';
import { UserSubscriptionService } from './user-subscription.service';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: MICROSERVICES.USER_SUBSCRIPTION_SERVICE,
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://guest:guest@rabbitmq:5672'],
                    queue: MICROSERVICES.USER_SUBSCRIPTION_SERVICE,
                    queueOptions: {
                        durable: false,
                    },
                },
            },
        ]),
    ],
    providers: [UserSubscriptionService],
    exports: [UserSubscriptionService],
})
export class UserSubscriptionModule { }
