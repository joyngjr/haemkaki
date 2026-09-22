import type { Occurrence } from "@/lib/api";

import { Sheet } from "./Sheet";
import { MoveIcon, PlusIcon, SyringeIcon } from "./TrackerIcons";
import { ConfusedPlatelet } from "./TrackerMascots";

/** Which of the day's flows is open, if any. */
export type DayFlow = "refill" | "use" | "move";

type DayActionsSheetProps = {
  date: Date;
  isFuture: boolean;
  /** The dose the routine plans for this day, if any. */
  planned: Occurrence | undefined;
  /** A planned dose can be moved until the day holds a factor use. */
  canMovePlanned: boolean;
  activeFlow: DayFlow | null;
  onPick: (flow: DayFlow) => void;
  onClose: () => void;
};

/** The first sheet a date opens: what happened on this day? */
export function DayActionsSheet({
  date,
  isFuture,
  planned,
  canMovePlanned,
  activeFlow,
  onPick,
  onClose,
}: DayActionsSheetProps) {
  const moveRow =
    planned && canMovePlanned ? (
      <ActionRow
        title="Move planned dose"
        icon={<MoveIcon className="h-6 w-6" />}
        iconClass="bg-[#2C7A70]/25 text-[#242A2F]"
        pressed={activeFlow === "move"}
        ringColor="#274A63"
        onClick={() => onPick("move")}
      />
    ) : null;

  return (
    <Sheet
      tier="day"
      eyebrow={date.toLocaleDateString("en-SG", { weekday: "long" })}
      title={date.toLocaleDateString("en-SG", { day: "numeric", month: "long" })}
      onClose={onClose}
      closeLabel="Close date details"
      aside={isFuture && !planned ? <ConfusedPlatelet className="h-14 w-14 shrink-0" /> : undefined}
    >
      {isFuture ? (
        <div className="mt-6 space-y-3">
          <p className="rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-4 text-sm text-[#5C646C]">
            {planned ? "A dose is planned for this day." : "This day hasn't happened yet."}
          </p>
          {moveRow}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          <ActionRow
            title="Factor Refill"
            icon={<PlusIcon className="h-6 w-6" />}
            iconClass="bg-[#D9D6CF]/35 text-[#274A63]"
            pressed={activeFlow === "refill"}
            ringColor="#274A63"
            onClick={() => onPick("refill")}
          />
          <ActionRow
            title="Factor Use"
            icon={<SyringeIcon className="h-6 w-6" />}
            iconClass="bg-[#2C7A70]/25 text-[#242A2F]"
            pressed={activeFlow === "use"}
            dot="bg-[#2C7A70]"
            onClick={() => onPick("use")}
          />
          {moveRow}
        </div>
      )}
    </Sheet>
  );
}

function ActionRow({
  title,
  description,
  icon,
  iconClass,
  pressed,
  ringColor,
  dot,
  onClick,
}: {
  title: string;
  description?: string;
  icon: React.ReactNode;
  iconClass: string;
  pressed: boolean;
  /** Only Factor Refill shows a selected ring; the other two read as a dot. */
  ringColor?: string;
  dot?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={pressed}
      style={pressed && ringColor ? { boxShadow: `0 0 0 2px ${ringColor}` } : undefined}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-4 text-left transition hover:bg-[#F7F6F3]"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-[#242A2F]">{title}</span>
        {description ? (
          <span className="mt-1 block text-xs text-[#5C646C]">{description}</span>
        ) : null}
      </span>
      {dot ? <i className={`h-2.5 w-2.5 rounded-full ${dot}`} /> : null}
    </button>
  );
}
