/** Kaki's colours and bob timing. Split out of Kaki.tsx so it hot-reloads. */

import type { DoseState } from "@/components/platelet/Platelet";

export interface KakiPalette {
  body: string;
  blush: string;
  ink: string;
}

/** Garnet -> softer clay -> muted stone, as the kit draws the mascot. */
export const KAKI_PALETTE: Record<DoseState, KakiPalette> = {
  covered: { body: "#B34A42", blush: "#9B3A33", ink: "#2B1210" },
  low: { body: "#C2716B", blush: "#A85F58", ink: "#3A1D1A" },
  veryLow: { body: "#AE9B98", blush: "#8E7A77", ink: "#4A3C3A" },
};

/** Bob duration per state — calmer as protection tapers. */
export const KAKI_BOB_DURATION: Record<DoseState, string> = {
  covered: "5s",
  low: "7.5s",
  veryLow: "11s",
};
