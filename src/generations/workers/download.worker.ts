import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { GenerationsService } from '../generations.service'
import { GcsService } from '../../external-services/gcs/gcs.service'
import { DownloadJobData } from '../types/download-job-data.interface'
import path from 'node:path'
import { ConfigService } from '@nestjs/config'
import { DOWNLOAD_QUEUE } from '../generations.constants'

@Processor(DOWNLOAD_QUEUE, { concurrency: 100 })
export class DownloadWorker extends WorkerHost {
  private readonly logger: Logger = new Logger(DownloadWorker.name, {
    timestamp: true,
  })

  constructor(
    private readonly configService: ConfigService,
    private readonly gcsService: GcsService,
    private readonly generationsService: GenerationsService,
  ) {
    super()
  }

  async process(job: Job<DownloadJobData, string>) {
    const childrenValues = await job.getChildrenValues<string>()
    const fileName = Object.values(childrenValues)[0]

    const localFilePath = path.join(
      this.configService.getOrThrow('AUDIOS_PATH'),
      fileName,
    )
    await this.gcsService.downloadFile(fileName, localFilePath)
    await this.gcsService.deleteFilesByPrefix(job.data.generationId)

    return localFilePath
  }

  @OnWorkerEvent('active')
  onActive(job: Job<DownloadJobData, string>) {
    this.logger.verbose(
      `Started working on audio download for generation ${job.data.generationId}`,
    )
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<DownloadJobData, string>) {
    this.logger.error(
      `Error while working on audio download for generation ${job.data.generationId}`,
      job.failedReason,
    )
    if (
      job.attemptsMade >= (job.opts.attempts ?? 1) ||
      job.failedReason.match(/^child.+failed$/)
    ) {
      await this.generationsService.failGeneration(job.data.generationId)
      await this.gcsService.deleteFilesByPrefix(job.data.generationId)
    }
  }

  @OnWorkerEvent('completed')
  async onCompleted(job: Job<DownloadJobData, string>) {
    this.logger.verbose(
      `Finished working on audio download for generation ${job.data.generationId}`,
    )
    await this.generationsService.finishGeneration(
      job.data.generationId,
      job.returnvalue,
    )
  }
}
