import { InjectFlowProducer } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { FlowProducer } from 'bullmq'
import { StartGenerationParams } from './types/start-generation-params.interface'
import { rm, stat } from 'node:fs/promises'
import { PdfService } from './pdf/pdf.service'
import { User } from '../users/user.entity'
import { GenerationsRepository } from './generations.repository'
import { TextNormalizationJobData } from './types/text-normalization-job-data.interface'
import { GenerationJobData } from './types/generation-job-data.interface'
import { Generation } from './entities/generation.entity'
import { GenerationStatus } from './types/generation-status.enum'
import { DownloadJobData } from './types/download-job-data.interface'
import {
  DOWNLOAD_QUEUE,
  DOWNLOAD_STEP,
  GENERATE_STEP,
  GENERATION_QUEUE,
  GENERATIONS_FLOW_PRODUCER,
  NORMALIZE_TEXT_STEP,
  TEXT_NORMALIZATION_QUEUE,
} from './generations.constants'
import { getPdfLanguage, getTtsLanguage } from './language-converter'

@Injectable()
export class GenerationsService {
  private readonly logger: Logger = new Logger(GenerationsService.name, {
    timestamp: true,
  })

  constructor(
    @InjectFlowProducer(GENERATIONS_FLOW_PRODUCER)
    private readonly generationsFlowProducer: FlowProducer,
    private readonly pdfService: PdfService,
    private readonly generationsRepository: GenerationsRepository,
  ) {}

  async startGeneration(
    user: User,
    startGenerationDto: StartGenerationParams,
  ): Promise<Generation> {
    try {
      const pages = await this.pdfService.extractTextFromPages(
        startGenerationDto.pdfFilePath,
        getPdfLanguage(startGenerationDto.language),
      )

      const generation = await this.generationsRepository.createGeneration(user)

      const ttsLanguage = getTtsLanguage(startGenerationDto.language)

      const downloadJobData: DownloadJobData = {
        generationId: generation.id,
      }

      const generationJobData: GenerationJobData = {
        generationId: generation.id,
        language: ttsLanguage,
        speaker: startGenerationDto.speaker,
      }

      const textNormalizationJobsData: TextNormalizationJobData[] = pages.map(
        (page, index) => ({
          generationId: generation.id,
          language: startGenerationDto.language,
          text: page,
          pageNumber: index,
        }),
      )

      await this.generationsFlowProducer.add({
        name: DOWNLOAD_STEP,
        queueName: DOWNLOAD_QUEUE,
        opts: {
          attempts: 7,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
        data: downloadJobData,
        children: [
          {
            name: GENERATE_STEP,
            queueName: GENERATION_QUEUE,
            opts: {
              attempts: 2,
              failParentOnFailure: true,
            },
            data: generationJobData,
            children: textNormalizationJobsData.map((data) => ({
              name: NORMALIZE_TEXT_STEP,
              queueName: TEXT_NORMALIZATION_QUEUE,
              opts: {
                attempts: 3,
                failParentOnFailure: true,
              },
              data,
            })),
          },
        ],
      })

      return generation
    } catch (error) {
      this.logger.error(error)
      throw error
    } finally {
      await rm(startGenerationDto.pdfFilePath)
    }
  }

  async finishGeneration(generationId: string, audioFilePath: string) {
    const stats = await stat(audioFilePath)
    await this.generationsRepository.finishGeneration(
      generationId,
      audioFilePath,
      stats.size,
    )
  }

  async failGeneration(generationId: string) {
    await this.generationsRepository.update(
      {
        id: generationId,
      },
      {
        status: GenerationStatus.FAILED,
      },
    )
  }
}
