import { Test, TestingModule } from '@nestjs/testing'
import { LlmService } from '../../external-services/llm/llm.service'
import { TextNormalizationWorker } from './text-normalization.worker'
import { TextNormalizationJobData } from '../types/text-normalization-job-data.interface'
import { TextNormalizationJobResult } from '../types/text-normalization-job-result.interface'
import { Job } from 'bullmq'
import { faker } from '@faker-js/faker'
import { Language } from '../types/language.enum'

const llmServiceMock = () => ({
  normalizeTextForTTS: jest.fn(),
})

describe('TextNormalizationWorker', () => {
  let llmService: ReturnType<typeof llmServiceMock>
  let textNormalizationWorker: TextNormalizationWorker
  let mockJob: Partial<
    Job<TextNormalizationJobData, TextNormalizationJobResult>
  >

  beforeEach(async () => {
    jest.resetAllMocks()

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TextNormalizationWorker,
        {
          provide: LlmService,
          useFactory: llmServiceMock,
        },
      ],
    }).compile()

    llmService = module.get(LlmService)

    textNormalizationWorker = module.get(TextNormalizationWorker)
    mockJob = {}
  })

  describe('process', () => {
    const MOCK_NORMALIZED_TEXT = 'normalized text'

    beforeEach(() => {
      mockJob.data = {
        generationId: faker.string.uuid(),
        language: Language.ENGLISH,
        pageNumber: 1,
        text: 'unnormalized text',
      }
      llmService.normalizeTextForTTS.mockResolvedValue(MOCK_NORMALIZED_TEXT)
    })

    it('should call llmService.normalizeTextForTTS with the correct params', async () => {
      await textNormalizationWorker.process(
        mockJob as Job<TextNormalizationJobData, TextNormalizationJobResult>,
      )

      expect(llmService.normalizeTextForTTS).toHaveBeenCalledTimes(1)
      expect(llmService.normalizeTextForTTS).toHaveBeenCalledWith(
        mockJob.data!.text,
        mockJob.data!.language,
      )
    })

    it('should return the normalized text and page number', async () => {
      const result = await textNormalizationWorker.process(
        mockJob as Job<TextNormalizationJobData, TextNormalizationJobResult>,
      )

      expect(result).toEqual({
        text: MOCK_NORMALIZED_TEXT,
        pageNumber: mockJob.data!.pageNumber,
      })
    })
  })
})
