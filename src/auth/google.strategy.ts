import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { Profile, Strategy } from 'passport-google-oauth20'

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow('GOOGLE_OAUTH_CLIENT_ID'),
      clientSecret: configService.getOrThrow('GOOGLE_OAUTH_CLIENT_SECRET'),
      callbackURL: `${configService.getOrThrow('SERVER_URL')}/auth/google/callback`,
      scope: ['profile', 'email'],
    })
  }

  validate(accessToken: string, refreshToken: string, profile: Profile) {
    return profile
  }
}
