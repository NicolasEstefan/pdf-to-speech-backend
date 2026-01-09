import { IntrinsicException } from '@nestjs/common'

export class AuthFailedException extends IntrinsicException {
  constructor() {
    super('Authentication to google failed')
  }
}
