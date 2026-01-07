import { Injectable } from '@nestjs/common'
import { execFile } from 'node:child_process'
import { Language } from './language.enum'

@Injectable()
export class PdfService {
  async extractTextFromPages(
    filePath: string,
    language: Language,
  ): Promise<string[]> {
    await new Promise((resolve, reject) => {
      execFile(
        'ocrmypdf',
        ['-l', language, '--skip-text', filePath, filePath],
        (error) => {
          if (error) {
            reject(new Error(error.message, { cause: error.cause }))
          } else {
            resolve(filePath)
          }
        },
      )
    })

    let text = await new Promise<string>((resolve, reject) => {
      execFile(
        'pdftotext',
        [filePath, '-'],
        { encoding: 'utf8' },
        (error, stdout) => {
          if (error) {
            reject(new Error(error.message, { cause: error.cause }))
          } else {
            resolve(stdout)
          }
        },
      )
    })

    text = text.trim()

    return text.split('\f')
  }
}
