import { Injectable } from '@nestjs/common'
import { Socket } from 'socket.io'
import * as cookie from 'cookie'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './types/jwt-payload.interface'
import { UsersService } from '../users/users.service'
import { User } from '../users/user.entity'

@Injectable()
export class WsAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async getAuthenticatedUser(client: Socket): Promise<User | null> {
    if (!client.handshake.headers.cookie) {
      return null
    }

    const cookies = cookie.parse(client.handshake.headers.cookie)

    if (!cookies['access_token']) {
      return null
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        cookies['access_token'],
      )
      const user = await this.usersService.findById(payload.userId)

      if (!user) {
        return null
      }

      client.user = user
      return user
    } catch {
      return null
    }
  }
}
