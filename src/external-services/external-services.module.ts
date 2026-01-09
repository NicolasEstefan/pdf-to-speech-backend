import { Module } from '@nestjs/common'
import { LlmService } from './llm/llm.service'
import { ConfigModule } from '@nestjs/config'
import { GcsService } from './gcs/gcs.service'
import { TtsService } from './tts/tts.service'

@Module({
  imports: [ConfigModule],
  providers: [LlmService, GcsService, TtsService],
})
export class ExternalServicesModule {}
