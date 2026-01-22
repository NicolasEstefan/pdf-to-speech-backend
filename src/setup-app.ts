import { INestApplication, ValidationPipe } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import cookieParser from 'cookie-parser'
import { TransformInterceptor } from './transform.interceptor'

export function setupApp(app: INestApplication) {
  const configService = app.get(ConfigService)

  app.enableCors({
    origin: configService.getOrThrow<string>('FRONTEND_URL'),
    credentials: true,
  })
  app.use(cookieParser())
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))
  app.useGlobalInterceptors(new TransformInterceptor())

  return app
}
