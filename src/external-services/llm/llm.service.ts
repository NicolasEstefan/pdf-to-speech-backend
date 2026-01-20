import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { OnModuleInit } from '@nestjs/common'
import OpenAI from 'openai'
import { Language } from '../../generations/types/language.enum'
import { readFile } from 'node:fs/promises'

const TEXT_NORMALIZATION_PROMPT_FILE_PATH = `src/external-services/llm/prompts/normalize_text.:language.txt`
const TITLE_GENERATION_PROMPT_FILE_PATH =
  'src/external-services/llm/prompts/generate_title.txt'

@Injectable()
export class LlmService implements OnModuleInit {
  private readonly client: OpenAI
  private readonly textNormalizationPrompts: Record<Language, string>
  private titleGenerationPrompt: string

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.getOrThrow('OPENAI_API_KEY'),
    })
    this.textNormalizationPrompts = Object.fromEntries(
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
      this.textNormalizationPrompts[language] = prompt.toString()
    }

    this.titleGenerationPrompt = (
      await readFile(TITLE_GENERATION_PROMPT_FILE_PATH)
    ).toString()
  }

  async normalizeTextForTTS(text: string, language: Language): Promise<string> {
    const prompt = this.textNormalizationPrompts[language]

    const response = await this.client.responses.create({
      input: prompt.replace(':text', text),
      model: this.configService.getOrThrow('LLM_MODEL'),
    })

    return response.output_text
  }

  async generateTitle(text: string): Promise<string> {
    const response = await this.client.responses.create({
      input: this.titleGenerationPrompt.replace(':text', text),
      model: this.configService.getOrThrow('LLM_MODEL'),
    })

    return response.output_text
  }
}
