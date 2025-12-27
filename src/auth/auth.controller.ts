import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request, Response } from 'express'
import { AuthService } from './auth.service'
import { Profile } from 'passport-google-oauth20'
import { ConfigService } from '@nestjs/config'
import { OAuthExceptionFilter } from './oauth-exception.filter'
import dayjs from 'dayjs'

@Controller('auth')
@UseFilters(OAuthExceptionFilter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  googleSignIn() {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const { accessToken, refreshToken } =
      await this.authService.signInWithGoogle(req.user as Profile)

    res.cookie('refresh_token', refreshToken.token, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      expires: dayjs(refreshToken.expiresAt).toDate(),
    })

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
    })

    res.redirect(this.configService.getOrThrow('FRONTEND_URL'))
  }
}
