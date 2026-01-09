import { IntrinsicException } from '@nestjs/common'

export class TtsFailedException extends IntrinsicException {
  constructor(error: object) {
    super('Tts failed unexpectedly', { cause: error })
  }
}
