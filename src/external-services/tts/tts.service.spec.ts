import { Test, TestingModule } from '@nestjs/testing'
import { TtsService } from './tts.service'
import {
  configServiceMock,
  ConfigServiceMock,
} from '../../../test/mocks/config.service.mock'
import { ConfigService } from '@nestjs/config'
import { GcsService } from '../gcs/gcs.service'
import { faker } from '@faker-js/faker'
import { Language } from './language.enum'
import { Speaker } from './speaker.enum'
import axios from 'axios'
import path from 'node:path'
import { AuthFailedException } from './exeptions/auth-failed.exception'
import { TimeoutException } from './exeptions/timeout.exception'
import { TtsFailedException } from './exeptions/tts-failed.exception'

jest.mock('axios')

const gcsServiceMock = () => ({
  getGcsUri: jest.fn(),
  downloadFile: jest.fn(),
})

const getAccessTokenMock = jest.fn()

jest.mock('google-auth-library', () => ({
  GoogleAuth: jest.fn().mockImplementation(() => ({
    getClient: jest.fn().mockResolvedValue({
      getAccessToken: getAccessTokenMock,
    }),
  })),
}))

describe('TtsService', () => {
  const MOCK_TTS_URL = 'example.com'
  const MOCK_PROGRESS_CHECK_URL = 'example.com/progress'
  const MOCK_GCS_URI = 'gs://example.com'
  const MOCK_AUDIOS_PATH = './files/audios'
  const MOCK_TTS_PROGRESS_REPORT_INTERVAL = 5
  const MOCK_GCLOUD_PROJECT_ID = 'pdf-to-speech'
  const MOCK_TTS_MAX_WAIT = 0.5

  const MOCK_GOOGLE_ACCESS_TOKEN = faker.internet.jwt()

  const MOCK_TEXT = 'This is a test'
  const MOCK_ID = faker.string.uuid()
  const MOCK_LANGUAGE: Language = Language.EN_US
  const MOCK_SPEAKER: Speaker = Speaker.ACHERNAR

  let reportProgressCallback: jest.Mock
  const mockedAxios = axios as jest.Mocked<typeof axios>

  let ttsService: TtsService
  let configService: ConfigServiceMock
  let gcsService: ReturnType<typeof gcsServiceMock>

  beforeEach(async () => {
    jest.clearAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TtsService,
        {
          provide: ConfigService,
          useFactory: configServiceMock,
        },
        {
          provide: GcsService,
          useFactory: gcsServiceMock,
        },
      ],
    }).compile()

    configService = module.get(ConfigService)
    configService.getOrThrow.mockImplementation((key: string) => {
      switch (key) {
        case 'GCLOUD_TTS_URL':
          return MOCK_TTS_URL
        case 'TTS_MAX_WAIT':
          return MOCK_TTS_MAX_WAIT
        case 'GCLOUD_TTS_PROGRESS_CHECK_URL':
          return MOCK_PROGRESS_CHECK_URL
        case 'TTS_PROGRESS_REPORT_INTERVAL':
          return MOCK_TTS_PROGRESS_REPORT_INTERVAL
        case 'AUDIOS_PATH':
          return MOCK_AUDIOS_PATH
        case 'GCLOUD_PROJECT_ID':
          return MOCK_GCLOUD_PROJECT_ID
        default:
          throw new Error(`${key} was requested but its not defined`)
      }
    })

    gcsService = module.get(GcsService)
    gcsService.getGcsUri.mockReturnValue(MOCK_GCS_URI)

    reportProgressCallback = jest.fn()

    ttsService = module.get<TtsService>(TtsService)
  })

  describe('textToSpeech', () => {
    describe('when no errors occur', () => {
      beforeEach(() => {
        mockedAxios.post.mockResolvedValue({ data: {} })
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            metadata: {
              progressPercentage: 50,
            },
          },
        })
        mockedAxios.get.mockResolvedValue({
          data: {
            metadata: {
              progressPercentage: 100,
            },
          },
        })
        getAccessTokenMock.mockResolvedValue({
          token: MOCK_GOOGLE_ACCESS_TOKEN,
        })
      })

      it('should report the progress', async () => {
        await ttsService.textToSpeech({
          id: MOCK_ID,
          language: MOCK_LANGUAGE,
          speaker: MOCK_SPEAKER,
          text: MOCK_TEXT,
          reportProgressCallback,
        })

        expect(reportProgressCallback).toHaveBeenCalledTimes(2)
        expect(reportProgressCallback).toHaveBeenCalledWith(50)
        expect(reportProgressCallback).toHaveBeenCalledWith(100)
      })

      it("should return the correct output file's path", async () => {
        const result = await ttsService.textToSpeech({
          id: MOCK_ID,
          language: MOCK_LANGUAGE,
          speaker: MOCK_SPEAKER,
          text: MOCK_TEXT,
          reportProgressCallback,
        })

        expect(result).toEqual(path.join(MOCK_AUDIOS_PATH, `${MOCK_ID}.wav`))
      })

      it('should make a request to google tts service with the correct params', async () => {
        await ttsService.textToSpeech({
          id: MOCK_ID,
          language: MOCK_LANGUAGE,
          speaker: MOCK_SPEAKER,
          text: MOCK_TEXT,
          reportProgressCallback,
        })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.post).toHaveBeenCalledTimes(1)
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.post).toHaveBeenCalledWith(
          MOCK_TTS_URL,
          {
            input: {
              text: MOCK_TEXT,
            },
            audioConfig: {
              audio_encoding: 'LINEAR16',
              speaking_rate: 1.0,
            },
            voice: {
              languageCode: MOCK_LANGUAGE,
              name: `${MOCK_LANGUAGE}-Chirp3-HD-${MOCK_SPEAKER}`,
            },
            outputGcsUri: MOCK_GCS_URI,
          },
          {
            headers: {
              Authorization: `Bearer ${MOCK_GOOGLE_ACCESS_TOKEN}`,
              'x-goog-user-project': MOCK_GCLOUD_PROJECT_ID,
            },
          },
        )
      })

      it('should make requests to check tts progress with the correct params', async () => {
        await ttsService.textToSpeech({
          id: MOCK_ID,
          language: MOCK_LANGUAGE,
          speaker: MOCK_SPEAKER,
          text: MOCK_TEXT,
          reportProgressCallback,
        })

        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.get).toHaveBeenCalledTimes(2)
        // eslint-disable-next-line @typescript-eslint/unbound-method
        expect(mockedAxios.get).toHaveBeenCalledWith(MOCK_PROGRESS_CHECK_URL, {
          headers: {
            Authorization: `Bearer ${MOCK_GOOGLE_ACCESS_TOKEN}`,
            'x-goog-user-project': MOCK_GCLOUD_PROJECT_ID,
          },
        })
      })
    })

    describe('when google authentication fails', () => {
      beforeEach(() => {
        mockedAxios.post.mockResolvedValue({ data: {} })
        mockedAxios.get.mockResolvedValue({
          data: {
            metadata: {
              progressPercentage: 100,
            },
          },
        })
        getAccessTokenMock.mockResolvedValue({
          token: undefined,
        })
      })

      it('should throw AuthFailedException', async () => {
        await expect(
          ttsService.textToSpeech({
            id: MOCK_ID,
            language: MOCK_LANGUAGE,
            speaker: MOCK_SPEAKER,
            text: MOCK_TEXT,
            reportProgressCallback,
          }),
        ).rejects.toThrow(AuthFailedException)
      })

      it('should not invoke the tts api', async () => {
        try {
          await ttsService.textToSpeech({
            id: MOCK_ID,
            language: MOCK_LANGUAGE,
            speaker: MOCK_SPEAKER,
            text: MOCK_TEXT,
            reportProgressCallback,
          })
          fail('Should have thrown')
        } catch {
          // eslint-disable-next-line @typescript-eslint/unbound-method
          expect(mockedAxios.post).not.toHaveBeenCalled()
        }
      })
    })

    describe('when TTS_MAX_WAIT is exceeded', () => {
      beforeEach(() => {
        mockedAxios.post.mockResolvedValue({ data: {} })
        mockedAxios.get.mockResolvedValue({
          data: {
            metadata: {
              progressPercentage: 50,
            },
          },
        })
        getAccessTokenMock.mockResolvedValue({
          token: MOCK_GOOGLE_ACCESS_TOKEN,
        })
      })

      it('should throw TimeoutException', async () => {
        await expect(
          ttsService.textToSpeech({
            id: MOCK_ID,
            language: MOCK_LANGUAGE,
            speaker: MOCK_SPEAKER,
            text: MOCK_TEXT,
            reportProgressCallback,
          }),
        ).rejects.toThrow(TimeoutException)
      })
    })

    describe('when an error is received from a progress check', () => {
      beforeEach(() => {
        mockedAxios.post.mockResolvedValue({ data: {} })
        mockedAxios.get.mockResolvedValue({
          data: {
            metadata: {
              progressPercentage: 50,
            },
            error: {
              message: 'dummy message',
            },
          },
        })
        getAccessTokenMock.mockResolvedValue({
          token: MOCK_GOOGLE_ACCESS_TOKEN,
        })
      })

      it('should throw TtsFailedException', async () => {
        await expect(
          ttsService.textToSpeech({
            id: MOCK_ID,
            language: MOCK_LANGUAGE,
            speaker: MOCK_SPEAKER,
            text: MOCK_TEXT,
            reportProgressCallback,
          }),
        ).rejects.toThrow(TtsFailedException)
      })
    })
  })
})
