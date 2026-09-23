import type { DoseState } from "@/components/platelet/Platelet";

/**
 * The two axes the status scene is drawn along. They are deliberately
 * independent: you can be perfectly on schedule and still have nothing left to
 * take, and the scene should say both at once.
 */

/** How the *schedule* is going — shapes Kaki and the shield bubble. */
export type Coverage = "ok" | "low" | "none";

/**
 * How the *cupboard* is doing — furnishes the room. The status card picks it
 * from the same reading as its own status word, so the room and the words
 * always agree about running low.
 */
export type Supply = "stocked" | "low" | "empty";

/**
 * The wall colour of the room `StatusScene` draws for each supply state. The
 * status card paints it across the whole card from `lg`, so the room runs on
 * behind its panel.
 */
export const SCENE_WALL: Record<Supply, string> = {
  stocked: "#EFEBE1",
  low: "#E9E6DE",
  empty: "#E2E3E6",
};

/** Kaki's own dose state maps straight onto coverage. */
export function coverageFromDose(dose: DoseState): Coverage {
  return dose === "covered" ? "ok" : dose === "low" ? "low" : "none";
}
