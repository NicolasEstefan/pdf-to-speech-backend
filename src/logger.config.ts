import { WinstonModule } from 'nest-winston'
import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import fs from 'fs'
import chalk from 'chalk'

const logDir = 'logs'

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

export const winstonLogger = WinstonModule.createLogger({
  level: 'verbose',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const timestamp = String(info.timestamp)
      const level = String(info.level)
      const message = String(info.message)
      const context = typeof info.context === 'string' ? info.context : 'App'
      const stack = typeof info.stack === 'string' ? info.stack : undefined
      return `${timestamp} [${level}] [${context}] ${stack ?? message}`
    }),
  ),
  transports: [
    new DailyRotateFile({
      dirname: logDir,
      filename: 'app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
    new DailyRotateFile({
      dirname: logDir,
      filename: 'error-%DATE%.log',
      level: 'error',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '7d',
      zippedArchive: true,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize({}),
        winston.format.printf((info) => {
          const level = String(info.level)
          const message = String(info.message)
          const context =
            typeof info.context === 'string' ? info.context : 'App'
          return `[${level}] [${chalk.magenta(context)}] ${message}`
        }),
      ),
    }),
  ],
})
