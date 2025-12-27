import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { RefreshToken } from '../../src/auth/refresh-token.entity'
import dayjs from 'dayjs'
import { usersFactory } from './users.factory'

export const refreshTokensFactory = Factory.define<RefreshToken>(() => ({
  expiresAt: dayjs().add(7, 'days').toISOString(),
  token: faker.string.alpha(64),
  user: usersFactory.build(),
}))
