import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { setupApp } from './setup-app'
import { winstonLogger } from './logger.config'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  })

  setupApp(app)

  await app.listen(process.env.PORT ?? 3000)
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
