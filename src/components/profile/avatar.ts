import type { Profile } from "@/lib/api";

/**
 * Six fills that tell profiles apart without leaving the kit.
 *
 * All drawn from the same chroma and lightness band as the status tones, so a
 * household of avatars reads as one set and none of them outshouts a brick
 * alert. White initials clear 4.5:1 on every one.
 */
const AVATAR_COLORS = ["#274A63", "#2C7A70", "#8A5E14", "#A63A2E", "#3A5E76", "#4A6B3F"];

export function avatarColor(profile: Profile): string {
  // Keyed on id so a profile keeps its colour when the list is reordered.
  return AVATAR_COLORS[Math.abs(profile.id) % AVATAR_COLORS.length];
}

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters = words.length === 1 ? [words[0][0]] : [words[0][0], words[words.length - 1][0]];
  return letters.join("").toUpperCase();
}
