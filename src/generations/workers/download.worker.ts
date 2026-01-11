import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq'
import { Job } from 'bullmq'
import { Logger } from '@nestjs/common'
import { GenerationsService } from '../generations.service'
import { GcsService } from 'src/external-services/gcs/gcs.service'
import { DownloadJobData } from '../download-job-data.interface'
import path from 'node:path'
import { ConfigService } from '@nestjs/config'

@Processor('download', { concurrency: 100 })
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
    await this.gcsService.deleteFilesByPrefix(fileName)

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
    await this.generationsService.failGeneration(job.data.generationId)
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
