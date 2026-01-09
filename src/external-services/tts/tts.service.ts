import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { GcsService } from '../gcs/gcs.service'
import { GoogleAuth } from 'google-auth-library'
import { AuthFailedException } from './exeptions/auth-failed.exception'
import { GoogleTtsRequest } from './google-tts-request.interface'
import { TtsParams } from './tts-params.interface'
import { GoogleTtsResponse } from './google-tts-response.interface'
import { FailedToInitializeException } from './exeptions/failet-to-initialize.exception'
import dayjs from 'dayjs'
import { GoogleTtsProgressResponse } from './google-tts-progress-response.interface'
import { TtsFailedException } from './exeptions/tts-failed.exception'
import { TimeoutException } from './exeptions/timeout.exception'
import path from 'node:path'

@Injectable()
export class TtsService {
  private readonly googleAuth: GoogleAuth

  constructor(
    private readonly configService: ConfigService,
    private readonly gcsService: GcsService,
  ) {
    this.googleAuth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
    })
  }

  async textToSpeech({
    text,
    id,
    language,
    speaker,
    reportProgressCallback,
  }: TtsParams): Promise<string> {
    const token = await this.getAccessToken()
    if (!token) {
      throw new AuthFailedException()
    }

    const fileName = `${id}.wav`
    const outputGcsUri = this.gcsService.getGcsUri(fileName)
    const requestBody: GoogleTtsRequest = {
      input: {
        text,
      },
      audioConfig: {
        audio_encoding: 'LINEAR16',
        speaking_rate: 1.0,
      },
      voice: {
        languageCode: language,
        name: `${language}-Chirp3-HD-${speaker}`,
      },
      outputGcsUri,
    }

    const response = await axios.post<GoogleTtsResponse>(
      this.configService.getOrThrow('GCLOUD_TTS_URL'),
      requestBody,
      {
        headers: this.getHeaders(token),
      },
    )

    if (response.data.error) {
      throw new FailedToInitializeException(response.data.error)
    }

    const startTime = dayjs()
    const maxWait = this.configService.getOrThrow<number>('TTS_MAX_WAIT')
    let progress = 0

    while (progress < 100 && dayjs().diff(startTime, 'seconds') < maxWait) {
      const progressCheckResponse = await axios.get<GoogleTtsProgressResponse>(
        this.configService.getOrThrow('GCLOUD_TTS_PROGRESS_CHECK_URL'),
        {
          headers: this.getHeaders(token),
        },
      )

      if (progressCheckResponse.data.error) {
        throw new TtsFailedException(progressCheckResponse.data.error)
      }

      progress = progressCheckResponse.data.metadata.progressPercentage
      if (reportProgressCallback) {
        reportProgressCallback(progress)
      }

      await new Promise((resolve) =>
        setTimeout(
          resolve,
          this.configService.getOrThrow('TTS_PROGRESS_REPORT_INTERVAL'),
        ),
      )
    }

    if (progress < 100) {
      throw new TimeoutException(dayjs().diff(startTime, 'seconds'))
    }

    const localFilePath = path.join(
      this.configService.getOrThrow('AUDIOS_PATH'),
      fileName,
    )
    await this.gcsService.downloadFile(fileName, localFilePath)

    return localFilePath
  }

  private async getAccessToken() {
    const client = await this.googleAuth.getClient()
    const result = await client.getAccessToken()
    return result.token
  }

  private getHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
      'x-goog-user-project':
        this.configService.getOrThrow<string>('GCLOUD_PROJECT_ID'),
    }
  }
}
