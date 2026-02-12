import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { LlmService } from '../../external-services/llm/llm.service'
import { TextNormalizationJobData } from '../types/text-normalization-job-data.interface'
import { Logger } from '@nestjs/common'
import { TextNormalizationJobResult } from '../types/text-normalization-job-result.interface'
import { TEXT_NORMALIZATION_QUEUE } from '../generations.constants'

@Processor(TEXT_NORMALIZATION_QUEUE, { concurrency: 30 })
export class TextNormalizationWorker extends WorkerHost {
  private readonly logger: Logger = new Logger(TextNormalizationWorker.name, {
    timestamp: true,
  })

  constructor(private readonly llmService: LlmService) {
    super()
  }

  async process(
    job: Job<TextNormalizationJobData, TextNormalizationJobResult>,
  ): Promise<TextNormalizationJobResult> {
    try {
      const result = await this.llmService.normalizeTextForTTS(
        job.data.text,
        job.data.language,
      )
      return { text: result, pageNumber: job.data.pageNumber }
    } catch (error) {
      this.logger.error(error)
      throw error
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job<TextNormalizationJobData, TextNormalizationJobResult>) {
    this.logger.verbose(
      `Started working on page ${job.data.pageNumber} for generation ${job.data.generationId}`,
    )
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<TextNormalizationJobData, TextNormalizationJobResult>) {
    this.logger.error(
      `Error while procesing page ${job.data.pageNumber} for generation ${job.data.generationId}`,
      job.failedReason,
    )
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<TextNormalizationJobData, TextNormalizationJobResult>) {
    this.logger.verbose(
      `Completed processing of page ${job.data.pageNumber} for generation ${job.data.generationId}`,
    )
  }
}
