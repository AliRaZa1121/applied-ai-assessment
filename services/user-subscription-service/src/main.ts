import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import InjectPipes from './core/injectables/pipes';
import InjectSwagger from './core/injectables/swagger';
import { MICROSERVICES } from './utilities/constant/microservice-constant';

async function bootstrap() {
  // Create the main HTTP application
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });

  InjectPipes(app);
  InjectSwagger(app);

  // Connect microservice for RabbitMQ communication
  console.log(`Connecting microservice ${MICROSERVICES.USER_SUBSCRIPTION_SERVICE}...`);
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: ['amqp://guest:guest@rabbitmq:5672'],
      queue: MICROSERVICES.USER_SUBSCRIPTION_SERVICE,
      queueOptions: {
        durable: false,
      },
    },
  });

  // Start all microservices
  await app.startAllMicroservices();
  console.log('✅ User Subscription microservice connected');

  // Start the HTTP server
  await app.listen(3000);
}
void bootstrap();
