import { Language as TtsLanguage } from 'src/external-services/tts/language.enum'
import { Language as PdfLanguage } from './pdf/language.enum'

export function pdfLanguageToTtsLanguage(language: PdfLanguage): TtsLanguage {
  switch (language) {
    case PdfLanguage.ENGLISH:
      return TtsLanguage.EN_US
    case PdfLanguage.SPANISH:
      return TtsLanguage.ES_US
  }
}

export function ttsLanguageToPdfLanguage(language: TtsLanguage): PdfLanguage {
  switch (language) {
    case TtsLanguage.EN_US:
      return PdfLanguage.ENGLISH
    case TtsLanguage.ES_US:
      return PdfLanguage.SPANISH
  }
}
