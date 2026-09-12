import { ChevronRight } from "@/components/ui/ChevronRight";
import type { Group } from "@/lib/community-store";

import { GroupIcon } from "./GroupIcon";

/** Every group, tapping one to jump to its filtered feed. */
export function GroupList({
  groups,
  onSelect,
}: {
  groups: Group[];
  onSelect: (groupId: string) => void;
}) {
  return (
    <div className="flex flex-col divide-y divide-gray-100 rounded-[20px] bg-white shadow-md">
      {groups.map((group) => (
        <button
          key={group.id}
          onClick={() => onSelect(group.id)}
          className="flex items-center gap-3 p-4 text-left"
        >
          <GroupIcon group={group} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900">{group.name}</p>
            <p className="text-xs text-gray-500">{group.memberCount.toLocaleString()} members</p>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </button>
      ))}
    </div>
  );
}
