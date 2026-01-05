import { Test, TestingModule } from '@nestjs/testing'
import { PdfService } from './pdf.service'
import { readFile, copyFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { Language } from './language.enum'

const TEST_FILE_PATH = './test/files/test.pdf'
const EXPECTED_TEXT_FILE_PATH = './test/files/test.txt'

describe('PdfService', () => {
  let pdfService: PdfService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PdfService],
    }).compile()

    pdfService = module.get<PdfService>(PdfService)
  })

  describe('extractTextFromPages', () => {
    const testFileCopyPath = path.join(
      path.dirname(TEST_FILE_PATH),
      'test1.pdf',
    )
    let expectedText: string

    beforeEach(async () => {
      await copyFile(TEST_FILE_PATH, testFileCopyPath)

      expectedText = (await readFile(EXPECTED_TEXT_FILE_PATH)).toString()
    })

    afterEach(async () => {
      await rm(testFileCopyPath)
    })

    it('should extract the correct text from the pdf', async () => {
      const pages = await pdfService.extractTextFromPages(
        testFileCopyPath,
        Language.SPANISH,
      )
      expect(pages.length).toEqual(8)
      expect(pages).toEqual(expectedText.split('\f'))
    }, 10000)
  })
})
