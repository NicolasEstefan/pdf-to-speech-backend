import { Speaker } from '../../external-services/tts/types/speaker.enum'
import { Language } from './language.enum'
import { User } from '../../users/user.entity'

export interface CreateGenerationParams {
  language: Language
  speaker: Speaker
  title: string
  createdBy: User
}
