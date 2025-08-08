import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import InjectPipes from './core/injectables/pipes';
import { MICROSERVICES } from './utilities/constant/microservice-constant';

async function bootstrap() {

  console.log(`Starting Notification ${MICROSERVICES.NOTIFICATION_SERVICE}...`);

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@rabbitmq:5672'],
      queue: MICROSERVICES.NOTIFICATION_SERVICE,
      queueOptions: {
        durable: false,
      },
    },
  });

  InjectPipes(app);
  await app.listen();
}
void bootstrap();
