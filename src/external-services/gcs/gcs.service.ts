import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Storage } from '@google-cloud/storage'

@Injectable()
export class GcsService {
  private readonly storage: Storage

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
  }
}
