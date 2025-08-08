import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import InjectPipes from './core/injectables/pipes';
import InjectSwagger from './core/injectables/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });

  InjectPipes(app);
  InjectSwagger(app);

  await app.listen(3000);
}
void bootstrap();
