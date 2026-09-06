import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import type { Profile } from "@/lib/api";

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6 text-sand-700" aria-hidden="true">
      <circle cx="12" cy="12" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="9.75" r="3" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6.3 19.2a6 6 0 0 1 11.4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Docked in the top-right of the scene. Opens the profile switcher. */
export function ProfileButton({
  profile,
  onClick,
}: {
  profile: Profile | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-label={profile ? `Profile: ${profile.name}. Switch profile` : "Choose a profile"}
      className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-transform active:scale-95"
    >
      {profile ? <ProfileAvatar profile={profile} className="h-10 w-10 text-sm" /> : <PersonIcon />}
    </button>
  );
}
