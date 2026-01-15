import { Speaker } from '../../external-services/tts/types/speaker.enum'
import { Language } from './language.enum'

export class StartGenerationParams {
  pdfFilePath: string
  language: Language
  speaker: Speaker
}
