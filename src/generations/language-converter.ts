import { Language as TtsLanguage } from '../external-services/tts/language.enum'
import { Language as PdfLanguage } from './pdf/language.enum'
import { Language } from './language.enum'

export function getTtsLanguage(language: Language): TtsLanguage {
  switch (language) {
    case Language.ENGLISH:
      return TtsLanguage.EN_US
    case Language.SPANISH:
      return TtsLanguage.ES_US
  }
}

export function getPdfLanguage(language: Language): PdfLanguage {
  switch (language) {
    case Language.ENGLISH:
      return PdfLanguage.ENGLISH
    case Language.SPANISH:
      return PdfLanguage.SPANISH
  }
}
