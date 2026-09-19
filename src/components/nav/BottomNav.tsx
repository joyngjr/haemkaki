import { NavLink } from "react-router-dom";

import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { INK_MUTED } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Fixed tab bar along the bottom of every page.
 *
 * Three equal-width routed tabs. To change which tabs appear, edit
 * `src/lib/nav.ts` rather than this file.
 */

const SLOT_CLASS =
  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500";

function NavTab({ item }: { item: NavItem }) {
  const { Icon } = item;
  return (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      className={({ isActive }) =>
        cn(SLOT_CLASS, isActive ? "font-semibold text-sand-900" : INK_MUTED)
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} aria-hidden="true" />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-sand-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="mx-auto grid min-h-[72px] max-w-md grid-cols-3 items-end px-1">
        {NAV_ITEMS.map((item) => (
          <NavTab key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}
