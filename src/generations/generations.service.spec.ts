import { Test, TestingModule } from '@nestjs/testing'
import { GenerationsService } from './generations.service'
import { getFlowProducerToken } from '@nestjs/bullmq'
import { PdfService } from './pdf/pdf.service'
import { User } from '../users/user.entity'
import { Language } from './types/language.enum'
import { Language as TtsLanguage } from '../external-services/tts/types/language.enum'
import { Speaker } from '../external-services/tts/types/speaker.enum'
import { repositoryMock } from '../../test/mocks/repository.mock'
import { GenerationsRepository } from './generations.repository'
import { usersFactory } from '../../test/factories/users.factory'
import { generationsFactory } from '../../test/factories/generations.factory'
import { Generation } from './entities/generation.entity'
import {
  DOWNLOAD_QUEUE,
  DOWNLOAD_STEP,
  GENERATE_STEP,
  GENERATION_QUEUE,
  NORMALIZE_TEXT_STEP,
  TEXT_NORMALIZATION_QUEUE,
} from './generations.constants'
import { GenerationJobData } from './types/generation-job-data.interface'
import { DownloadJobData } from './types/download-job-data.interface'
import { TextNormalizationJobData } from './types/text-normalization-job-data.interface'
import { rm, stat } from 'fs/promises'
import { GenerationStatus } from './types/generation-status.enum'
import { GenerationsGateway } from './generations.gateway'
import { LlmService } from '../external-services/llm/llm.service'

const flowProducerMock = () => ({
  add: jest.fn(),
})

const pdfServiceMock = () => ({
  extractTextFromPages: jest.fn(),
})

