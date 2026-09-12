import type { Group } from "@/lib/community-store";

/** A group's coloured initial, standing in for an avatar. */
export function GroupIcon({ group, size = 40 }: { group: Group; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ background: group.color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {group.name.charAt(0).toUpperCase()}
    </div>
  );
}
