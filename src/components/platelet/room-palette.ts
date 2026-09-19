/**
 * The room behind Kaki. Split out of the scene the way `kaki-palette` is split
 * out of the character, so the two can be re-tinted independently.
 *
 * Nothing here is an image file. The scene is inline SVG drawn from these
 * values, so "which picture do we show" is really "which palette do we pick",
 * and the answer comes from the profile the API returned.
 *
 * One palette per severity rather than per state: the room reacts to whichever
 * axis is more urgent, so a low dose and a low shelf never tint it in opposite
 * directions.
 */

import type { DoseState, StockState } from "@/components/platelet/Platelet";

export type Severity = 0 | 1 | 2;

export const DOSE_SEVERITY: Record<DoseState, Severity> = { covered: 0, low: 1, veryLow: 2 };
export const STOCK_SEVERITY: Record<StockState, Severity> = {
  wellStocked: 0,
  moderate: 1,
  low: 2,
};

export function roomSeverity(dose: DoseState, stock: StockState): Severity {
  return Math.max(DOSE_SEVERITY[dose], STOCK_SEVERITY[stock]) as Severity;
}

export interface RoomPalette {
  wallTop: string;
  wallBottom: string;
  floor: string;
  wood: string;
  plant: string;
  light: string;
  text: string;
}

/**
 * Severity 0 is the warm room the landing page already had. 1 sits roughly 45%
 * of the way to 2 on every channel, so the room reads as one palette dimming
 * rather than three unrelated colour schemes.
 */
export const ROOM_PALETTE: Record<Severity, RoomPalette> = {
  0: {
    wallTop: "#FDF4DE",
    wallBottom: "#EAD2A4",
    floor: "#C7A679",
    wood: "#AF8C61",
    plant: "#849B82",
    light: "#FFF3D0",
    text: "#3B2E20",
  },
  1: {
    wallTop: "#F6EEE3",
    wallBottom: "#DECBB5",
    floor: "#B69C87",
    wood: "#9D826F",
    plant: "#819185",
    light: "#FAF2E0",
    text: "#433229",
  },
  2: {
    wallTop: "#EEE7EA",
    wallBottom: "#D0C3CA",
    floor: "#A28F99",
    wood: "#88757F",
    plant: "#7E8489",
    light: "#F7F1F4",
    text: "#3B2E35",
  },
};
