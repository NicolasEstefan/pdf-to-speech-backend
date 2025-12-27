import { RefreshToken } from './refresh-token.entity'

export interface LoginResult {
  accessToken: string
  refreshToken: RefreshToken
}
