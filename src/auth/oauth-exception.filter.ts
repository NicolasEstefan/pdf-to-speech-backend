import { Catch, ExceptionFilter, UnauthorizedException } from '@nestjs/common'
import { TokenError } from 'passport-oauth2'

@Catch(TokenError)
export class OAuthExceptionFilter implements ExceptionFilter {
  catch() {
    throw new UnauthorizedException()
  }
}
