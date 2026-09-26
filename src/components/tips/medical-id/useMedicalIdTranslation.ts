import { useEffect, useState } from "react";

import {
  type LanguageCode,
  loadTranslation,
  type Translate,
  untranslated,
} from "@/lib/medical-id-translation";

export type MedicalIdTranslation = {
  /** The language actually on screen: English until the chosen one arrives, and if it fails. */
  shown: LanguageCode;
  t: Translate;
  status: "ready" | "loading" | "error";
};

/**
 * The card's copy and the person's `freeText` in `code`, fetched when the
 * language is picked and again when the text changes.
 */
export function useMedicalIdTranslation(
  code: LanguageCode,
  freeText: string[],
): MedicalIdTranslation {
  // One string standing for everything asked for, so the effect reruns when
  // either the language or the text changes, not on every new array.
  const request = JSON.stringify([code, freeText]);

  const [loaded, setLoaded] = useState<{ request: string; t: Translate }>({
    request: JSON.stringify(["en", []]),
    t: untranslated,
  });
  const [failed, setFailed] = useState<string | null>(null);

  // Asking again for something that failed before is a retry, so it starts as loading.
  const [requested, setRequested] = useState(request);
  if (requested !== request) {
    setRequested(request);
    setFailed(null);
  }

  useEffect(() => {
    let current = true;
    const [language, texts] = JSON.parse(request) as [LanguageCode, string[]];
    loadTranslation(language, texts).then(
      (t) => {
        if (current) setLoaded({ request, t });
      },
      () => {
        if (current) setFailed(request);
      },
    );
    return () => {
      current = false;
    };
  }, [request]);

  if (code === "en") return { shown: "en", t: untranslated, status: "ready" };
  if (loaded.request === request) return { shown: code, t: loaded.t, status: "ready" };
  if (failed === request) return { shown: "en", t: untranslated, status: "error" };
  return { shown: "en", t: untranslated, status: "loading" };
}
