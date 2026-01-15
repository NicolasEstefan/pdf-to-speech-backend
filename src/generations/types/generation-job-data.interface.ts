import { Speaker } from '../../external-services/tts/types/speaker.enum'
import { Language } from '../../external-services/tts/types/language.enum'

export interface GenerationJobData {
  generationId: string
  language: Language
  speaker: Speaker
}
