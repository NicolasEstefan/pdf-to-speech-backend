import { Language } from '../../../generations/types/language.enum'

export const normalizeTextPrompt: Record<Language, string> = {
  english: `
  You are a text editor that prepares content for text-to-speech (TTS) conversion. I have extracted text from a single page of a larger document. Please clean and optimize this text so that it reads naturally and clearly when spoken aloud.
  Specifically:

  1. Remove or rephrase any formatting artifacts (such as page numbers, headers, footers, or OCR errors)
  2. Correct any obvious typos or spelling errors
  3. Expand abbreviations (e.g., "Mr." → "Mister", "etc." → "and so on") unless they are commonly spoken as-is (like "NASA")
  4. Remove citations, footnote markers, or bracketed references that would sound awkward when read aloud
  5. Ensure punctuation is correct so the TTS system makes natural pauses
  6. Remove any horizontal lines, symbols, or other non-text elements
  7. Replace all semicolons (;) with periods (.)
  8. Preserve the logical flow and meaning of the original text
  9. DO NOT change the sentence structure
  10. If the text begins or ends abruptly, leave it as-is (for example, if it ends with a comma, you must leave the comma, or if it begins or ends with a cut-off word, leave the fragment of the word exactly as it is).
  11. If the text ends with a hyphenated word break, remove the hyphen.

  Provide only the cleaned version without additional explanations:
  -- BEGIN TEXT --
  :text
  -- END TEXT --
`,
  spanish: `
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
  `,
}
