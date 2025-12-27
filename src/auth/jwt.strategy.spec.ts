import { faker } from '@faker-js/faker'
import { ConfigService } from '@nestjs/config'
import { Test } from '@nestjs/testing'
import { User } from '../../src/users/user.entity'
import { UsersService } from '../../src/users/users.service'
import { usersFactory } from '../../test/factories/users.factory'
import {
  ConfigServiceMock,
  configServiceMock,
} from '../../test/mocks/config.service.mock'
import { JwtPayload } from './jwt-payload.interface'
import { JwtStrategy } from './jwt.strategy'
import { UnauthorizedException } from '@nestjs/common'

const usersServiceMock = () => ({
  findById: jest.fn(),
})

describe('JwtStrategy', () => {
  let usersService: ReturnType<typeof usersServiceMock>
  let mockUser: User
  let mockTokenPayload: JwtPayload
  let jwtStrategy: JwtStrategy
  let configService: ConfigServiceMock
  const mockAccessTokenSecret = faker.string.alphanumeric(16)

  beforeEach(async () => {
    configService = configServiceMock()
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'ACCESS_TOKEN_SECRET') {
        return mockAccessTokenSecret
      }
    })

    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useFactory: usersServiceMock,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile()

    usersService = module.get(UsersService)
    configService = module.get(ConfigService)
    mockUser = usersFactory.build()
    mockTokenPayload = {
      userId: mockUser.id,
    }

    jwtStrategy = module.get(JwtStrategy)
  })

  describe('validate', () => {
    it('should return existing user', async () => {
      usersService.findById.mockReturnValue(mockUser)
      const result = await jwtStrategy.validate(mockTokenPayload)

      expect(usersService.findById).toHaveBeenCalledTimes(1)
      expect(result).toEqual(mockUser)
    })

    it('should throw an error if user is not found', async () => {
      await expect(jwtStrategy.validate(mockTokenPayload)).rejects.toThrow(
        UnauthorizedException,
      )
    })
  })
})
