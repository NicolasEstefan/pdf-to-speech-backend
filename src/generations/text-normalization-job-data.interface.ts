import { Language } from '../external-services/tts/language.enum'

export interface TextNormalizationJobData {
  generationId: string
  text: string
  language: Language
  pageNumber: number
}
