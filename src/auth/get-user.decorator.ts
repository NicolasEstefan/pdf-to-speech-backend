import { createParamDecorator } from '@nestjs/common'
import { User } from '../users/user.entity'

export const GetUser = createParamDecorator((_data, context): User => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const req = context.switchToHttp().getRequest()
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  return req.user as User
})
