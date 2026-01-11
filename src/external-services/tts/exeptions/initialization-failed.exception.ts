import { IntrinsicException } from '@nestjs/common'

export class InitializationFailedException extends IntrinsicException {
  constructor(error: object) {
    super('Failed to initialize tts', {
      cause: error,
    })
  }
}
