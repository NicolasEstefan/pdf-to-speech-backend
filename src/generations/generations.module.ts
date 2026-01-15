import { Module } from '@nestjs/common'
import { PdfService } from './pdf/pdf.service'
import { ExternalServicesModule } from '../external-services/external-services.module'
import { BullModule } from '@nestjs/bullmq'
import { GenerationsRepository } from './generations.repository'
import { GenerationsService } from './generations.service'
import { AudiosRepository } from './audios.repository'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Generation } from './entities/generation.entity'
import { Audio } from './entities/audio.entity'
import { GenerationWorker } from './workers/generation.worker'
import { TextNormalizationWorker } from './workers/text-normalization.worker'
import { DownloadWorker } from './workers/download.worker'
import { ConfigModule } from '@nestjs/config'
import {
  GENERATION_QUEUE,
  TEXT_NORMALIZATION_QUEUE,
  DOWNLOAD_QUEUE,
  GENERATIONS_FLOW_PRODUCER,
} from './generations.constants'
import { GenerationsController } from './generations.controller'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [
    AuthModule,
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
  controllers: [GenerationsController],
})
export class GenerationsModule {}
