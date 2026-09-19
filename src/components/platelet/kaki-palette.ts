/** Kaki's colours and bob timing. Split out of Kaki.tsx so it hot-reloads. */

import type { DoseState } from "@/components/platelet/Platelet";

export interface KakiPalette {
  body: string;
  blush: string;
  ink: string;
}

/** Warm coral -> softer dusty pink -> muted mauve. Never red. */
export const KAKI_PALETTE: Record<DoseState, KakiPalette> = {
  covered: { body: "#FF7B93", blush: "#FF4766", ink: "#2D3748" },
  low: { body: "#DFA2B0", blush: "#C87F92", ink: "#3B3A46" },
  veryLow: { body: "#B78D9E", blush: "#9C7488", ink: "#463F49" },
};

/** Bob duration per state — calmer as protection tapers. */
export const KAKI_BOB_DURATION: Record<DoseState, string> = {
  covered: "5s",
  low: "7.5s",
  veryLow: "11s",
};
