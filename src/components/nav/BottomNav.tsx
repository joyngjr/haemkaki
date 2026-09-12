import { CircleUserRound } from "lucide-react";
import { NavLink } from "react-router-dom";
import type { RefObject } from "react";

import { Kaki } from "@/components/platelet/Kaki";
import { NAV_LEFT, NAV_RIGHT, type NavItem } from "@/lib/nav";
import { INK_MUTED } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * Fixed tab bar along the bottom of every page.
 *
 * Five slots, with Kaki raised out of the middle one as the Quick Log button.
 * Sits at z-40 so the sheets (z-50) still cover it. To change which tabs
 * appear, edit `src/lib/nav.ts` rather than this file.
 */

const SLOT_CLASS =
  "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[11px]";

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

export function BottomNav({
  onOpenQuickLog,
  onOpenProfile,
  quickLogButtonRef,
}: {
  onOpenQuickLog: () => void;
  onOpenProfile: () => void;
  quickLogButtonRef?: RefObject<HTMLButtonElement>;
}) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand-200 bg-sand-100/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm"
    >
      <div className="mx-auto grid h-[72px] max-w-md grid-cols-5 items-end px-1">
        {NAV_LEFT.map((item) => (
          <NavTab key={item.to} item={item} />
        ))}

        {/* Kaki is raised out of the bar, so the slot keeps the bar's height and
            the circle overhangs it. No floating label above the circle — it
            would sit over page content, which scrolls behind the bar. */}
        <div className="relative flex h-[72px] items-end justify-center">
          <button
            ref={quickLogButtonRef}
            type="button"
            onClick={onOpenQuickLog}
            aria-label="Open Quick Log actions"
            className="relative flex h-[72px] w-full flex-col items-center gap-0.5 px-0 text-[11px] font-semibold text-sand-900"
          >
            <span className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full border-4 border-sand-100 bg-sand-50 shadow-[0_6px_16px_rgba(59,46,32,0.18)]">
              <Kaki state="covered" className="h-16 w-16" />
            </span>
            <span className="mt-auto pb-1">Quick log</span>
          </button>
        </div>

        {NAV_RIGHT.map((item) => (
          <NavTab key={item.to} item={item} />
        ))}

        {/* Profile opens the switcher sheet over the current page, so it is a
            button rather than a tab and never shows an active state. */}
        <button type="button" onClick={onOpenProfile} className={cn(SLOT_CLASS, INK_MUTED)}>
          <CircleUserRound className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
}
