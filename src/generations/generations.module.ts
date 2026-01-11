import { Module } from '@nestjs/common'
import { PdfService } from './pdf/pdf.service'
import { ExternalServicesModule } from 'src/external-services/external-services.module'
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

@Module({
  imports: [
    ConfigModule,
    ExternalServicesModule,
    TypeOrmModule.forFeature([Generation, Audio]),
    BullModule.registerQueue(
      {
        name: 'generation',
      },
      {
        name: 'text-normalization',
      },
      {
        name: 'download',
      },
    ),
    BullModule.registerFlowProducer({
      name: 'generations-flow-producer',
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
