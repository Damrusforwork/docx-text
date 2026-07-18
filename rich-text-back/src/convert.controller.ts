import {
  Controller,
  Post,
  Body,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger'
import { Response } from 'express'
import { ConvertService } from './convert.service'

class ConvertPdfDto {
  html: string
  filename?: string
}

class ConvertDocxDto {
  html: string
  filename?: string
}

@ApiTags('Convert')
@Controller('convert')
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post('pdf')
  @ApiOperation({ summary: 'Convert HTML to PDF' })
  @ApiBody({ type: ConvertPdfDto })
  async convertToPdf(
    @Body() body: ConvertPdfDto,
    @Res() res: Response,
  ) {
    if (!body.html) {
      throw new HttpException('html is required', HttpStatus.BAD_REQUEST)
    }
    try {
      const buffer = await this.convertService.convertHtmlToPdf(
        body.html,
      )
      const filename = body.filename || 'document.pdf'
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      })
      res.end(buffer)
    } catch (err) {
      throw new HttpException(
        `Conversion failed: ${(err as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }

  @Post('docx')
  @ApiOperation({ summary: 'Convert HTML to DOCX' })
  @ApiBody({ type: ConvertDocxDto })
  async convertToDocx(
    @Body() body: ConvertDocxDto,
    @Res() res: Response,
  ) {
    if (!body.html) {
      throw new HttpException('html is required', HttpStatus.BAD_REQUEST)
    }
    try {
      const buffer = await this.convertService.convertHtmlToDocx(
        body.html,
      )
      const filename = body.filename || 'document.docx'
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length,
      })
      res.end(buffer)
    } catch (err) {
      throw new HttpException(
        `Conversion failed: ${(err as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      )
    }
  }
}
