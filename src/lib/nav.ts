import { HomeIcon, TipsIcon, TrackerIcon } from "@/components/nav/NavIcons";

/**
 * The bottom-tab bar, top to bottom in the order shown.
 *
 * This is the file to edit to rename a tab, reorder them, or add a fourth. A new
 * tab also needs a page in `src/pages/` and a matching <Route> in `src/App.tsx`.
 */
export const NAV_ITEMS = [
  { to: "/", label: "Home", Icon: HomeIcon },
  { to: "/tracker", label: "Tracker", Icon: TrackerIcon },
  { to: "/tips", label: "Tips", Icon: TipsIcon },
] as const;