const llmServiceMock = () => ({
  generateTitle: jest.fn(),
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

const generationsGatewayMock = () => ({
  emitGenerationProgress: jest.fn(),
})

describe('GenerationsService', () => {
  let generationsService: GenerationsService
  let pdfService: ReturnType<typeof pdfServiceMock>
  let generationsFlowProducer: ReturnType<typeof flowProducerMock>
  let generationsRepository: ReturnType<typeof generationsRepositoryMock>
  let llmService: ReturnType<typeof llmServiceMock>
  let generationsGateway: ReturnType<typeof generationsGatewayMock>

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
        {
          provide: GenerationsGateway,
          useFactory: generationsGatewayMock,
        },
        {
          provide: LlmService,
          useFactory: llmServiceMock,
        },
      ],
    }).compile()

    generationsFlowProducer = module.get(
      getFlowProducerToken('generations-flow-producer'),
    )
    pdfService = module.get(PdfService)
    generationsRepository = module.get(GenerationsRepository)
    llmService = module.get(LlmService)
    generationsGateway = module.get(GenerationsGateway)

    generationsService = module.get<GenerationsService>(GenerationsService)
  })

  describe('startGeneration', () => {
    const MOCK_PAGES = ['this', 'is', 'a', 'test']
    const MOCK_PDF_PATH = 'files/pdfs/test.pdf'
    const MOCK_LANGUAGE = Language.ENGLISH
    const MOCK_TTS_LANGUAGE = TtsLanguage.EN_US
    const MOCK_SPEAKER = Speaker.ACHERNAR
    const MOCK_TITLE = 'This is a test title'
    let mockUser: User
    let mockGeneration: Generation

    beforeEach(() => {
      mockUser = usersFactory.build()
      mockGeneration = generationsFactory.build({ createdBy: mockUser })

      pdfService.extractTextFromPages.mockResolvedValue(MOCK_PAGES)
      generationsRepository.createGeneration.mockResolvedValue(mockGeneration)
      llmService.generateTitle.mockResolvedValue(MOCK_TITLE)
    })

    it('should call the GenerationsRepository.createGeneration with the correct params', async () => {
      await generationsService.startGeneration(mockUser, {
        language: MOCK_LANGUAGE,
        speaker: MOCK_SPEAKER,
        pdfFilePath: MOCK_PDF_PATH,
      })
      expect(generationsRepository.createGeneration).toHaveBeenCalledTimes(1)
      expect(generationsRepository.createGeneration).toHaveBeenCalledWith(
        mockUser,
        MOCK_TITLE,
      )
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
    const MOCK_AUDIO_FILE_PATH = 'files/audios/test.wav'
    const mockedStat = stat as jest.Mock
    let mockGeneration: Generation

    beforeEach(() => {
      mockedStat.mockResolvedValue({ size: MOCK_FILE_SIZE })
      mockGeneration = generationsFactory.build({
        status: GenerationStatus.DONE,
      })
      generationsRepository.finishGeneration.mockResolvedValue(mockGeneration)
    })

    it('should call generationsRepository.finishGeneration with the correct params', async () => {
      await generationsService.finishGeneration(
        mockGeneration.id,
        MOCK_AUDIO_FILE_PATH,
      )

      expect(generationsRepository.finishGeneration).toHaveBeenCalledTimes(1)
      expect(generationsRepository.finishGeneration).toHaveBeenCalledWith(
        mockGeneration.id,
        MOCK_AUDIO_FILE_PATH,
        MOCK_FILE_SIZE,
      )
    })

    it('should call GenerationsGateway.emitGenerationProgress with the correct params', async () => {
      await generationsService.finishGeneration(
        mockGeneration.id,
        MOCK_AUDIO_FILE_PATH,
      )

      expect(generationsGateway.emitGenerationProgress).toHaveBeenCalledTimes(1)
      expect(generationsGateway.emitGenerationProgress).toHaveBeenCalledWith({
        createdById: mockGeneration.createdById,
        generationId: mockGeneration.id,
        generationStatus: GenerationStatus.DONE,
        progressPercentage: 100,
        audioSize: MOCK_FILE_SIZE,
      })
    })
  })

  describe('failGeneration', () => {
    let mockGeneration: Generation

    beforeEach(() => {
      mockGeneration = generationsFactory.build()
      generationsRepository.findOneBy.mockResolvedValue(mockGeneration)
    })

    it('should update the generation with the appropriate params', async () => {
      await generationsService.failGeneration(mockGeneration.id)

      expect(mockGeneration.status).toEqual(GenerationStatus.FAILED)
      expect(mockGeneration.progressPercentage).toEqual(100)
      expect(generationsRepository.save).toHaveBeenCalledTimes(1)
      expect(generationsRepository.save).toHaveBeenCalledWith(mockGeneration)
    })

    it('should call GenerationsGateway.emitGenerationProgress with the correct params', async () => {
      await generationsService.failGeneration(mockGeneration.id)

      expect(generationsGateway.emitGenerationProgress).toHaveBeenCalledTimes(1)
      expect(generationsGateway.emitGenerationProgress).toHaveBeenCalledWith({
        createdById: mockGeneration.createdById,
        generationId: mockGeneration.id,
        generationStatus: GenerationStatus.FAILED,
        progressPercentage: 100,
      })
    })
  })

  describe('reportGenerationProgress', () => {
    let mockGeneration: Generation

    beforeEach(() => {
      mockGeneration = generationsFactory.build()
      generationsRepository.findOneBy.mockResolvedValue(mockGeneration)
    })

    it('should update the progress percentage', async () => {
      await generationsService.reportGenerationProgress(mockGeneration.id, 5)

      expect(mockGeneration.progressPercentage).toEqual(5)
      expect(generationsRepository.save).toHaveBeenCalledTimes(1)
      expect(generationsRepository.save).toHaveBeenCalledWith(mockGeneration)
    })

    it('should call GenerationsGateway.emitGenerationProgress with the correct params', async () => {
      await generationsService.reportGenerationProgress(mockGeneration.id, 5)

      expect(generationsGateway.emitGenerationProgress).toHaveBeenCalledTimes(1)
      expect(generationsGateway.emitGenerationProgress).toHaveBeenCalledWith({
        createdById: mockGeneration.createdById,
        generationId: mockGeneration.id,
        generationStatus: GenerationStatus.IN_PROGRESS,
        progressPercentage: 5,
      })
    })
  })

  describe('getGenerations', () => {
    let mockUser: User
    let mockGenerations: Generation[]
    const MOCK_PAGE_SIZE = 5

    beforeEach(() => {
      mockUser = usersFactory.build()
      mockGenerations = generationsFactory.buildList(MOCK_PAGE_SIZE)
      generationsRepository.findAndCount.mockResolvedValue([
        mockGenerations,
        MOCK_PAGE_SIZE * 2,
      ])
    })

    it('should call GenerationsRepository.findAndCount with the correct params', async () => {
      await generationsService.getGenerations(mockUser, {
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
      })

      expect(generationsRepository.findAndCount).toHaveBeenCalledTimes(1)
      expect(generationsRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          createdBy: mockUser,
        },
        take: MOCK_PAGE_SIZE,
        skip: 0,
        order: {
          createdAt: 'DESC',
        },
      })
    })

    it('should correctly compute the offset when requesting a page', async () => {
      await generationsService.getGenerations(mockUser, {
        page: 2,
        pageSize: MOCK_PAGE_SIZE,
      })

      expect(generationsRepository.findAndCount).toHaveBeenCalledTimes(1)
      expect(generationsRepository.findAndCount).toHaveBeenCalledWith({
        where: {
          createdBy: mockUser,
        },
        take: MOCK_PAGE_SIZE,
        skip: MOCK_PAGE_SIZE,
        order: {
          createdAt: 'DESC',
        },
      })
    })

    it('should return the total number of pages and the generations', async () => {
      const result = await generationsService.getGenerations(mockUser, {
        page: 1,
        pageSize: MOCK_PAGE_SIZE,
      })

      expect(result.totalPages).toEqual(2)
      expect(result.data).toEqual(mockGenerations)
    })
  })

  describe('getGenerationById', () => {
    let mockUser: User
    let mockGeneration: Generation

    beforeEach(() => {
      mockUser = usersFactory.build()
      mockGeneration = generationsFactory.build({ createdBy: mockUser })

      generationsRepository.findOne.mockResolvedValue(mockGeneration)
    })

    it('should call generationsRepository.findOne with the correctParams', async () => {
      await generationsService.getGenerationById(mockUser, mockGeneration.id)

      expect(generationsRepository.findOne).toHaveBeenCalledTimes(1)
      expect(generationsRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: mockGeneration.id,
          createdBy: mockUser,
        },
      })
    })

    it('should return the found generation', async () => {
      const result = await generationsService.getGenerationById(
        mockUser,
        mockGeneration.id,
      )

      expect(result).toEqual(mockGeneration)
    })
  })
})
