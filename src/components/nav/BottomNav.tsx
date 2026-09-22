import { NavLink } from "react-router-dom";

import { NAV_ITEMS, type NavItem } from "@/lib/nav";
import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Fixed tab bar along the bottom of every page, on phones and tablets only —
 * from `lg` everything is on one page and there are no tabs to switch.
 *
 * Three equal-width routed tabs. To change which tabs appear, edit
 * `src/lib/nav.ts` rather than this file.
 */

function NavTab({ item }: { item: NavItem }) {
  const { Icon } = item;
  return (
    <NavLink
      to={item.to}
      end={item.end ?? false}
      className={({ isActive }) =>
        cn(
          "flex h-[72px] min-w-0 flex-1 flex-col items-center justify-center gap-1.5 px-1",
          isActive ? "text-slate-600" : "text-ink-faint",
          FOCUS_RING,
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="h-[23px] w-[23px]" strokeWidth={1.8} aria-hidden="true" />
          <span className={cn("text-[11.5px]", isActive ? "font-semibold" : "font-medium")}>
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="mx-auto flex max-w-md">
        {NAV_ITEMS.map((item) => (
          <NavTab key={item.to} item={item} />
        ))}
      </div>
    </nav>
  );
}
