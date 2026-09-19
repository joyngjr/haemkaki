import { CircleUserRound } from "lucide-react";
import { useState } from "react";

import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
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
 */
export function ProfileButton({ className }: { className?: string }) {
  const { activeProfile } = useProfiles();
  const [open, setOpen] = useState(false);

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
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sand-600 shadow-sm ring-1 ring-black/10 transition-colors hover:bg-sand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500",
          className,
        )}
      >
        {activeProfile ? (
          <ProfileAvatar profile={activeProfile} className="h-7 w-7 text-[11px]" />
        ) : (
          <CircleUserRound className="h-6 w-6" aria-hidden="true" />
        )}
      </button>
      <ProfileSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
