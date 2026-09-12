import { Sheet } from "./Sheet";
import { PlusIcon, SyringeIcon, WarningIcon } from "./TrackerIcons";
import { ConfusedPlatelet } from "./TrackerMascots";

/** Which of the day's logging flows is open, if any. */
export type DayFlow = "refill" | "use" | "missed";

type DayActionsSheetProps = {
  date: Date;
  isFuture: boolean;
  activeFlow: DayFlow | null;
  onPick: (flow: DayFlow) => void;
  onClose: () => void;
};

/** The first sheet a date opens: what happened on this day? */
export function DayActionsSheet({
  date,
  isFuture,
  activeFlow,
  onPick,
  onClose,
}: DayActionsSheetProps) {
  return (
    <Sheet
      tier="day"
      eyebrow={date.toLocaleDateString("en-US", { weekday: "long" })}
      title={date.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
      onClose={onClose}
      closeLabel="Close date details"
      aside={isFuture ? <ConfusedPlatelet className="h-14 w-14 shrink-0" /> : undefined}
    >
      {isFuture ? (
        <p className="mt-6 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-sm leading-loose text-[#806d51]">
          Oops! This date hasn't happened yet, so it can't be logged. If a dose is planned for this
          day, you'll see it marked on your calendar.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          <ActionRow
            title="Factor Refill"
            description="Add new vials to your supply"
            icon={<PlusIcon className="h-6 w-6" />}
            iconClass="bg-[#d8c3a0]/35 text-[#80633e]"
            pressed={activeFlow === "refill"}
            ringColor="#a98559"
            onClick={() => onPick("refill")}
          />
          <ActionRow
            title="Factor Use"
            description="Record an injection"
            icon={<SyringeIcon className="h-6 w-6" />}
            iconClass="bg-[#8df5c0]/25 text-[#3b281c]"
            pressed={activeFlow === "use"}
            dot="bg-[#8df5c0]"
            onClick={() => onPick("use")}
          />
          <ActionRow
            title="Missed Dose"
            description="Mark a dose that was missed"
            icon={<WarningIcon className="h-6 w-6" />}
            iconClass="bg-[#ffcc4d]/35 text-[#b8860b]"
            pressed={activeFlow === "missed"}
            dot="bg-[#ffcc4d]"
            onClick={() => onPick("missed")}
          />
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
  description: string;
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
      className="flex w-full items-center gap-3 rounded-2xl border border-[#eee5d5] bg-[#f8f0e2] p-4 text-left transition hover:bg-[#f4ead8]"
    >
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconClass}`}>
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-[#443229]">{title}</span>
        <span className="mt-1 block text-xs text-[#806d51]">{description}</span>
      </span>
      {dot ? <i className={`h-2.5 w-2.5 rounded-full ${dot}`} /> : null}
    </button>
  );
}
