import {
    ArgumentsHost,
    Catch,
    Logger,
    RpcExceptionFilter,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

@Catch()
export class MicroserviceExceptionFilter implements RpcExceptionFilter {
    private readonly logger = new Logger(MicroserviceExceptionFilter.name); // Create a new instance of the NestJS Logger

    catch(exception: unknown, host: ArgumentsHost): Observable<any> {
        let errorMessage: string;

        if (exception instanceof RpcException) {
            const error = (exception as RpcException).getError();
            errorMessage =
                typeof error === 'string'
                    ? error
                    : JSON.stringify(error, null, 2);
        } else if (exception instanceof Error) {
            errorMessage = (exception as Error).message;
        } else {
            errorMessage = 'Unknown microservice error occurred';
        }

        this.logger.error(errorMessage);

        return throwError(() => new RpcException(errorMessage));
    }
}
