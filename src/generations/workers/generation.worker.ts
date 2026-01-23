import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { TtsService } from '../../external-services/tts/tts.service'
import { GenerationJobData } from '../types/generation-job-data.interface'
import { Logger } from '@nestjs/common'
import { TextNormalizationJobResult } from '../types/text-normalization-job-result.interface'
import { GENERATION_QUEUE } from '../generations.constants'
import { GenerationsService } from '../generations.service'

@Processor(GENERATION_QUEUE, { concurrency: 100 })
export class GenerationWorker extends WorkerHost {
  private readonly logger: Logger = new Logger(GenerationWorker.name, {
    timestamp: true,
  })

  constructor(
    private readonly ttsService: TtsService,
    private readonly generationsService: GenerationsService,
  ) {
    super()
  }

  async process(job: Job<GenerationJobData, void>) {
    const { generationId, speaker, language } = job.data

    try {
      await this.generationsService.reportGenerationProgress(generationId, 33.3)

      const childrenResults =
        await job.getChildrenValues<TextNormalizationJobResult>()

      const pages = Object.values(childrenResults)
      pages.sort((a, b) => a.pageNumber - b.pageNumber)
      const text = pages.map((page) => page.text).join('')
      let ttsProgress = 0

      const audioFileName = await this.ttsService.textToSpeech({
        text,
        id: generationId,
        language: language,
        speaker: speaker,
        reportProgressCallback: async (progress) => {
          if (progress === ttsProgress) {
            return
          }

          ttsProgress = progress

          this.logger.verbose(
            `TTS at ${ttsProgress}% for generation ${generationId}`,
          )
          await this.generationsService.reportGenerationProgress(
            generationId,
            33.3 + ttsProgress / 3,
          )
        },
      })
      return audioFileName
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<GenerationJobData, string>) {
    this.logger.verbose(
      `Started working on generation ${job.data.generationId}`,
    )
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<GenerationJobData, string>) {
    this.logger.error(
      `Error while working on generation ${job.data.generationId}`,
      job.failedReason,
    )
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<GenerationJobData, string>) {
    this.logger.verbose(
      `Completed processing of generation ${job.data.generationId}`,
    )
  }
}
