import { api, type TranslationTarget } from "@/lib/api";
import { type DoseWords, ENGLISH_DOSE, MEDICAL_ID_COPY } from "@/lib/medical-id";
import {
  DOSE_WORDS,
  MEDICAL_ID_GLOSSARY,
  RELATIONSHIP_ALIASES,
  RELATIONSHIPS,
} from "@/lib/medical-id-glossary";

/**
 * The Medical ID in the language of whoever is reading it.
 *
 * The card's fixed copy (`MEDICAL_ID_COPY`) and what the person wrote that it
 * translates (`medicalIdFreeText`) come from the hand translations in
 * `medical-id-glossary.ts` where those have them, and live through the
 * backend's LibreTranslate proxy otherwise. Anything else passes through
 * `Translate` unchanged, so a name or a drug is never "translated".
 */

export type LanguageCode = "en" | TranslationTarget;

export type Language = {
  code: LanguageCode;
  /** In the language itself, so the reader can find their own. */
  name: string;
  /** For `Intl` dates, which are formatted locally rather than translated. */
  locale: string;
};

/** Where the Find Medical Help pins are, as far as LibreTranslate reaches. */
export const LANGUAGES: Language[] = [
  { code: "en", name: "English", locale: "en-SG" },
  { code: "zh-Hans", name: "简体中文", locale: "zh-Hans-SG" },
  { code: "zh-Hant", name: "繁體中文", locale: "zh-Hant-HK" },
  { code: "ms", name: "Bahasa Melayu", locale: "ms-MY" },
  { code: "id", name: "Bahasa Indonesia", locale: "id-ID" },
  { code: "th", name: "ไทย", locale: "th-TH" },
  { code: "vi", name: "Tiếng Việt", locale: "vi-VN" },
  { code: "tl", name: "Filipino", locale: "fil-PH" },
  { code: "ja", name: "日本語", locale: "ja-JP" },
  { code: "ko", name: "한국어", locale: "ko-KR" },
  { code: "hi", name: "हिन्दी", locale: "hi-IN" },
];

export function languageFor(code: LanguageCode): Language {
  return LANGUAGES.find((language) => language.code === code) ?? LANGUAGES[0];
}

/** English in, the chosen language out; anything not translated comes back as it went in. */
export type Translate = (english: string) => string;

export const untranslated: Translate = (text) => text;

/** How the medication line writes a dose in `code`. */
export function doseWordsFor(code: LanguageCode): DoseWords {
  return code === "en" ? ENGLISH_DOSE : DOSE_WORDS[code];
}

/** "Mother-in-law", "my Mum" → "mother in law", "mother". */
function relationshipKey(text: string): string {
  const key = text
    .trim()
    .toLowerCase()
    .replace(/^my\s+/, "")
    .replace(/[\s_-]+/g, " ")
    .replace(/[.!]+$/, "");
  return RELATIONSHIP_ALIASES[key] ?? key;
}

/** The hand translation of `english`, if there is one: the card's copy first, then a relationship. */
function handTranslator(code: TranslationTarget): (english: string) => string | undefined {
  const glossary = new Map(Object.entries(MEDICAL_ID_GLOSSARY[code]));
  const relationships = new Map<string, string>(Object.entries(RELATIONSHIPS[code]));
  return (english) => glossary.get(english) ?? relationships.get(relationshipKey(english));
}

// LibreTranslate's answers, per language, for the page load. Only what is not
// here yet is asked for, so a language costs one request and an edited profile
// one more for its new text. A failed request adds nothing, so picking the
// language again retries it.
const machine = new Map<TranslationTarget, Map<string, string>>();

/** The card in `code`, with the person's own `freeText` translated too. */
export async function loadTranslation(
  code: LanguageCode,
  freeText: string[] = [],
): Promise<Translate> {
  if (code === "en") return untranslated;

  const hand = handTranslator(code);
  let known = machine.get(code);
  if (!known) machine.set(code, (known = new Map()));

  const missing = [...new Set([...MEDICAL_ID_COPY, ...freeText])].filter(
    (text) => hand(text) === undefined && !known.has(text),
  );
  if (missing.length) {
    const { translations } = await api.translate(code, missing);
    missing.forEach((text, i) => known.set(text, translations[i] ?? text));
  }
  return (english) => hand(english) ?? known.get(english) ?? english;
}
