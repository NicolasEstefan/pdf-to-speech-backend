import { Module } from '@nestjs/common'
import { LlmService } from './llm/llm.service'
import { ConfigModule } from '@nestjs/config'

@Module({
  imports: [ConfigModule],
  providers: [LlmService],
})
export class ExternalServicesModule {}
