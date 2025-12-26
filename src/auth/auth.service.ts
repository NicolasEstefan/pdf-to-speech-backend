import { Injectable, UnauthorizedException } from '@nestjs/common'
import { Profile } from 'passport-google-oauth20'
import { Repository } from 'typeorm'
import crypto from 'crypto'
import { LoginResult } from './login-result.interface'
import { UsersService } from 'src/users/users.service'
import { RefreshToken } from './refresh-token.entity'
import { InjectRepository } from '@nestjs/typeorm'

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
  ) {}

  async signInWithGoogle(profile: Profile): Promise<LoginResult> {
    if (!profile.emails || profile.emails.length < 1) {
      throw new UnauthorizedException()
    }

    let user = await this.usersService.findByGoogleId(profile.id)

    if (!user) {
      user = await this.usersService.create({
        email: profile.emails[0].value,
        googleId: profile.id,
      })
    }

    const refreshTokenString = this.generateRefreshToken()
    const refreshToken = this.refreshTokensRepository.create({
      token: refreshTokenString,
      user,
    })
    await this.refreshTokensRepository.save(refreshToken)

    return {
      accessToken: 'test',
      refreshToken: 'test',
    }
  }

  private generateRefreshToken() {
    const token = crypto.randomBytes(64).toString()
    return token
  }
}
