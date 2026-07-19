import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Res,
} from '@nestjs/common'
import { ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { BACKEND_CONFIG } from './config'
import {
  ConversionTimeoutError,
  ConvertService,
  InvalidDocumentError,
} from './convert.service'

class ConvertDocumentDto {
  html: string
  filename?: string
  renderManifest?: unknown
}

function apiError(code: string, message: string, status: HttpStatus) {
  return new HttpException({ code, message }, status)
}

@ApiTags('Convert')
@Controller('convert')
export class ConvertController {
  private readonly logger = new Logger(ConvertController.name)

  constructor(private readonly convertService: ConvertService) {}

  private validateRequest(body: ConvertDocumentDto, contentType: string | undefined) {
    if (!contentType?.toLowerCase().startsWith('application/json')) {
      throw apiError(
        'UNSUPPORTED_MEDIA_TYPE',
        'Content-Type must be application/json.',
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      )
    }
    if (!body || typeof body.html !== 'string' || !body.html.trim()) {
      throw apiError('INVALID_REQUEST', 'html is required.', HttpStatus.BAD_REQUEST)
    }
    if (Buffer.byteLength(body.html, 'utf8') > BACKEND_CONFIG.maxHtmlBytes) {
      throw apiError(
        'PAYLOAD_TOO_LARGE',
        'Document exceeds the allowed size.',
        HttpStatus.PAYLOAD_TOO_LARGE,
      )
    }
  }

  private safeFilename(filename: string | undefined, fallback: string) {
    const safe = (filename || fallback)
      .split(/[\\/]/)
      .pop()
      ?.replace(/[^A-Za-z0-9._-]/g, '_')
    return safe || fallback
  }

  private abortWhenDisconnected(response: Response) {
    const controller = new AbortController()
    response.once('close', () => {
      if (!response.writableEnded) controller.abort()
    })
    return controller
  }

  private handleConversionError(error: unknown, format: 'PDF' | 'DOCX'): never {
    const err = error as Error
    this.logger.error(`${format} conversion failed: ${err.message}`, err.stack)
    if (error instanceof InvalidDocumentError) {
      throw apiError(
        'INVALID_DOCUMENT',
        'Document contains invalid or unsupported data.',
        HttpStatus.UNPROCESSABLE_ENTITY,
      )
    }
    if (error instanceof ConversionTimeoutError) {
      throw apiError(
        'CONVERSION_TIMEOUT',
        'Document conversion timed out.',
        HttpStatus.GATEWAY_TIMEOUT,
      )
    }
    throw apiError(
      'CONVERSION_FAILED',
      'Unable to convert the document.',
      HttpStatus.INTERNAL_SERVER_ERROR,
    )
  }

  @Post('pdf')
  @ApiOperation({ summary: 'Convert HTML to PDF' })
  @ApiBody({ type: ConvertDocumentDto })
  async convertToPdf(
    @Body() body: ConvertDocumentDto,
    @Headers('content-type') contentType: string | undefined,
    @Res() response: Response,
  ) {
    this.validateRequest(body, contentType)
    const abortController = this.abortWhenDisconnected(response)
    try {
      const buffer = await this.convertService.convertHtmlToPdf(body.html, abortController.signal)
      const filename = this.safeFilename(body.filename, 'document.pdf')
      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      })
      response.end(buffer)
    } catch (error) {
      if (abortController.signal.aborted) return
      this.handleConversionError(error, 'PDF')
    }
  }

  @Post('docx')
  @ApiOperation({ summary: 'Convert HTML to DOCX' })
  @ApiBody({ type: ConvertDocumentDto })
  async convertToDocx(
    @Body() body: ConvertDocumentDto,
    @Headers('content-type') contentType: string | undefined,
    @Res() response: Response,
  ) {
    this.validateRequest(body, contentType)
    const abortController = this.abortWhenDisconnected(response)
    try {
      const buffer = await this.convertService.convertHtmlToDocx(body.html, abortController.signal)
      const filename = this.safeFilename(body.filename, 'document.docx')
      response.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      })
      response.end(buffer)
    } catch (error) {
      if (abortController.signal.aborted) return
      this.handleConversionError(error, 'DOCX')
    }
  }
}
