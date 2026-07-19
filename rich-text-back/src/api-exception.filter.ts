import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Response } from 'express'

interface ErrorResponse {
  code?: string
  message?: string
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>()
    const payload = exception instanceof HttpException
      ? exception.getResponse()
      : null
    const errorResponse = typeof payload === 'object' && payload !== null
      ? payload as ErrorResponse
      : null
    const entityTooLarge = (exception as { type?: string })?.type === 'entity.too.large'
    const errorStatus = (exception as { status?: number })?.status
    const statusCode = entityTooLarge
      ? HttpStatus.PAYLOAD_TOO_LARGE
      : exception instanceof HttpException
        ? exception.getStatus()
        : typeof errorStatus === 'number' && errorStatus >= 400 && errorStatus < 600
          ? errorStatus
          : HttpStatus.INTERNAL_SERVER_ERROR
    const code = entityTooLarge
      ? 'PAYLOAD_TOO_LARGE'
      : errorResponse?.code
        || (statusCode === HttpStatus.BAD_REQUEST ? 'INVALID_REQUEST' : 'INTERNAL_ERROR')
    const message = entityTooLarge
      ? 'Request body exceeds the allowed size.'
      : errorResponse?.message
        || (statusCode === HttpStatus.BAD_REQUEST ? 'Request body is invalid.' : 'An internal error occurred.')

    if (statusCode >= 500) {
      const error = exception as Error
      this.logger.error(error.message || 'Unhandled API error', error.stack)
    }

    if (!response.headersSent) response.status(statusCode).json({ statusCode, code, message })
  }
}
