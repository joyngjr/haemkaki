import { avatarColor, initials } from "@/components/profile/avatar";
import type { Profile } from "@/lib/api";
import { cn } from "@/lib/utils";

export function ProfileAvatar({
  profile,
  size = "md",
  className,
}: {
  profile: Profile;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white",
        size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-base",
        className,
      )}
      style={{ backgroundColor: avatarColor(profile) }}
    >
      {initials(profile.name)}
    </span>
  );
}
