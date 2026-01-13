import { Language } from './language.enum'

export interface TextNormalizationJobData {
  generationId: string
  text: string
  language: Language
  pageNumber: number
}
