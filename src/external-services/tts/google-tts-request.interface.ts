import { Language } from './language.enum'
import { Voice } from './voice.type'

export interface GoogleTtsRequest {
  input: {
    text: string
  }
  voice: {
    languageCode: Language
    name: Voice
  }
  audioConfig: {
    audio_encoding: 'LINEAR16'
    speaking_rate: number
  }
  outputGcsUri: string
}
