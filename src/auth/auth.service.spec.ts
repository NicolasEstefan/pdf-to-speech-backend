import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { configServiceMock } from '../../test/mocks/config.service.mock'
import type { ConfigServiceMock } from '../../test/mocks/config.service.mock'
import { RefreshToken } from './refresh-token.entity'
import {
  RepositoryMock,
  repositoryMock,
} from '../../test/mocks/repository.mock'
import { faker } from '@faker-js/faker'
import { usersFactory } from '../../test/factories/users.factory'
import { User } from '../../src/users/user.entity'
import { Profile } from 'passport-google-oauth20'
import { profilesFactory } from '../../test/factories/profiles.factory'
import { getRepositoryToken } from '@nestjs/typeorm'
import dayjs from 'dayjs'
import { refreshTokensFactory } from '../../test/factories/refresh-tokens.factory'
import { UnauthorizedException } from '@nestjs/common'

const usersServiceMock = () => ({
  findByGoogleId: jest.fn(),
  create: jest.fn(),
})

const jwtServiceMock = () => ({
  signAsync: jest.fn(),
})

const MOCK_REFRESH_TOKEN_DURATION = 604800 // one week in seconds

describe('AuthService', () => {
  let authService: AuthService
  let configService: ConfigServiceMock
  let usersService: ReturnType<typeof usersServiceMock>
  let jwtService: ReturnType<typeof jwtServiceMock>
  let refreshTokenRepository: RepositoryMock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useFactory: usersServiceMock,
        },
        {
          provide: JwtService,
          useFactory: jwtServiceMock,
        },
        {
          provide: ConfigService,
          useFactory: configServiceMock,
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useFactory: repositoryMock,
        },
      ],
    }).compile()

    configService = module.get(ConfigService)
    usersService = module.get(UsersService)
    jwtService = module.get(JwtService)
    refreshTokenRepository = module.get(getRepositoryToken(RefreshToken))

    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'REFRESH_TOKEN_DURATION') {
        return MOCK_REFRESH_TOKEN_DURATION
      }
    })

    authService = module.get<AuthService>(AuthService)
  })

  describe('signInWithGoogle', () => {
    let mockAccessToken: string
    let mockUser: User
    let mockProfile: Profile
    let mockRefreshToken: RefreshToken

    beforeEach(() => {
      mockAccessToken = faker.internet.jwt()
      mockUser = usersFactory.build()
      mockProfile = profilesFactory.build()
      mockRefreshToken = refreshTokensFactory.build({ user: mockUser })

      refreshTokenRepository.create.mockReturnValue(mockRefreshToken)
      jwtService.signAsync.mockResolvedValue(mockAccessToken)
    })

    describe('when the user already exists', () => {
      beforeEach(() => {
        usersService.findByGoogleId.mockResolvedValue(mockUser)
      })

      it('should not create a new user', async () => {
        await authService.signInWithGoogle(mockProfile)
        expect(usersService.create).not.toHaveBeenCalled()
      })

      it('should create and return both tokens', async () => {
        const result = await authService.signInWithGoogle(mockProfile)

        expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1)
        const refreshTokenCreationParams = refreshTokenRepository.create.mock
          .lastCall as RefreshToken[]

        expect(
          refreshTokenCreationParams[0].token.length,
        ).toBeGreaterThanOrEqual(32)
        expect(refreshTokenCreationParams[0].user).toEqual(mockUser)
        expect(
          dayjs(refreshTokenCreationParams[0].expiresAt).diff(
            dayjs().add(MOCK_REFRESH_TOKEN_DURATION, 'seconds'),
            'ms',
          ),
        ).toBeLessThan(1000)

        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)
        expect(refreshTokenRepository.save).toHaveBeenCalledWith(
          mockRefreshToken,
        )

        expect(result).toEqual({
          refreshToken: mockRefreshToken,
          accessToken: mockAccessToken,
        })
      })

      it("should throw UnauthorizedException if the profile has no emails and shouldn't create tokens", async () => {
        mockProfile.emails = []
        await expect(authService.signInWithGoogle(mockProfile)).rejects.toThrow(
          UnauthorizedException,
        )

        expect(refreshTokenRepository.create).not.toHaveBeenCalled()
        expect(refreshTokenRepository.save).not.toHaveBeenCalled()
      })
    })

    describe('when the user does not exist', () => {
      beforeEach(() => {
        usersService.findByGoogleId.mockResolvedValue(null)
        usersService.create.mockResolvedValue(mockUser)
      })

      it('should create a new user with correct parameters', async () => {
        await authService.signInWithGoogle(mockProfile)

        expect(usersService.create).toHaveBeenCalledTimes(1)
        expect(usersService.create).toHaveBeenCalledWith({
          email: mockProfile.emails![0].value,
          googleId: mockProfile.id,
          username: mockProfile.displayName,
        })
      })

      it('should create and return tokens', async () => {
        const result = await authService.signInWithGoogle(mockProfile)

        expect(refreshTokenRepository.create).toHaveBeenCalledTimes(1)
        const refreshTokenCreationParams = refreshTokenRepository.create.mock
          .lastCall as RefreshToken[]

        expect(
          refreshTokenCreationParams[0].token.length,
        ).toBeGreaterThanOrEqual(32)
        expect(refreshTokenCreationParams[0].user).toEqual(mockUser)
        expect(
          dayjs(refreshTokenCreationParams[0].expiresAt).diff(
            dayjs().add(MOCK_REFRESH_TOKEN_DURATION, 'seconds'),
            'ms',
          ),
        ).toBeLessThan(1000)

        expect(refreshTokenRepository.save).toHaveBeenCalledTimes(1)
        expect(refreshTokenRepository.save).toHaveBeenCalledWith(
          mockRefreshToken,
        )

        expect(result).toEqual({
          refreshToken: mockRefreshToken,
          accessToken: mockAccessToken,
        })
      })

      it("should throw UnauthorizedException if the profile has no emails and shouldn't create user nor tokens", async () => {
        mockProfile.emails = []
        await expect(authService.signInWithGoogle(mockProfile)).rejects.toThrow(
          UnauthorizedException,
        )

        expect(refreshTokenRepository.create).not.toHaveBeenCalled()
        expect(refreshTokenRepository.save).not.toHaveBeenCalled()
        expect(usersService.create).not.toHaveBeenCalled()
      })
    })
  })
})
