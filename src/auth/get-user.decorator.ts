import { createParamDecorator } from '@nestjs/common'
import { User } from '../users/user.entity'
import { Request } from 'express'
import { Socket } from 'socket.io'

export const GetUser = createParamDecorator((_data, context): User => {
  if (context.getType() === 'http') {
    const req = context.switchToHttp().getRequest<Request>()
    return req.user as User
  } else {
    const client = context.switchToWs().getClient<Socket>()
    return client.user as User
  }
})
