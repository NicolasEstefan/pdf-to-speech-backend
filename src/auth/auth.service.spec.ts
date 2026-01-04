import { Test, TestingModule } from '@nestjs/testing'
import { AuthService } from './auth.service'
import { UsersService } from '../users/users.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { configServiceMock } from '../../test/mocks/config.service.mock'
import type { ConfigServiceMock } from '../../test/mocks/config.service.mock'
import { RefreshToken } from './refresh-token.entity'
import { repositoryMock } from '../../test/mocks/repository.mock'
import { faker } from '@faker-js/faker'
import { usersFactory } from '../../test/factories/users.factory'
import { User } from '../../src/users/user.entity'
import { Profile } from 'passport-google-oauth20'
import { profilesFactory } from '../../test/factories/profiles.factory'
import dayjs from 'dayjs'
import { refreshTokensFactory } from '../../test/factories/refresh-tokens.factory'
import { UnauthorizedException } from '@nestjs/common'
import { FindOneOptions } from 'typeorm'
import { RefreshTokensRepository } from './refresh-tokens.repository'

const usersServiceMock = () => ({
  findByGoogleId: jest.fn(),
  create: jest.fn(),
})

const jwtServiceMock = () => ({
  signAsync: jest.fn(),
})

const refreshTokensRepositoryMock = () => ({
  ...repositoryMock(),
  replaceRefreshToken: jest.fn(),
})

const MOCK_REFRESH_TOKEN_DURATION = 604800 // one week in seconds

