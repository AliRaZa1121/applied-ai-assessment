import { HttpStatus } from '@nestjs/common';
import {
  ErrorApiWrapperInterface,
  SuccessApiWrapperInterface,
} from '../interfaces/response.interface';

export const successApiWrapper = function <T>(
  data: T | null = null,
  message: string | null = null,
  statusCode: number = HttpStatus.CREATED,
) {
  const SuccessApiWrapper: SuccessApiWrapperInterface<T> = {
    message: message ? [message] : [],
    statusCode: statusCode,
    data: data,
    jsonApiVersion: { version: process.env.APP_VERSION || '1.0.0' },
  };
  return SuccessApiWrapper;
};

export const errorApiWrapper = function (
  error: string,
  statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR,
) {
  const ErrorApiWrapper: ErrorApiWrapperInterface = {
    error: error,
    message: [error],
    statusCode: statusCode,
    jsonApiVersion: { version: process.env.APP_VERSION || '1.0.0' },
  };
  return ErrorApiWrapper;
};
