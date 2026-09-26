import { api, type TranslationTarget } from "@/lib/api";
import { MEDICAL_ID_COPY } from "@/lib/medical-id";
import { MEDICAL_ID_GLOSSARY } from "@/lib/medical-id-glossary";

/**
 * The Medical ID in the language of whoever is reading it.
 *
 * Only the card's fixed copy (`MEDICAL_ID_COPY`) is translated: from the hand
 * translations in `MEDICAL_ID_GLOSSARY` where they have the string, and live
 * through the backend's LibreTranslate proxy for the rest. Everything else
 * passes through `Translate` unchanged, so a name or a drug is never
 * "translated".
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

/** English in, the chosen language out; anything not in the copy comes back as it went in. */
export type Translate = (english: string) => string;

export const untranslated: Translate = (text) => text;

// One request per language per page load. A failure is forgotten, so picking
// the language again retries it.
const loaded = new Map<TranslationTarget, Promise<Translate>>();

export function loadTranslation(code: LanguageCode): Promise<Translate> {
  if (code === "en") return Promise.resolve(untranslated);

  let pending = loaded.get(code);
  if (!pending) {
    const glossary = new Map(Object.entries(MEDICAL_ID_GLOSSARY[code]));
    const machine = MEDICAL_ID_COPY.filter((text) => !glossary.has(text));
    const translated = machine.length
      ? api.translate(code, machine).then(({ translations }) => translations)
      : Promise.resolve([]);
    pending = translated.then((translations) => {
      const table = new Map(machine.map((text, i) => [text, translations[i] ?? text]));
      for (const [english, hand] of glossary) table.set(english, hand);
      return (english: string) => table.get(english) ?? english;
    });
    pending.catch(() => loaded.delete(code));
    loaded.set(code, pending);
  }
  return pending;
}
