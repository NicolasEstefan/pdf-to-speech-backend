import { Language } from './language.enum'
import { Speaker } from './speaker.enum'

export interface TtsParams {
  text: string
  id: string
  language: Language
  speaker: Speaker
  reportProgressCallback?: (progress: number) => void
}
