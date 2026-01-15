import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import OpenAI from 'openai'
import { Language } from '../../generations/types/language.enum'
import { readFile } from 'node:fs/promises'

const TEXT_NORMALIZATION_PROMPT_FILE_PATH = `src/external-services/llm/prompts/normalize_text.:language.txt`

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly client: OpenAI
  private readonly prompts: Record<Language, string>

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.getOrThrow('OPENAI_API_KEY'),
    })
    this.prompts = Object.fromEntries(
      Object.values(Language).map((language) => [language, '']),
    ) as Record<Language, string>
  }
  async onModuleInit() {
    for (const language of Object.values(Language)) {
      const filePath = TEXT_NORMALIZATION_PROMPT_FILE_PATH.replace(
        ':language',
        language,
      )

      const prompt = await readFile(filePath)
      this.prompts[language] = prompt.toString()
    }
  }

  async normalizeTextForTTS(text: string, language: Language): Promise<string> {
    const prompt = this.prompts[language]

    const response = await this.client.responses.create({
      input: prompt.replace(':text', text),
      model: this.configService.getOrThrow('LLM_MODEL'),
    })

    return response.output_text
  }
}
