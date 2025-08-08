import {
    ArgumentsHost,
    Catch,
    RpcExceptionFilter
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { Logger } from 'src/helpers/logger.helper';

@Catch()
export class MicroserviceExceptionFilter implements RpcExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): Observable<any> {
        let errorMessage: string;
        
        if (exception instanceof RpcException) {
            const error = exception.getError();
            errorMessage =
                typeof error === 'string'
                    ? error
                    : JSON.stringify(error, null, 2);
        } else if (exception instanceof Error) {
            errorMessage = exception.message;
        } else {
            errorMessage = 'Unknown microservice error occurred';
        }

        Logger.Error(errorMessage, 'MicroserviceException');

        return throwError(() => new RpcException(errorMessage));
    }
}
