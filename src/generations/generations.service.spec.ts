import { Test, TestingModule } from '@nestjs/testing'
import { GenerationsService } from './generations.service'
import { getFlowProducerToken } from '@nestjs/bullmq'
import { PdfService } from './pdf/pdf.service'
import { User } from '../users/user.entity'
import { Language } from './language.enum'
import { Language as TtsLanguage } from '../external-services/tts/language.enum'
import { Speaker } from '../external-services/tts/speaker.enum'
import { repositoryMock } from '../../test/mocks/repository.mock'
import { GenerationsRepository } from './generations.repository'
import { usersFactory } from '../../test/factories/users.factory'
import { generationsFactory } from '../../test/factories/generations.factory'
import { Generation } from './generation.entity'
import {
  DOWNLOAD_QUEUE,
  DOWNLOAD_STEP,
  GENERATE_STEP,
  GENERATION_QUEUE,
  NORMALIZE_TEXT_STEP,
  TEXT_NORMALIZATION_QUEUE,
} from './generations.module'
import { GenerationJobData } from './generation-job-data.interface'
import { DownloadJobData } from './download-job-data.interface'
import { TextNormalizationJobData } from './text-normalization-job-data.interface'
import { rm, stat } from 'fs/promises'
import { faker } from '@faker-js/faker'
import { GenerationStatus } from './generation-status.enum'

const flowProducerMock = () => ({
  add: jest.fn(),
})

const pdfServiceMock = () => ({
  extractTextFromPages: jest.fn(),
})

jest.mock('node:fs/promises', () => ({
  rm: jest.fn(),
  stat: jest.fn(),
}))

const generationsRepositoryMock = () => ({
  ...repositoryMock(),
  createGeneration: jest.fn(),
  finishGeneration: jest.fn(),
})

