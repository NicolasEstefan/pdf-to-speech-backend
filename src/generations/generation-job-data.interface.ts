import { Speaker } from '../external-services/tts/speaker.enum'
import { Language } from '../external-services/tts/language.enum'

export interface GenerationJobData {
  generationId: string
  language: Language
  speaker: Speaker
}
