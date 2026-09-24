import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

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
  const diagnosis = profile.clinical_profile?.diagnosis;
  const label =
    diagnosis === "factor_xi_deficiency"
      ? "Factor XI"
      : diagnosis === "acquired_haemophilia"
        ? "Acquired haemophilia"
        : diagnosis === "other_or_unknown"
          ? "Care plan"
          : `Factor ${profile.factor_type}`;
  return `${label} · ${days} ${days === 1 ? "day" : "days"} cover`;
}

function ProfileRow({
  profile,
  active,
  onSelect,
  onEdit,
  onDelete,
}: {
  profile: Profile;
  active: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-1 rounded-3xl p-2 transition-colors",
        active ? "bg-white shadow-sm ring-1 ring-sand-200" : "bg-sand-100 active:bg-sand-200",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className="flex min-h-[56px] min-w-0 flex-1 items-center gap-3 rounded-2xl p-1 text-left"
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
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${profile.name}'s profile`}
        className="min-h-[44px] shrink-0 rounded-full px-3 text-sm font-bold text-teal-800 active:bg-teal-50"
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`Delete ${profile.name}'s profile`}
        className="min-h-[44px] shrink-0 rounded-full px-2 text-sm font-bold text-rose-700 active:bg-rose-50"
      >
        Delete
      </button>
    </div>
  );
}

function DeleteProfileConfirmation({
  profile,
  onCancel,
  onDeleted,
}: {
  profile: Profile;
  onCancel: () => void;
  onDeleted: () => void;
}) {
  const { deleteProfile } = useProfiles();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function confirmDelete() {
    if (deleting) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteProfile(profile.id);
      onDeleted();
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : "Could not delete the profile");
      setDeleting(false);
    }
  }

  return (
    <section aria-labelledby="delete-profile-title" className="pb-1">
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-2xl font-bold text-rose-700"
      >
        !
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.16em] text-rose-700">
        Delete profile
      </p>
      <h2
        id="delete-profile-title"
        className="mt-1 text-2xl font-bold tracking-tight text-sand-900"
      >
        Delete {profile.name}’s profile?
      </h2>
      <div className="mt-5 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
        <p className="font-bold">This action cannot be undone.</p>
        <p className="mt-1">
          Their personal details, care plan, medication information, stock, and dose status will be
          permanently deleted.
        </p>
      </div>

      {deleteError ? (
        <p role="alert" className="mt-5 text-sm font-medium text-rose-700">
          {deleteError}
        </p>
      ) : null}

      <div className="mt-7 flex gap-3 border-t border-sand-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={deleting}
          className="min-h-[48px] flex-1 rounded-2xl border border-sand-300 bg-white px-4 text-sm font-bold text-sand-700 disabled:opacity-40"
        >
          Keep profile
        </button>
        <button
          type="button"
          onClick={() => void confirmDelete()}
          disabled={deleting}
          className="min-h-[48px] flex-1 rounded-2xl bg-rose-700 px-4 text-sm font-bold text-white disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "Delete profile"}
        </button>
      </div>
    </section>
  );
}

/**
 * Mounted only while the sheet is open, so it always opens on `startWith`
 * rather than on a half-filled form left over from last time.
 */
function Sheet({ onClose, startWith }: { onClose: () => void; startWith: "list" | "add" }) {
  const { profiles, activeProfile, status, error, selectProfile, reload } = useProfiles();
  const [view, setView] = useState<"list" | "add" | "edit" | "delete">(startWith);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<Profile | null>(null);

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
    // A sheet from the bottom on a phone; a centred dialog from `lg`, where it
    // opens from the account button in the top bar.
    <div className="fixed inset-0 z-50 flex flex-col justify-end lg:items-center lg:justify-center lg:p-6">
      <button
        type="button"
        aria-label="Close profile switcher"
        onClick={onClose}
        className="absolute inset-0 h-full w-full animate-fade-in bg-sand-900/40"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={view === "delete" ? "Confirm profile deletion" : "Choose a profile"}
        className="relative max-h-[88vh] animate-sheet-up overflow-y-auto rounded-t-[28px] bg-sand-50 px-5 pb-10 pt-3 shadow-2xl lg:w-full lg:max-w-lg lg:animate-fade-in lg:rounded-[28px] lg:px-7 lg:pb-7 lg:pt-7"
      >
        <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-sand-300 lg:hidden" />

        {view === "delete" && deletingProfile ? (
          <DeleteProfileConfirmation
            key={deletingProfile.id}
            profile={deletingProfile}
            onCancel={() => setView("list")}
            onDeleted={() => {
              setDeletingProfile(null);
              setView("list");
            }}
          />
        ) : view === "add" || view === "edit" ? (
          <AddProfileForm
            key={editingProfile?.id ?? "new"}
            profile={view === "edit" ? (editingProfile ?? undefined) : undefined}
            onDone={onClose}
            onCancel={() => setView("list")}
          />
        ) : (
          <>
            <h2 className="text-2xl font-bold tracking-tight text-sand-900">Who&rsquo;s here?</h2>

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
              <p className="mt-6 text-sm text-sand-600">No profiles yet.</p>
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
                  onEdit={() => {
                    setEditingProfile(profile);
                    setView("edit");
                  }}
                  onDelete={() => {
                    setDeletingProfile(profile);
                    setView("delete");
                  }}
                />
              ))}

              <button
                type="button"
                onClick={() => {
                  setEditingProfile(null);
                  setView("add");
                }}
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

export function ProfileSheet({
  open,
  onClose,
  startWith = "list",
}: {
  open: boolean;
  onClose: () => void;
  /** Open straight on the new-profile form, e.g. from an empty Home. */
  startWith?: "list" | "add";
}) {
  // Portalled to <body>: the switcher sits inside the desktop top bar, whose
  // backdrop blur would otherwise become the containing block for `fixed`
  // and squeeze the whole sheet into the bar.
  return open
    ? createPortal(<Sheet onClose={onClose} startWith={startWith} />, document.body)
    : null;
}