describe('GenerationsService', () => {
  let generationsService: GenerationsService
  let pdfService: ReturnType<typeof pdfServiceMock>
  let generationsFlowProducer: ReturnType<typeof flowProducerMock>
  let generationsRepository: ReturnType<typeof generationsRepositoryMock>

  beforeEach(async () => {
    jest.resetAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerationsService,
        {
          provide: getFlowProducerToken('generations-flow-producer'),
          useFactory: flowProducerMock,
        },
        {
          provide: PdfService,
          useFactory: pdfServiceMock,
        },
        {
          provide: GenerationsRepository,
          useFactory: generationsRepositoryMock,
        },
      ],
    }).compile()

    generationsFlowProducer = module.get(
      getFlowProducerToken('generations-flow-producer'),
    )
    pdfService = module.get(PdfService)
    generationsRepository = module.get(GenerationsRepository)

    generationsService = module.get<GenerationsService>(GenerationsService)
  })

  describe('startGeneration', () => {
    const MOCK_PAGES = ['this', 'is', 'a', 'test']
    const MOCK_PDF_PATH = 'files/pdfs/test.pdf'
    const MOCK_LANGUAGE = Language.ENGLISH
    const MOCK_TTS_LANGUAGE = TtsLanguage.EN_US
    const MOCK_SPEAKER = Speaker.ACHERNAR
    let mockUser: User
    let mockGeneration: Generation

    beforeEach(() => {
      mockUser = usersFactory.build()
      mockGeneration = generationsFactory
        .associations({ createdBy: mockUser })
        .build()

      pdfService.extractTextFromPages.mockResolvedValue(MOCK_PAGES)
      generationsRepository.createGeneration.mockResolvedValue(mockGeneration)
    })

    it('should return the created generation', async () => {
      const result = await generationsService.startGeneration(mockUser, {
        language: MOCK_LANGUAGE,
        speaker: MOCK_SPEAKER,
        pdfFilePath: MOCK_PDF_PATH,
      })

      expect(result).toEqual(mockGeneration)
    })

    it('should add a flow with the correct parameters', async () => {
      const downloadJobData: DownloadJobData = {
        generationId: mockGeneration.id,
      }

      const generationJobData: GenerationJobData = {
        generationId: mockGeneration.id,
        language: MOCK_TTS_LANGUAGE,
        speaker: MOCK_SPEAKER,
      }

      const textNormalizationJobsData: TextNormalizationJobData[] =
        MOCK_PAGES.map((page, index) => ({
          generationId: mockGeneration.id,
          language: MOCK_LANGUAGE,
          text: page,
          pageNumber: index,
        }))

      await generationsService.startGeneration(mockUser, {
        language: MOCK_LANGUAGE,
        speaker: MOCK_SPEAKER,
        pdfFilePath: MOCK_PDF_PATH,
      })

      expect(generationsFlowProducer.add).toHaveBeenCalledTimes(1)
      expect(generationsFlowProducer.add).toHaveBeenCalledWith({
        name: DOWNLOAD_STEP,
        queueName: DOWNLOAD_QUEUE,
        opts: {
          attempts: 7,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
        },
        data: downloadJobData,
        children: [
          {
            name: GENERATE_STEP,
            queueName: GENERATION_QUEUE,
            opts: {
              attempts: 2,
              failParentOnFailure: true,
            },
            data: generationJobData,
            children: textNormalizationJobsData.map((data) => ({
              name: NORMALIZE_TEXT_STEP,
              queueName: TEXT_NORMALIZATION_QUEUE,
              opts: {
                attempts: 3,
                failParentOnFailure: true,
              },
              data,
            })),
          },
        ],
      })
    })

    it("should remove the pdf when it's done", async () => {
      await generationsService.startGeneration(mockUser, {
        language: MOCK_LANGUAGE,
        speaker: MOCK_SPEAKER,
        pdfFilePath: MOCK_PDF_PATH,
      })

      expect(rm).toHaveBeenCalledTimes(1)
      expect(rm).toHaveBeenCalledWith(MOCK_PDF_PATH)
    })

    describe('when an error is thrown', () => {
      let error: Error

      beforeEach(() => {
        error = new Error('test')
        generationsFlowProducer.add.mockRejectedValue(error)
      })

      it('should rethrow it', async () => {
        await expect(
          generationsService.startGeneration(mockUser, {
            language: MOCK_LANGUAGE,
            speaker: MOCK_SPEAKER,
            pdfFilePath: MOCK_PDF_PATH,
          }),
        ).rejects.toThrow(error)
      })

      it('should delete the pdf', async () => {
        try {
          await generationsService.startGeneration(mockUser, {
            language: MOCK_LANGUAGE,
            speaker: MOCK_SPEAKER,
            pdfFilePath: MOCK_PDF_PATH,
          })

          fail('should have thrown')
        } catch {
          expect(rm).toHaveBeenCalledTimes(1)
          expect(rm).toHaveBeenCalledWith(MOCK_PDF_PATH)
        }
      })
    })
  })

  describe('finishGeneration', () => {
    const MOCK_FILE_SIZE = 20000
    const MOCK_GENERATION_ID = faker.string.uuid()
    const MOCK_AUDIO_FILE_PATH = 'files/audios/test.wav'
    const mockedStat = stat as jest.Mock

    beforeEach(() => {
      mockedStat.mockResolvedValue({ size: MOCK_FILE_SIZE })
    })

    it('should call generationsRepository.finishGeneration', async () => {
      await generationsService.finishGeneration(
        MOCK_GENERATION_ID,
        MOCK_AUDIO_FILE_PATH,
      )

      expect(generationsRepository.finishGeneration).toHaveBeenCalledTimes(1)
      expect(generationsRepository.finishGeneration).toHaveBeenCalledWith(
        MOCK_GENERATION_ID,
        MOCK_AUDIO_FILE_PATH,
        MOCK_FILE_SIZE,
      )
    })
  })

  describe('failGeneration', () => {
    const MOCK_GENERATION_ID = faker.string.uuid()

    it('should update the generation with the appropriate params', async () => {
      await generationsService.failGeneration(MOCK_GENERATION_ID)

      expect(generationsRepository.update).toHaveBeenCalledTimes(1)
      expect(generationsRepository.update).toHaveBeenCalledWith(
        {
          id: MOCK_GENERATION_ID,
        },
        {
          status: GenerationStatus.FAILED,
        },
      )
    })
  })
})
