import { BookOpen, CalendarDays, House, type LucideIcon } from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  Icon: LucideIcon;
  /** Set on "/" so it stops matching every other route. */
  end?: boolean;
};

/** The complete set of routed destinations in the shared bottom navigation. */
export const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Home", Icon: House, end: true },
  { to: "/tracker", label: "Tracker", Icon: CalendarDays },
  { to: "/tips", label: "Resources", Icon: BookOpen },
];
