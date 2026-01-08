import { Module } from '@nestjs/common'
import { LlmService } from './llm/llm.service'
import { ConfigModule } from '@nestjs/config'
import { GcsService } from './gcs/gcs.service'

@Module({
  imports: [ConfigModule],
  providers: [LlmService, GcsService],
})
export class ExternalServicesModule {}
