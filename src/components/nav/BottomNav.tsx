import { NavLink } from "react-router-dom";

import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav";

/**
 * Fixed tab bar along the bottom of every page.
 *
 * Sits at z-40 so the ProfileSheet (z-50) still covers it. To change which tabs
 * appear, edit `src/lib/nav.ts` rather than this file.
 */
export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-sand-100/95 backdrop-blur-sm"
    >
      <ul className="mx-auto flex max-w-md items-stretch gap-1 px-3 pb-[env(safe-area-inset-bottom)] pt-2">
        {NAV_ITEMS.map(({ to, label, Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              // `end` keeps "/" from matching /tracker and /tips too.
              end={to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex min-h-[56px] flex-col items-center justify-center gap-1 pb-2 pt-1",
                  "text-[11px] font-semibold transition-transform active:scale-95",
                  isActive ? "text-sand-900" : "text-sand-600",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* The highlight hugs the icon, not the whole third of the bar. */}
                  <span
                    className={cn(
                      "rounded-2xl px-5 py-1",
                      isActive ? "bg-sand-200 shadow-sm" : null,
                    )}
                  >
                    <Icon />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
