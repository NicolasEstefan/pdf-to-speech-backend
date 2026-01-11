import { InjectFlowProducer } from '@nestjs/bullmq'
import { Injectable, Logger } from '@nestjs/common'
import { FlowProducer } from 'bullmq'
import { StartGenerationDto } from './start-generation.dto'
import { rm, stat } from 'node:fs/promises'
import { PdfService } from './pdf/pdf.service'
import { User } from 'src/users/user.entity'
import { GenerationsRepository } from './generations.repository'
import { TextNormalizationJobData } from './text-normalization-job-data.interface'
import { pdfLanguageToTtsLanguage } from './language-converter'
import { GenerationJobData } from './generation-job-data.interface'
import { Generation } from './generation.entity'
import { GenerationStatus } from './generation-status.enum'
import { DownloadJobData } from './download-job-data.interface'

@Injectable()
export class GenerationsService {
  private readonly logger: Logger = new Logger(GenerationsService.name, {
    timestamp: true,
  })

  constructor(
    @InjectFlowProducer('generations-flow-producer')
    private readonly generationsFlowProducer: FlowProducer,
    private readonly pdfService: PdfService,
    private readonly generationsRepository: GenerationsRepository,
  ) {}

  async startGeneration(
    user: User,
    startGenerationDto: StartGenerationDto,
  ): Promise<Generation> {
    try {
      const pages = await this.pdfService.extractTextFromPages(
        startGenerationDto.pdfFilePath,
        startGenerationDto.language,
      )

      const generation = await this.generationsRepository.createGeneration(user)

      const ttsLanguage = pdfLanguageToTtsLanguage(startGenerationDto.language)

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
          language: ttsLanguage,
          text: page,
          pageNumber: index,
        }),
      )

      await this.generationsFlowProducer.add({
        name: 'download',
        queueName: 'download',
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
            name: `generate`,
            queueName: 'generation',
            opts: {
              attempts: 2,
            },
            data: generationJobData,
            children: textNormalizationJobsData.map((data) => ({
              name: 'normalize-text',
              queueName: 'text-normalization',
              opts: {
                attempts: 3,
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
