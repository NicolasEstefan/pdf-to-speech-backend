import { Speaker } from '../external-services/tts/speaker.enum'
import { Language } from './language.enum'

export class StartGenerationParams {
  pdfFilePath: string
  language: Language
  speaker: Speaker
}
