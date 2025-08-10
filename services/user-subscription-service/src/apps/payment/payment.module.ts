import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PaymentService } from './payment.service';
import { MICROSERVICES } from 'src/utilities/constant/microservice-constant';

@Global()
@Module({
    imports: [
        ClientsModule.register([
            {
                name: MICROSERVICES.PAYMENT_SERVICE,
                transport: Transport.RMQ,
                options: {
                    urls: ['amqp://guest:guest@rabbitmq:5672'],
                    queue: MICROSERVICES.PAYMENT_SERVICE,
                    queueOptions: {
                        durable: false,
                    },
                },
            },
        ]),
    ],
    providers: [PaymentService],
    exports: [PaymentService],
})
export class PaymentModule { }
