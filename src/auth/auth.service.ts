import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Profile } from 'passport-google-oauth20'
import crypto from 'crypto'
import { LoginResult } from './login-result.interface'
import { UsersService } from '../users/users.service'
import { RefreshToken } from './refresh-token.entity'
import dayjs from 'dayjs'
import { User } from 'src/users/user.entity'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './jwt-payload.interface'
import { RefreshTokenResult } from './refresh-token-result.interface'
import { RefreshTokensRepository } from './refresh-tokens.repository'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async signInWithGoogle(profile: Profile): Promise<LoginResult> {
    if (!profile.emails || profile.emails.length < 1) {
      throw new UnauthorizedException()
    }

    let user = await this.usersService.findByGoogleId(profile.id)

    if (!user) {
      const username = profile.displayName.replace(/\s/g, '')
      user = await this.usersService.create({
        email: profile.emails[0].value,
        googleId: profile.id,
        username,
      })
    }

    const refreshToken = this.generateRefreshToken(user)
    await this.refreshTokensRepository.save(refreshToken)
    const accessToken = await this.generateAccessToken(user)

    return {
      accessToken,
      refreshToken,
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResult> {
    const savedRefreshToken = await this.refreshTokensRepository.findOne({
      where: {
        token: refreshToken,
      },
      relations: {
        user: true,
      },
    })

    if (
      !savedRefreshToken ||
      dayjs(savedRefreshToken.expiresAt).isBefore(dayjs())
    ) {
      throw new UnauthorizedException()
    }

    const newAccessToken = await this.generateAccessToken(
      savedRefreshToken.user,
    )

    let newRefreshToken: RefreshToken | undefined = undefined
    const refreshTokenDuration = Number(
      this.configService.getOrThrow('REFRESH_TOKEN_DURATION'),
    )
    const remainingDuration = dayjs(savedRefreshToken.expiresAt).diff(
      dayjs(),
      'seconds',
    )
    if (remainingDuration < refreshTokenDuration / 2) {
      newRefreshToken = this.generateRefreshToken(savedRefreshToken.user)
      await this.refreshTokensRepository.replaceRefreshToken(
        savedRefreshToken,
        newRefreshToken,
      )
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  private generateRefreshToken(user: User): RefreshToken {
    const refreshToken = this.refreshTokensRepository.create({
      token: crypto.randomBytes(64).toString('base64url'),
      expiresAt: dayjs()
        .add(this.configService.getOrThrow('REFRESH_TOKEN_DURATION'), 'seconds')
        .toISOString(),
      user,
    })
    return refreshToken
  }

  private async generateAccessToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      userId: user.id,
    }

    const accessToken = await this.jwtService.signAsync(payload)
    return accessToken
  }
}
