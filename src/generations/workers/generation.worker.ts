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
    await this.generationsService.reportGenerationProgress(
      job.data.generationId,
      33.3,
    )

    const childrenResults =
      await job.getChildrenValues<TextNormalizationJobResult>()

    const pages = Object.values(childrenResults)
    pages.sort((a, b) => a.pageNumber - b.pageNumber)
    const text = pages.map((page) => page.text).join('')

    const audioFileName = await this.ttsService.textToSpeech({
      text,
      id: job.data.generationId,
      language: job.data.language,
      speaker: job.data.speaker,
      reportProgressCallback: this.ttsProgressReportCallback.bind(
        this,
        job.data.generationId,
      ) as (progress: number) => void,
    })
    return audioFileName
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

  private async ttsProgressReportCallback(
    generationId: string,
    progress: number,
  ) {
    this.logger.verbose(`TTS at ${progress}% for generation ${generationId}`)
    await this.generationsService.reportGenerationProgress(
      generationId,
      33.3 + progress / 3,
    )
  }
}
