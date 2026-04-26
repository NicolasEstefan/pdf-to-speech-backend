import { Speaker } from '../../external-services/tts/types/speaker.enum'
import { Language } from './language.enum'

export class StartGenerationParams {
  pdfFilePath: string
  originalFileName: string
  language: Language
  speaker: Speaker
}
