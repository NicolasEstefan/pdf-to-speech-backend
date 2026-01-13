import { Module } from '@nestjs/common'
import { PdfService } from './pdf/pdf.service'
import { ExternalServicesModule } from '../external-services/external-services.module'
import { BullModule } from '@nestjs/bullmq'
import { GenerationsRepository } from './generations.repository'
import { GenerationsService } from './generations.service'
import { AudiosRepository } from './audios.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Generation } from './generation.entity'
import { Audio } from './audio.entity'
import { GenerationWorker } from './workers/generation.worker'
import { TextNormalizationWorker } from './workers/text-normalization.worker'
import { DownloadWorker } from './workers/download.worker'
import { ConfigModule } from '@nestjs/config'

export const GENERATION_QUEUE = 'generation'
export const TEXT_NORMALIZATION_QUEUE = 'text-normalization'
export const DOWNLOAD_QUEUE = 'download'

export const GENERATE_STEP = 'generate'
export const NORMALIZE_TEXT_STEP = 'normalize-text'
export const DOWNLOAD_STEP = 'download'

export const GENERATIONS_FLOW_PRODUCER = 'generations-flow-producer'

@Module({
  imports: [
    ConfigModule,
    ExternalServicesModule,
    TypeOrmModule.forFeature([Generation, Audio]),
    BullModule.registerQueue(
      {
        name: GENERATION_QUEUE,
      },
      {
        name: TEXT_NORMALIZATION_QUEUE,
      },
      {
        name: DOWNLOAD_QUEUE,
      },
    ),
    BullModule.registerFlowProducer({
      name: GENERATIONS_FLOW_PRODUCER,
    }),
  ],
  providers: [
    PdfService,
    GenerationsRepository,
    AudiosRepository,
    GenerationsService,
    GenerationWorker,
    TextNormalizationWorker,
    DownloadWorker,
  ],
})
export class GenerationsModule {}