describe('AuthService', () => {
  let authService: AuthService
  let configService: ConfigServiceMock
  let usersService: ReturnType<typeof usersServiceMock>
  let jwtService: ReturnType<typeof jwtServiceMock>
  let refreshTokensRepository: ReturnType<typeof refreshTokensRepositoryMock>

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
          provide: RefreshTokensRepository,
          useFactory: refreshTokensRepositoryMock,
        },
      ],
    }).compile()

    configService = module.get(ConfigService)
    usersService = module.get(UsersService)
    jwtService = module.get(JwtService)
    refreshTokensRepository = module.get(RefreshTokensRepository)

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

      refreshTokensRepository.create.mockReturnValue(mockRefreshToken)
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

        expect(refreshTokensRepository.create).toHaveBeenCalledTimes(1)
        const refreshTokenCreationParams = refreshTokensRepository.create.mock
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

        expect(refreshTokensRepository.save).toHaveBeenCalledTimes(1)
        expect(refreshTokensRepository.save).toHaveBeenCalledWith(
          mockRefreshToken,
        )

        expect(jwtService.signAsync).toHaveBeenCalledTimes(1)
        expect(jwtService.signAsync).toHaveBeenCalledWith({
          userId: mockUser.id,
        })

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

        expect(refreshTokensRepository.create).not.toHaveBeenCalled()
        expect(refreshTokensRepository.save).not.toHaveBeenCalled()
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

        expect(refreshTokensRepository.create).toHaveBeenCalledTimes(1)
        const refreshTokenCreationParams = refreshTokensRepository.create.mock
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

        expect(refreshTokensRepository.save).toHaveBeenCalledTimes(1)
        expect(refreshTokensRepository.save).toHaveBeenCalledWith(
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

        expect(refreshTokensRepository.create).not.toHaveBeenCalled()
        expect(refreshTokensRepository.save).not.toHaveBeenCalled()
        expect(usersService.create).not.toHaveBeenCalled()
      })
    })
  })

  describe('refreshTokens', () => {
    let mockUser: User
    let mockRefreshToken: RefreshToken
    let mockAccessToken: string

    beforeEach(() => {
      mockUser = usersFactory.build()
      mockRefreshToken = refreshTokensFactory.build({
        user: mockUser,
        expiresAt: dayjs()
          .add(MOCK_REFRESH_TOKEN_DURATION, 'seconds')
          .toISOString(),
      })
      mockAccessToken = faker.internet.jwt()
      refreshTokensRepository.findOne.mockReturnValue(mockRefreshToken)
      jwtService.signAsync.mockReturnValue(mockAccessToken)
    })

    it('should generate and return an access token for the user correctly', async () => {
      const result = await authService.refreshToken(mockRefreshToken.token)
      expect(result.accessToken).toEqual(mockAccessToken)
      expect(jwtService.signAsync).toHaveBeenCalledTimes(1)
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        userId: mockUser.id,
      })
    })

    it('should not create a new refresh token for the user', async () => {
      await authService.refreshToken(mockRefreshToken.token)
      expect(refreshTokensRepository.create).not.toHaveBeenCalled()
      expect(refreshTokensRepository.save).not.toHaveBeenCalled()
    })

    it('should call refreshTokenRepository.findOne with the correct parameters', async () => {
      await authService.refreshToken(mockRefreshToken.token)
      expect(refreshTokensRepository.findOne).toHaveBeenCalledTimes(1)
      const findOneParams = refreshTokensRepository.findOne.mock
        .lastCall as FindOneOptions<RefreshToken>[]
      expect(findOneParams[0]).toEqual({
        where: {
          token: mockRefreshToken.token,
        },
        relations: {
          user: true,
        },
      })
    })

    describe('when refresh token is not found', () => {
      beforeEach(() => {
        refreshTokensRepository.findOne.mockReturnValue(null)
      })

      it('should throw UnauthorizedException', async () => {
        await expect(
          authService.refreshToken('some random string'),
        ).rejects.toThrow(UnauthorizedException)
      })

      it('should not create a new refresh token for the user', async () => {
        try {
          await authService.refreshToken(mockRefreshToken.token)
          fail()
        } catch {
          expect(refreshTokensRepository.create).not.toHaveBeenCalled()
          expect(refreshTokensRepository.save).not.toHaveBeenCalled()
        }
      })
    })

    describe('when refresh token is expired', () => {
      beforeEach(() => {
        mockRefreshToken.expiresAt = dayjs().subtract(1, 'day').toISOString()
      })

      it('should throw UnauthorizedException', async () => {
        await expect(
          authService.refreshToken(mockRefreshToken.token),
        ).rejects.toThrow(UnauthorizedException)
      })

      it('should not create a new refresh token for the user', async () => {
        try {
          await authService.refreshToken(mockRefreshToken.token)
          fail()
        } catch {
          expect(refreshTokensRepository.create).not.toHaveBeenCalled()
          expect(refreshTokensRepository.save).not.toHaveBeenCalled()
        }
      })
    })

    describe('when refresh token is about to expire', () => {
      let mockNewRefreshToken: RefreshToken

      beforeEach(() => {
        mockRefreshToken.expiresAt = dayjs()
          .add(MOCK_REFRESH_TOKEN_DURATION / 2 - 1, 'seconds')
          .toISOString()
        mockNewRefreshToken = refreshTokensFactory.build({
          user: mockUser,
          expiresAt: dayjs()
            .add(MOCK_REFRESH_TOKEN_DURATION, 'seconds')
            .toISOString(),
        })
        refreshTokensRepository.create.mockReturnValue(mockNewRefreshToken)
      })

      it('should create a new refresh token for the user and replace the old one', async () => {
        const result = await authService.refreshToken(mockRefreshToken.token)
        expect(result.refreshToken).toEqual(mockNewRefreshToken)
        expect(refreshTokensRepository.create).toHaveBeenCalledTimes(1)
        const refreshTokenCreationParams = refreshTokensRepository.create.mock
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

        expect(
          refreshTokensRepository.replaceRefreshToken,
        ).toHaveBeenCalledTimes(1)
        expect(
          refreshTokensRepository.replaceRefreshToken,
        ).toHaveBeenCalledWith(mockRefreshToken, mockNewRefreshToken)
      })
    })
  })

  describe('deleteRefreshToken', () => {
    let refreshToken: RefreshToken

    beforeEach(() => {
      refreshToken = refreshTokensFactory.build()
    })

    it('should delete the refresh token', async () => {
      await authService.deleteRefreshToken(refreshToken.token)

      expect(refreshTokensRepository.delete).toHaveBeenCalledTimes(1)
      expect(refreshTokensRepository.delete).toHaveBeenCalledWith({
        token: refreshToken.token,
      })
    })
  })
})
