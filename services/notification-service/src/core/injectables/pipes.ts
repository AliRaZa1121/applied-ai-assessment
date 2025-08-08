import { INestMicroservice, ValidationPipe } from '@nestjs/common';

export default function InjectPipes(app: INestMicroservice) {
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );
}
