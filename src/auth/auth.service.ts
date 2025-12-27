import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Profile } from 'passport-google-oauth20'
import { Repository } from 'typeorm'
import crypto from 'crypto'
import { LoginResult } from './login-result.interface'
import { UsersService } from '../users/users.service'
import { RefreshToken } from './refresh-token.entity'
import { InjectRepository } from '@nestjs/typeorm'
import dayjs from 'dayjs'
import { User } from 'src/users/user.entity'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { JwtPayload } from './jwt-payload.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
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

    const refreshToken = await this.createRefreshToken(user)
    const accessToken = await this.generateAccessToken(user)

    return {
      accessToken,
      refreshToken,
    }
  }

  private async createRefreshToken(user: User): Promise<RefreshToken> {
    const refreshToken = this.refreshTokensRepository.create({
      token: crypto.randomBytes(64).toString('base64url'),
      expiresAt: dayjs()
        .add(this.configService.getOrThrow('REFRESH_TOKEN_DURATION'), 'seconds')
        .toISOString(),
      user,
    })
    await this.refreshTokensRepository.save(refreshToken)
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
