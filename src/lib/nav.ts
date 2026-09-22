import { BookOpen, CalendarDays, House, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  /** Set on "/" so it stops matching every other route. */
  end?: boolean;
};

/**
 * The phone's tabs. From `lg` there are none — everything is on one page — so
 * the tab bar is the only thing that reads this. Supply lives inside the
 * tracker, so it is not a destination of its own.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/tracker", label: "Tracker", Icon: CalendarDays },
  { to: "/tips", label: "Resources", Icon: BookOpen },
];
