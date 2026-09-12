import type { Group } from "@/lib/community-store";

/** The row of group filters above the feed. `null` means "All". */
export function TopicChips({
  groups,
  selectedGroupId,
  onSelect,
}: {
  groups: Group[];
  selectedGroupId: string | null;
  onSelect: (groupId: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(null)}
        className={
          "rounded-full px-3 py-1.5 text-xs font-semibold " +
          (selectedGroupId === null ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600")
        }
      >
        All
      </button>
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onSelect(group.id)}
          className={
            "rounded-full px-3 py-1.5 text-xs font-semibold " +
            (selectedGroupId === group.id ? "text-white" : "text-gray-700")
          }
          style={{
            background: selectedGroupId === group.id ? group.color : group.color + "22",
          }}
        >
          {group.name}
        </button>
      ))}
    </div>
  );
}
