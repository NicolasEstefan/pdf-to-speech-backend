import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Storage } from '@google-cloud/storage'

@Injectable()
export class GcsService {
  private readonly storage: Storage
  private readonly logger: Logger = new Logger('GcsService', {
    timestamp: true,
  })

  constructor(private readonly configService: ConfigService) {
    this.storage = new Storage()
  }

  getGcsUri(fileName: string): string {
    return `gs://${this.configService.getOrThrow('GCS_BUCKET_NAME')}/${fileName}`
  }

  async downloadFile(fileName: string, outputPath: string) {
    await this.storage
      .bucket(this.configService.getOrThrow('GCS_BUCKET_NAME'))
      .file(fileName)
      .download({
        destination: outputPath,
      })

    this.storage
      .bucket(this.configService.getOrThrow('GCS_BUCKET_NAME'))
      .file(fileName)
      .delete()
      .catch(() => {
        this.logger.error(
          `An error was thrown while trying to delete file ${fileName}`,
        )
      })
  }
}
