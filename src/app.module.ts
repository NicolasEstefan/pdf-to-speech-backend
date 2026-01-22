import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { configValidationSchema } from './config.schema'
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { GenerationsModule } from './generations/generations.module'
import { ExternalServicesModule } from './external-services/external-services.module'
import { BullModule } from '@nestjs/bullmq'

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV}`],
      validate: (config) => configValidationSchema.parse(config),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: 'localhost',
          port: configService.getOrThrow('REDIS_PORT'),
        },
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const isTestEnv = configService.getOrThrow('NODE_ENV') === 'test'

        const config: TypeOrmModuleOptions = {
          type: 'postgres',
          autoLoadEntities: true,
          synchronize: isTestEnv,
          dropSchema: isTestEnv,
          host: configService.getOrThrow('DB_HOST'),
          port: configService.getOrThrow('DB_PORT'),
          database: configService.getOrThrow('DB_DATABASE'),
          username: configService.getOrThrow('DB_USERNAME'),
          password: configService.getOrThrow('DB_PASSWORD'),
        }

        return config
      },
    }),
    AuthModule,
    UsersModule,
    GenerationsModule,
    ExternalServicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
