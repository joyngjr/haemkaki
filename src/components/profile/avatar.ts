import type { Profile } from "@/lib/api";

/** Warm, high-contrast fills that sit inside the platelet's room palette. */
const AVATAR_COLORS = ["#C24A6B", "#2E7F8C", "#B07C22", "#6B6FC4", "#6F8C3F", "#A85539"];

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
