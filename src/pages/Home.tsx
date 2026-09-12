import { useState } from "react";

import { FactorScene } from "@/components/platelet/FactorScene";
import { ProfileButton } from "@/components/profile/ProfileButton";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
import type { Profile } from "@/lib/api";
import { useProfiles, type ProfileStatus } from "@/state/profile-context";

function greeting(now: Date): string {
  const hour = now.getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex-1 rounded-3xl bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-sand-600">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-tight text-sand-900">{value}</p>
      {note ? <p className="text-sm text-sand-600">{note}</p> : null}
    </div>
  );
}

function ProfileCard({ profile }: { profile: Profile }) {
  const now = new Date();
  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(now);
  const firstName = profile.name.trim().split(/\s+/)[0];

  return (
    <section className="relative -mt-9 rounded-[28px] bg-sand-100 p-5 shadow-lg">
      <div className="flex items-baseline justify-between gap-3">
        <h1 className="truncate text-2xl font-bold tracking-tight text-sand-900">
          {greeting(now)}, {firstName}
        </h1>
        <p className="shrink-0 text-sm text-sand-600">{date}</p>
      </div>

      <div className="mt-4 flex gap-3">
        <Stat
          label="Cover left"
          value={`${profile.days_cover}`}
          note={profile.days_cover === 1 ? "day" : "days"}
        />
        <Stat
          label="Product"
          value={`Factor ${profile.factor_type}`}
          note={`${profile.vials_on_hand} ${profile.vials_on_hand === 1 ? "vial" : "vials"} at home`}
        />
      </div>
    </section>
  );
}

/** Shown until there is a profile to render a den for. */
function EmptyCard({
  status,
  error,
  onAdd,
  onRetry,
}: {
  status: ProfileStatus;
  error: string | null;
  onAdd: () => void;
  onRetry: () => void;
}) {
  const failed = status === "error";
  return (
    <section className="relative -mt-9 rounded-[28px] bg-sand-100 p-5 text-center shadow-lg">
      <h1 className="text-2xl font-bold tracking-tight text-sand-900">
        {status === "loading"
          ? "Opening the den…"
          : failed
            ? "Can’t reach the API"
            : "Nobody here yet"}
      </h1>
      <p className="mt-1 text-sm text-sand-600">
        {status === "loading"
          ? "Fetching profiles from the API."
          : failed
            ? error
            : "Add a profile to start tracking factor and stock."}
      </p>
      {status === "loading" ? null : (
        <button
          type="button"
          onClick={failed ? onRetry : onAdd}
          className="mt-4 min-h-[48px] w-full rounded-2xl bg-sand-900 px-4 font-semibold text-sand-50"
        >
          {failed ? "Try again" : "Add a profile"}
        </button>
      )}
    </section>
  );
}

export function Home() {
  const { activeProfile, status, error, reload } = useProfiles();
  const [switcherOpen, setSwitcherOpen] = useState(false);

  return (
    <>
      <FactorScene
        // Somebody with no profile yet still gets a calm room to look at.
        dose={activeProfile?.dose_state ?? "covered"}
        stock={activeProfile?.stock_state ?? "wellStocked"}
        vialsOnHand={activeProfile?.vials_on_hand}
        action={<ProfileButton profile={activeProfile} onClick={() => setSwitcherOpen(true)} />}
        // Edge-to-edge on a phone; a floating card once there is room beside it.
        className="rounded-none rounded-b-[32px] sm:mt-6 sm:rounded-[32px]"
      />

      <div className="px-4">
        {activeProfile ? (
          <ProfileCard profile={activeProfile} />
        ) : (
          <EmptyCard
            status={status}
            error={error}
            onAdd={() => setSwitcherOpen(true)}
            onRetry={() => void reload()}
          />
        )}
      </div>

      <ProfileSheet open={switcherOpen} onClose={() => setSwitcherOpen(false)} />
    </>
  );
}
