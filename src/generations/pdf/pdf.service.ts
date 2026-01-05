import { Injectable } from '@nestjs/common'
import { exec } from 'node:child_process'
import { Language } from './language.enum'

@Injectable()
export class PdfService {
  async extractTextFromPages(
    filePath: string,
    language: Language,
  ): Promise<string[]> {
    await new Promise((resolve, reject) => {
      exec(
        `ocrmypdf -l ${language} --skip-text ${filePath} ${filePath}`,
        (error) => {
          if (error) {
            reject(error)
          } else {
            resolve(filePath)
          }
        },
      )
    })

    let text = await new Promise<string>((resolve, reject) => {
      exec(`pdftotext ${filePath} -`, { encoding: 'utf8' }, (error, stdout) => {
        if (error) {
          reject(error)
        } else {
          resolve(stdout)
        }
      })
    })

    text = text.trim()

    return text.split('\f')
  }
}
