import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

const TEXT_NORMALIZATION_PROMPT = `
  Eres un editor de texto que prepara contenido para conversión de texto a voz (TTS). He extraído texto de una sola página de un documento más grande. Por favor, limpia y optimiza este texto para que se lea de manera natural y clara cuando se hable en voz alta.

  Específicamente:
  1. Elimina o reformula cualquier artefacto de formato (como números de página, encabezados, pies de página o errores de OCR)
  2. Corrige cualquier error tipográfico u ortográfico obvio
  3. Expande abreviaturas (por ejemplo, "Sr." → "Señor", "etc." → "y así sucesivamente") a menos que se hablen comúnmente tal como están (como "NASA")
  4. Elimina citas, marcadores de notas al pie o referencias entre corchetes que sonarían incómodas cuando se lean en voz alta
  5. Asegúrate de que la puntuación sea correcta para que el sistema TTS haga pausas naturales
  6. Elimina cualquier línea horizontal, símbolo u otro elemento que no sea texto
  7. Sustituye todos los puntos y comas (;) por puntos (.)
  8. Preserva el flujo lógico y el significado del texto original
  9. NO cambies la estructura de las oraciones
  10. Si el texto comienza o termina de forma abrupta, déjalo así (por ejemplo si termina con una coma, debes dejar la coma, o si comienza o termina con una palabra cortada, deja el pedazo de la palabra tal cual está).
  11. Si el texto termina con una palabra cortada con un guión, remueve el guión.

  Proporciona solo la versión limpia sin explicaciones adicionales:
  -- INICIO TEXTO --
  :text
  -- FIN TEXTO --
`

@Injectable()
export class LlmService {
  private readonly client: OpenAI

  constructor(private readonly configService: ConfigService) {
    this.client = new OpenAI({
      apiKey: configService.getOrThrow('OPENAI_API_KEY'),
    })
  }

  async normalizeTextForTTS(text: string): Promise<string> {
    const response = await this.client.responses.create({
      input: TEXT_NORMALIZATION_PROMPT.replace(':text', text),
      model: this.configService.getOrThrow('LLM_MODEL'),
    })

    return response.output_text
  }
}
