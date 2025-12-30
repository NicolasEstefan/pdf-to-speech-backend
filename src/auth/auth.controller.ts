import {
  Controller,
  Get,
  Req,
  Res,
  UseGuards,
  UseFilters,
  UnauthorizedException,
  HttpStatus,
  HttpCode,
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

    this.setCookie(
      res,
      'refresh_token',
      refreshToken.token,
      refreshToken.expiresAt,
    )

    this.setCookie(res, 'access_token', accessToken)

    res.redirect(this.configService.getOrThrow('FRONTEND_URL'))
  }

  @Get('/refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!req.cookies || !req.cookies.refresh_token) {
      throw new UnauthorizedException()
    }

    const refreshResult = await this.authService.refreshToken(
      req.cookies.refres_token as string,
    )

    this.setCookie(res, 'access_token', refreshResult.accessToken)

    if (refreshResult.refreshToken) {
      this.setCookie(
        res,
        'refresh_token',
        refreshResult.refreshToken.token,
        refreshResult.refreshToken.expiresAt,
      )
    }
  }

  private setCookie(
    res: Response,
    key: string,
    payload: string,
    expiresAt?: string,
  ) {
    res.cookie(key, payload, {
      httpOnly: true,
      secure: this.configService.getOrThrow('NODE_ENV') === 'production',
      expires: expiresAt ? dayjs(expiresAt).toDate() : undefined,
    })
  }
}
