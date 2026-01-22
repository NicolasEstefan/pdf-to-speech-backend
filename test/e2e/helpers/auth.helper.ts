import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { User } from '../../../src/users/user.entity'
import { RefreshToken } from '../../../src/auth/refresh-token.entity'
import { RefreshTokensRepository } from '../../../src/auth/refresh-tokens.repository'
import { JwtPayload } from '../../../src/auth/types/jwt-payload.interface'
import crypto from 'crypto'
import dayjs from 'dayjs'
import * as cookie from 'cookie'
import { ConfigService } from '@nestjs/config'
import { Response } from 'supertest'

export class AuthTestHelper {
  private jwtService: JwtService
  private refreshTokensRepository: RefreshTokensRepository
  private configService: ConfigService

  constructor(app: INestApplication) {
    this.jwtService = app.get(JwtService)
    this.refreshTokensRepository = app.get(RefreshTokensRepository)
    this.configService = app.get(ConfigService)
  }

  async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      userId: user.id,
    }
    return await this.jwtService.signAsync(payload)
  }

  async generateRefreshToken(user: User): Promise<RefreshToken> {
    const refreshTokenDuration = this.configService.getOrThrow<number>(
      'REFRESH_TOKEN_DURATION',
    )

    const refreshToken = this.refreshTokensRepository.create({
      token: crypto.randomBytes(64).toString('base64url'),
      expiresAt: dayjs().add(refreshTokenDuration, 'seconds').toISOString(),
      user,
    })

    return await this.refreshTokensRepository.save(refreshToken)
  }

  async generateTokens(user: User): Promise<{
    accessToken: string
    refreshToken: RefreshToken
  }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.generateAccessToken(user),
      this.generateRefreshToken(user),
    ])

    return { accessToken, refreshToken }
  }

  getCookieHeader({
    accessToken,
    refreshToken,
  }: {
    accessToken?: string
    refreshToken?: string
  }): string {
    const cookies: string[] = []

    if (accessToken) {
      cookies.push(
        cookie.serialize('access_token', accessToken, {
          httpOnly: true,
        }),
      )
    }

    if (refreshToken) {
      cookies.push(
        cookie.serialize('refresh_token', refreshToken, {
          httpOnly: true,
        }),
      )
    }

    return cookies.join('; ')
  }
}
