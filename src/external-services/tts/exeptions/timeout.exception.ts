import { IntrinsicException } from '@nestjs/common'

export class TimeoutException extends IntrinsicException {
  constructor(elapsedTimeInSeconds: number) {
    super(`Tts timed out after ${elapsedTimeInSeconds} seconds`)
  }
}
