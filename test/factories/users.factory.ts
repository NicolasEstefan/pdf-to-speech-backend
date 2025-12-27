import { Factory } from 'fishery'
import { User } from '../../src/users/user.entity'
import { faker } from '@faker-js/faker'

export const usersFactory = Factory.define<User>(() => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  googleId: Math.random() < 0.5 ? faker.string.uuid() : null,
  username: faker.internet.username(),
  refreshTokens: [],
}))
