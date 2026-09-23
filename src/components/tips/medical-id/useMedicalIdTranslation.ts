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

/** The card's copy in `code`, fetched when it is picked. */
export function useMedicalIdTranslation(code: LanguageCode): MedicalIdTranslation {
  const [loaded, setLoaded] = useState<{ code: LanguageCode; t: Translate }>({
    code: "en",
    t: untranslated,
  });
  const [failed, setFailed] = useState<LanguageCode | null>(null);

  // Picking a language that failed before is a retry, so it starts as loading.
  const [requested, setRequested] = useState(code);
  if (requested !== code) {
    setRequested(code);
    setFailed(null);
  }

  useEffect(() => {
    let current = true;
    loadTranslation(code).then(
      (t) => {
        if (current) setLoaded({ code, t });
      },
      () => {
        if (current) setFailed(code);
      },
    );
    return () => {
      current = false;
    };
  }, [code]);

  if (loaded.code === code) return { shown: code, t: loaded.t, status: "ready" };
  if (failed === code) return { shown: "en", t: untranslated, status: "error" };
  return { shown: "en", t: untranslated, status: "loading" };
}
