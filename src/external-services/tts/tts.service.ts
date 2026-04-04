import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'
import { GcsService } from '../gcs/gcs.service'
import { GoogleAuth } from 'google-auth-library'
import { AuthFailedException } from './exeptions/auth-failed.exception'
import { GoogleTtsRequest } from './types/google-tts-request.interface'
import { TtsParams } from './types/tts-params.interface'
import { GoogleTtsResponse } from './types/google-tts-response.interface'
import { InitializationFailedException } from './exeptions/initialization-failed.exception'
import dayjs from 'dayjs'
import { GoogleTtsProgressResponse } from './types/google-tts-progress-response.interface'
import { TtsFailedException } from './exeptions/tts-failed.exception'
import { TimeoutException } from './exeptions/timeout.exception'

@Injectable()
export class TtsService {
  private readonly googleAuth: GoogleAuth
  private readonly logger: Logger = new Logger(TtsService.name)

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

    const audioFileName = `${id}.wav`
    const outputGcsUri = this.gcsService.getGcsUri(audioFileName)
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

    const startGenerationResponse = await axios.post<GoogleTtsResponse>(
      this.configService.getOrThrow('GCLOUD_TTS_URL'),
      requestBody,
      {
        headers: this.getHeaders(token),
      },
    )

    if (startGenerationResponse.data.error) {
      throw new InitializationFailedException(
        startGenerationResponse.data.error,
      )
    }

    const startTime = dayjs()
    const maxWait = this.configService.getOrThrow<number>('TTS_MAX_WAIT')
    const progressCheckUrl = `${this.configService.getOrThrow('GCLOUD_TTS_PROGRESS_CHECK_URL')}/${startGenerationResponse.data.name}`
    let progress = 0

    while (progress < 100 && dayjs().diff(startTime, 'seconds') < maxWait) {
      const progressCheckResponse = await axios.get<GoogleTtsProgressResponse>(
        progressCheckUrl,
        {
          headers: this.getHeaders(token),
        },
      )

      if (progressCheckResponse.data.error) {
        this.logger.error(JSON.stringify(progressCheckResponse.data))
        throw new TtsFailedException(progressCheckResponse.data.error)
      }

      const reportedProgress =
        progressCheckResponse.data.metadata.progressPercentage

      if (reportProgressCallback && reportedProgress) {
        progress = reportedProgress
        await reportProgressCallback(progress)
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

    return audioFileName
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
