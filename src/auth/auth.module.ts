import { Module } from '@nestjs/common'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { PassportModule } from '@nestjs/passport'
import { JwtModule } from '@nestjs/jwt'
import { GoogleStrategy } from './google.strategy'
import { RefreshToken } from './refresh-token.entity'
import { UsersModule } from 'src/users/users.module'
import { JwtStrategy } from './jwt.strategy'
import { RefreshTokensRepository } from './refresh-tokens.repository'

@Module({
  imports: [
    UsersModule,
    ConfigModule,
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.getOrThrow('ACCESS_TOKEN_SECRET'),
          signOptions: {
            expiresIn: Number(
              configService.getOrThrow('ACCESS_TOKEN_DURATION'),
            ),
          },
        }
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    JwtStrategy,
    RefreshTokensRepository,
  ],
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
