import { useEffect, useState } from "react";

import { AddProfileForm } from "@/components/profile/AddProfileForm";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { Profile } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
      <path
        d="M4.5 10.5 8 14l7.5-8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function summary(profile: Profile): string {
  const days = profile.days_cover;
  return `Factor ${profile.factor_type} · ${days} ${days === 1 ? "day" : "days"} cover`;
}

function ProfileRow({
  profile,
  active,
  onSelect,
}: {
  profile: Profile;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center gap-4 rounded-3xl p-3 text-left transition-colors",
        active ? "bg-white shadow-sm ring-1 ring-sand-200" : "bg-sand-100 active:bg-sand-200",
      )}
    >
      <ProfileAvatar profile={profile} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-lg font-semibold text-sand-900">{profile.name}</span>
        <span className="block truncate text-sm text-sand-600">{summary(profile)}</span>
      </span>
      {active ? (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
          <CheckIcon />
        </span>
      ) : null}
    </button>
  );
}

/**
 * Mounted only while the sheet is open, so it always opens on the list rather
 * than on a half-filled form left over from last time.
 */
function Sheet({ onClose }: { onClose: () => void }) {
  const { profiles, activeProfile, status, error, selectProfile, reload } = useProfiles();
  const [view, setView] = useState<"list" | "add">("list");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    // Stop the page behind the sheet from scrolling under a drag.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close profile switcher"
        onClick={onClose}
        className="absolute inset-0 h-full w-full animate-fade-in bg-sand-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose a profile"
        className="relative max-h-[88vh] animate-sheet-up overflow-y-auto rounded-t-[28px] bg-sand-50 px-5 pb-10 pt-3 shadow-2xl"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-sand-300" />

        {view === "add" ? (
          <AddProfileForm onDone={onClose} onCancel={() => setView("list")} />
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-sand-900">Who&rsquo;s here?</h2>
            <p className="mt-1 text-sm text-sand-600">
              Each profile has its own den, stock and log.
            </p>

            {status === "loading" ? (
              <p className="mt-6 text-sm text-sand-600">Loading profiles…</p>
            ) : null}

            {status === "error" ? (
              <div className="mt-6 rounded-3xl bg-rose-50 p-4">
                <p className="text-sm font-medium text-rose-800">{error}</p>
                <button
                  type="button"
                  onClick={() => void reload()}
                  className="mt-3 min-h-[44px] rounded-full bg-rose-700 px-5 text-sm font-semibold text-white"
                >
                  Try again
                </button>
              </div>
            ) : null}

            {status === "ready" && profiles.length === 0 ? (
              <p className="mt-6 text-sm text-sand-600">
                No profiles yet. Add the first one to open a den.
              </p>
            ) : null}

            <div className="mt-5 space-y-3">
              {profiles.map((profile) => (
                <ProfileRow
                  key={profile.id}
                  profile={profile}
                  active={profile.id === activeProfile?.id}
                  onSelect={() => {
                    selectProfile(profile.id);
                    onClose();
                  }}
                />
              ))}

              <button
                type="button"
                onClick={() => setView("add")}
                className="flex w-full items-center gap-4 rounded-3xl bg-sand-100 p-3 text-left active:bg-sand-200"
              >
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-2xl font-light text-sand-700"
                >
                  +
                </span>
                <span className="text-lg font-semibold text-teal-800">Add a profile</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function ProfileSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <Sheet onClose={onClose} /> : null;
}
