import { IsEnum } from 'class-validator'
import { Speaker } from '../../external-services/tts/types/speaker.enum'
import { Language } from '../types/language.enum'

export class StartGenerationDto {
  @IsEnum(Language)
  language: Language
  @IsEnum(Speaker)
  speaker: Speaker
}
