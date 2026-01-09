import { Test, TestingModule } from '@nestjs/testing'
import { GcsService } from './gcs.service'
import {
  ConfigServiceMock,
  configServiceMock,
} from '../../../test/mocks/config.service.mock'
import { ConfigService } from '@nestjs/config'

const downloadMock = jest.fn()
const fileMock = jest.fn(() => ({ download: downloadMock }))
const bucketMock = jest.fn(() => ({ file: fileMock }))

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn(() => ({
    bucket: bucketMock,
  })),
}))

describe('GcsService', () => {
  const TEST_BUCKET_NAME = 'pdf-to-speech-audios'
  const TEST_FILE_NAME = 'test.txt'
  let gcsService: GcsService
  let configService: ConfigServiceMock

  beforeEach(async () => {
    jest.clearAllMocks()

    configService = configServiceMock()
    configService.getOrThrow.mockImplementation((key: string) => {
      if (key === 'GCS_BUCKET_NAME') {
        return TEST_BUCKET_NAME
      }
    })

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GcsService,
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile()

    gcsService = module.get<GcsService>(GcsService)
  })

  describe('getGcsUri', () => {
    it('should return a gcs uri with the correct format', () => {
      const result = gcsService.getGcsUri(TEST_FILE_NAME)
      expect(result).toEqual(`gs://${TEST_BUCKET_NAME}/${TEST_FILE_NAME}`)
    })
  })

  describe('downloadFile', () => {
    const TEST_OUTPUT_PATH = `./files/txts/${TEST_FILE_NAME}`

    it('should download the correct file to the specified path', async () => {
      await gcsService.downloadFile(TEST_FILE_NAME, TEST_OUTPUT_PATH)

      expect(bucketMock).toHaveBeenCalledTimes(1)
      expect(bucketMock).toHaveBeenCalledWith(TEST_BUCKET_NAME)
      expect(fileMock).toHaveBeenCalledTimes(1)
      expect(fileMock).toHaveBeenCalledWith(TEST_FILE_NAME)
      expect(downloadMock).toHaveBeenCalledTimes(1)
      expect(downloadMock).toHaveBeenCalledWith({
        destination: TEST_OUTPUT_PATH,
      })
    })
  })
})
