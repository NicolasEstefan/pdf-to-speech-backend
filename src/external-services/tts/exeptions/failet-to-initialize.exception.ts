import { IntrinsicException } from '@nestjs/common'

export class FailedToInitializeException extends IntrinsicException {
  constructor(error: object) {
    super('Failed to initialize tts', {
      cause: error,
    })
  }
}
