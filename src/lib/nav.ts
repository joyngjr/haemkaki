import { BookOpen, CalendarDays, House, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  /** Set on "/" so it stops matching every other route. */
  end?: boolean;
};

/**
 * The routed tabs, split around the Quick Log button in the middle of the bar.
 *
 * This is the file to edit to rename a tab, reorder them, or move one across
 * the button. A new tab also needs a matching <Route> in `src/App.tsx` and a
 * folder under `src/pages/` named after its route segment, the way `tips/` is.
 *
 * Profile is not here: it opens the ProfileSheet rather than navigating, so
 * `BottomNav` renders it directly.
 */
export const NAV_LEFT: NavItem[] = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/tracker", label: "Tracker", Icon: CalendarDays },
];

export const NAV_RIGHT: NavItem[] = [{ to: "/tips", label: "Resources", Icon: BookOpen }];
