import { repl } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  await repl(AppModule)
}
// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap()
