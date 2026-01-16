import { Controller, Get } from '@nestjs/common'
import { Speaker } from '../external-services/tts/types/speaker.enum'
import { Language } from './types/language.enum'

@Controller('options')
export class OptionsController {
  @Get('/')
  getOptions() {
    return {
      speakers: Object.values(Speaker),
      languages: Object.values(Language),
    }
  }
}
