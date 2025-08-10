import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { MICROSERVICES } from './utilities/constant/microservice-constant';

async function bootstrap() {

  console.log(`Starting Notification ${MICROSERVICES.PAYMENT_SERVICE}...`);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@rabbitmq:5672'],
      queue: MICROSERVICES.PAYMENT_SERVICE,
      queueOptions: {
        durable: false,
      },
    },
  });

  await app.listen();
}
void bootstrap();
