import { useState } from "react";

import { daysFrom, toKey } from "@/lib/tracker-dates";
import type { DoseAmount } from "@/lib/tracker-entries";

import { NumberPad } from "./NumberPad";
import { Sheet, SheetOption } from "./Sheet";

/**
 * The missed-dose wizard: was it taken or skipped, when was it made up, and
 * how much was used.
 *
 * Each answer is committed as it is given — the entry exists from the moment
 * the flow opens and is refined step by step — so backing out of a later step
 * leaves the earlier answers recorded.
 */
export function MissedDoseFlow({
  missedDate,
  onSkip,
  onTaken,
  onTakenDate,
  onAmount,
  onBack,
  onClose,
}: {
  missedDate: Date;
  onSkip: () => void;
  onTaken: () => void;
  onTakenDate: (date: Date) => void;
  onAmount: (amount: DoseAmount) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<"taken" | null>(null);
  const [takenDate, setTakenDate] = useState<Date | null>(null);
  const [enteringVials, setEnteringVials] = useState(false);
  const [vialCount, setVialCount] = useState("");

  if (answer === "taken" && takenDate && enteringVials) {
    return (
      <Sheet
        tier="picker"
        offset="mid"
        eyebrow="Missed Dose"
        title="How many vials used?"
        onBack={() => {
          setEnteringVials(false);
          setVialCount("");
        }}
        backLabel="Back to vial type"
        onClose={onClose}
        closeLabel="Close all pop-ups"
      >
        <NumberPad
          value={vialCount}
          onChange={setVialCount}
          confirmLabel="Track"
          onConfirm={() => onAmount({ source: "custom", vials: Number(vialCount) })}
        />
      </Sheet>
    );
  }

  if (answer === "taken" && takenDate) {
    return (
      <Sheet
        tier="picker"
        offset="low"
        eyebrow="Missed Dose"
        title="How many vials used?"
        onBack={() => setTakenDate(null)}
        backLabel="Back to missed-dose date"
        onClose={onClose}
        closeLabel="Close all pop-ups"
      >
        <div className="mt-6 space-y-3">
          <SheetOption
            title="Regular prophylaxis amount"
            onClick={() => onAmount({ source: "routine" })}
          />
          <SheetOption title="Custom" ringColor="#A63A2E" onClick={() => setEnteringVials(true)} />
        </div>
      </Sheet>
    );
  }

  if (answer === "taken") {
    // A dose is made up within the week; anything later is a new dose entirely.
    const week = daysFrom(missedDate, 7);
    const startMonth = week[0].toLocaleDateString("en-SG", { month: "long" });
    const endMonth = week[6].toLocaleDateString("en-SG", { month: "long" });
    const monthLabel =
      startMonth === endMonth
        ? `${startMonth} ${week[6].getFullYear()}`
        : `${startMonth} – ${endMonth} ${week[6].getFullYear()}`;

    return (
      <Sheet
        tier="picker"
        offset="low"
        eyebrow="Missed Dose"
        title="When did you take the missed dose?"
        onBack={() => setAnswer(null)}
        backLabel="Back to missed-dose options"
        onClose={onClose}
        closeLabel="Close all pop-ups"
      >
        <p className="mt-3 text-sm font-bold text-[#242A2F]">{monthLabel}</p>
        <div className="mt-5 grid grid-cols-7 gap-1.5">
          {week.map((date) => (
            <button
              key={toKey(date)}
              onClick={() => {
                setTakenDate(date);
                onTakenDate(date);
              }}
              className="flex h-16 flex-col items-center justify-center rounded-xl border border-[#E7E5E0] bg-[#F7F6F3] text-[#242A2F] transition hover:bg-[#F7F6F3]"
            >
              <span className="text-[10px] font-bold uppercase text-[#5C646C]">
                {date.toLocaleDateString("en-SG", { weekday: "narrow" })}
              </span>
              <span className="mt-1 text-sm font-bold">{date.getDate()}</span>
            </button>
          ))}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      tier="action"
      eyebrow="Missed Dose"
      title="Was the missed dose taken or skipped?"
      onBack={onBack}
      backLabel="Back to date actions"
      onClose={onClose}
      closeLabel="Close all pop-ups"
    >
      <div className="mt-6 space-y-3">
        <PlainOption
          label="Taken"
          onClick={() => {
            setAnswer("taken");
            onTaken();
          }}
        />
        <PlainOption label="Skipped" onClick={onSkip} />
      </div>
    </Sheet>
  );
}

function PlainOption({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-4 text-left text-sm font-bold text-[#242A2F] transition hover:bg-[#F7F6F3]"
    >
      {label}
    </button>
  );
}
