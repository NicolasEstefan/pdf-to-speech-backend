import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Profile } from 'passport-google-oauth20'
import { DataSource, Repository } from 'typeorm'
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
import { RefreshTokenResult } from './refresh-token-result.interface'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
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
      await this.dataSource.transaction(async (manager) => {
        const tsxRefreshTokenRepository = manager.getRepository(RefreshToken)
        newRefreshToken = await this.createRefreshToken(
          savedRefreshToken.user,
          tsxRefreshTokenRepository,
        )
        await tsxRefreshTokenRepository.delete(savedRefreshToken)
      })
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  private async createRefreshToken(
    user: User,
    tsxRefreshTokensRepository?: Repository<RefreshToken>,
  ): Promise<RefreshToken> {
    const refreshTokensRepository =
      tsxRefreshTokensRepository || this.refreshTokensRepository

    const refreshToken = refreshTokensRepository.create({
      token: crypto.randomBytes(64).toString('base64url'),
      expiresAt: dayjs()
        .add(this.configService.getOrThrow('REFRESH_TOKEN_DURATION'), 'seconds')
        .toISOString(),
      user,
    })
    await refreshTokensRepository.save(refreshToken)
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
