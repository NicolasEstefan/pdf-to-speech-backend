import { Injectable, Logger, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import chalk from 'chalk'

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  logger: Logger = new Logger(LoggerMiddleware.name)

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req

    const start = Date.now()
    res.on('finish', () => {
      const ms = Date.now() - start
      this.logger.log(
        `${method} ${originalUrl} ${res.statusCode} from ${ip} ${chalk.yellow('+' + ms + 'ms')}`,
      )
    })

    next()
  }
}
