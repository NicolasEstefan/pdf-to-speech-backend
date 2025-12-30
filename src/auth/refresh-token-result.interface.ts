import { RefreshToken } from './refresh-token.entity'

export interface RefreshTokenResult {
  accessToken: string
  refreshToken?: RefreshToken
}
