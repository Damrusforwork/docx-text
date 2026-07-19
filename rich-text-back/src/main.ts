import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { NestExpressApplication } from '@nestjs/platform-express'
import { AppModule } from './app.module'
import { ApiExceptionFilter } from './api-exception.filter'
import { BACKEND_CONFIG } from './config'

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)
  app.useGlobalFilters(new ApiExceptionFilter())
  app.setGlobalPrefix('api')
  app.enableCors({
    origin: BACKEND_CONFIG.corsOrigins,
    methods: ['GET', 'POST'],
  })
  app.useBodyParser('json', { limit: BACKEND_CONFIG.jsonBodyLimit })
  app.useBodyParser('urlencoded', { limit: BACKEND_CONFIG.jsonBodyLimit, extended: true })

  const config = new DocumentBuilder()
    .setTitle('Doc Convert API')
    .setDescription('HTML to PDF/DOCX conversion using LibreOffice headless')
    .setVersion('1.0')
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, document)

  await app.listen(BACKEND_CONFIG.port)
  console.log(`Backend running on http://localhost:${BACKEND_CONFIG.port}`)
  console.log(`Swagger docs at http://localhost:${BACKEND_CONFIG.port}/docs`)
}
bootstrap()
