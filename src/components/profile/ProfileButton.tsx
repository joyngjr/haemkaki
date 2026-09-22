import { CircleUserRound } from "lucide-react";
import { useState } from "react";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

/**
 * The profile switcher, as a round button that opens the sheet over whatever
 * page it sits on.
 *
 * It owns its own open state and renders its own sheet, so a page adds the
 * switcher by dropping this in its header — no state to thread through, and no
 * route can accidentally ship without it. Every top-level page header has one:
 * the switcher used to live in the tab bar, and losing it on a route means
 * losing the only way to change who the app is showing.
 *
 * The button carries the active profile's own circle — the same initials and
 * colour the switcher lists them with — so it says who the app is currently
 * on. The generic icon is the fallback for the states with nobody to show:
 * still loading, API unreachable, no profiles.
 *
 * `pill` adds the name beside the circle, for the desktop top bar's corner.
 */
export function ProfileButton({
  className,
  variant = "icon",
}: {
  className?: string;
  variant?: "icon" | "pill";
}) {
  const { activeProfile } = useProfiles();
  const [open, setOpen] = useState(false);
  const pill = variant === "pill";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={
          activeProfile ? `Profile: ${activeProfile.name}. Switch profile` : "Choose a profile"
        }
        className={cn(
          "flex h-11 shrink-0 items-center rounded-full transition-colors",
          pill
            ? "max-w-[240px] gap-2.5 border border-line bg-card pl-1.5 pr-4 text-[14.5px] font-medium text-ink-strong hover:bg-soft"
            : "w-11 justify-center bg-slate-100 text-slate-600 hover:bg-rail",
          FOCUS_RING,
          className,
        )}
      >
        {activeProfile ? (
          <ProfileAvatar
            profile={activeProfile}
            className={pill ? "h-8 w-8 text-xs" : "h-7 w-7 text-[11px]"}
          />
        ) : (
          <CircleUserRound
            className={cn("h-6 w-6", pill && "ml-1 text-slate-600")}
            aria-hidden="true"
          />
        )}
        {pill ? <span className="truncate">{activeProfile?.name ?? "Profiles"}</span> : null}
      </button>
      <ProfileSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
