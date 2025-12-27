import { Factory } from 'fishery'
import { faker } from '@faker-js/faker'
import { Profile } from 'passport-google-oauth20'
import dayjs from 'dayjs'

export const profilesFactory = Factory.define<Profile>(() => ({
  id: faker.string.uuid(),
  displayName: faker.internet.username(),
  profileUrl: faker.internet.url(),
  emails: [{ value: faker.internet.email(), verified: Math.random() < 0.5 }],
  _json: {
    aud: faker.string.uuid(),
    exp: dayjs().add(5, 'hours').unix(),
    iat: dayjs().subtract(5, 'minutes').unix(),
    iss: 'https://accounts.google.com',
    sub: faker.string.uuid(),
  },
  _raw: faker.internet.jwt(),
  provider: 'google',
}))
