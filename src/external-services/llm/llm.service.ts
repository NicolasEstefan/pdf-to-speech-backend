import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'
import { Language } from '../../generations/types/language.enum'
import { normalizeTextPrompt } from './prompts/normalize-text-prompt'
import { generateTitlePrompt } from './prompts/generate-title'

@Injectable()
export class LlmService {
  private readonly client: OpenAI

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.getOrThrow('OPENAI_API_KEY'),
    })
  }

  async normalizeTextForTTS(text: string, language: Language): Promise<string> {
    const prompt = normalizeTextPrompt[language]

    const response = await this.client.responses.create({
      input: prompt.replace(':text', text),
      model: this.configService.getOrThrow('LLM_MODEL'),
    })

    return response.output_text
  }

  async generateTitle(text: string): Promise<string> {
    const response = await this.client.responses.create({
      input: generateTitlePrompt.replace(':text', text),
      model: this.configService.getOrThrow('LLM_MODEL'),
    })

    return response.output_text
  }
}
