import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { App } from 'supertest/types'
import { AppModule } from '../../src/app.module'
import setCookieParser from 'set-cookie-parser'
import { usersFactory } from '../factories/users.factory'
import { AuthTestHelper } from './helpers/auth.helper'
import { RefreshToken } from '../../src/auth/refresh-token.entity'
import { User } from '../../src/users/user.entity'
import { setupApp } from '../../src/setup-app'
import { DataSource } from 'typeorm'
import { ConfigService } from '@nestjs/config'
import dayjs from 'dayjs'

describe('AuthController (e2e)', () => {
  const BASE_URL = '/auth'
  let app: INestApplication<App>
  let dataSource: DataSource
  let authHelper: AuthTestHelper
  let configService: ConfigService
  let user: User

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    setupApp(app)
    await app.init()

    dataSource = app.get(DataSource)
    configService = app.get(ConfigService)

    user = await dataSource.manager.save(User, usersFactory.build())

    authHelper = new AuthTestHelper(app)
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /refresh', () => {
    let refreshToken: RefreshToken

    beforeEach(async () => {
      refreshToken = await authHelper.generateRefreshToken(user)
    })

    it('should return a 401 status code if the refresh token is not provided', () => {
      return request(app.getHttpServer())
        .post(`${BASE_URL}/refresh`)
        .expect(401)
    })

    it('should return a new access token', async () => {
      const response = await request(app.getHttpServer())
        .post(`${BASE_URL}/refresh`)
        .set(
          'Cookie',
          authHelper.getCookieHeader({ refreshToken: refreshToken.token }),
        )
        .expect(200)

      const cookies = setCookieParser.parse(response.headers['set-cookie'])
      const accessTokenCookie = cookies.find(
        (cookie) => cookie.name === 'access_token',
      )
      expect(accessTokenCookie).toBeDefined()
      expect(accessTokenCookie?.expires).toBeUndefined()
    })

    describe('when refresh token is about to expire', () => {
      let refreshToken: RefreshToken

      beforeEach(async () => {
        refreshToken = await authHelper.generateRefreshToken(user)
        refreshToken.expiresAt = dayjs()
          .add(
            configService.getOrThrow('REFRESH_TOKEN_DURATION') / 4,
            'seconds',
          )
          .toDate()
        await dataSource.manager.save(RefreshToken, refreshToken)
      })

      it('should return new refresh and access tokens', async () => {
        const response = await request(app.getHttpServer())
          .post(`${BASE_URL}/refresh`)
          .set(
            'Cookie',
            authHelper.getCookieHeader({ refreshToken: refreshToken.token }),
          )
          .expect(200)

        const cookies = setCookieParser.parse(response.headers['set-cookie'])
        expect(
          cookies.find((cookie) => cookie.name === 'access_token'),
        ).toBeDefined()

        const refreshTokenCookie = cookies.find(
          (cookie) => cookie.name === 'refresh_token',
        )

        expect(refreshTokenCookie).toBeDefined()
        expect(dayjs(refreshTokenCookie?.expires).isAfter(dayjs())).toBeTruthy()
      })
    })
  })

  describe('POST /logout', () => {
    let refreshToken: RefreshToken
    let accessToken: string

    beforeEach(async () => {
      refreshToken = await authHelper.generateRefreshToken(user)
      accessToken = await authHelper.generateAccessToken(user)
    })

    it('should return a 401 if no accessToken is sent', async () => {
      return request(app.getHttpServer()).post(`${BASE_URL}/logout`).expect(401)
    })

    it('should clear access and refresh token cookies', async () => {
      const response = await request(app.getHttpServer())
        .post(`${BASE_URL}/logout`)
        .set(
          'Cookie',
          authHelper.getCookieHeader({
            accessToken,
            refreshToken: refreshToken.token,
          }),
        )

      const cookies = setCookieParser.parse(response.headers['set-cookie'])

      const accessTokenCookie = cookies.find(
        (cookie) => cookie.name === 'access_token',
      )
      const refreshTokenCookie = cookies.find(
        (cookie) => cookie.name === 'refresh_token',
      )

      expect(accessTokenCookie).toBeDefined()
      expect(dayjs(accessTokenCookie?.expires).isBefore(dayjs())).toBeTruthy()

      expect(refreshTokenCookie).toBeDefined()
      expect(dayjs(refreshTokenCookie?.expires).isBefore(dayjs())).toBeTruthy()
    })
  })
})
