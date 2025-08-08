import { INestApplication } from '@nestjs/common';
import { LoggingInterceptor } from '../interceptors/logging.interceptor';
import { Logger } from 'src/helpers/logger.helper';

export default function InjectInterceptors(app: INestApplication) {
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.use(Logger.GetLoggerMiddleware());
}
