import { Controller, Get, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import type { Request } from 'express'
import { AuthService } from './auth.service'
import { Profile } from 'passport-google-oauth20'

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/google')
  @UseGuards(AuthGuard('google'))
  googleSignIn() {}

  @Get('/google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: Request) {
    await this.authService.signInWithGoogle(req.user as Profile)
  }
}
