import { useState } from "react";

import { fromKey } from "@/lib/tracker-dates";
import { chargedVials, type DoseAmount, type TrackerEntry } from "@/lib/tracker-entries";

import { Sheet, SheetOption } from "./Sheet";
import { BleedDropIcon } from "./TrackerIcons";

export type UseType = "prophylaxis" | "on-demand" | "follow-up" | "makeup";

/** The entry this sheet hands back, before the ledger gives it an id. */
export type FactorUse =
  | { kind: "prophylaxis"; vials?: number }
  | { kind: "on-demand"; vials: number }
  | { kind: "follow-up"; vials: number }
  | { kind: "makeup"; missedDateKey: string; amount: DoseAmount };

/** The day's factor use, when one is already logged. */
export type SavedUse = Extract<TrackerEntry, { kind: UseType }>;

const TYPES: { value: UseType; title: string }[] = [
  { value: "prophylaxis", title: "Regular prophylaxis use" },
  { value: "on-demand", title: "On-demand use" },
  { value: "follow-up", title: "Follow-up use after a bleed" },
  { value: "makeup", title: "Missed dose taken late" },
];

/** The API caps a vial count at 99. */
const VIALS_MAX = 99;

function dayLabel(dateKey: string) {
  return fromKey(dateKey).toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * What the stepper opens on: the size already logged when this is an edit,
 * otherwise the routine's dose.
 *
 * `custom` is whether that number is the user's own rather than the routine's.
 * It is what decides, for the two kinds that may defer to the schedule, between
 * sending an explicit count and sending none — a dose left at the routine size
 * must stay routine-sized, so that changing the routine later still moves it.
 */
function initialAmount(saved: SavedUse | undefined, routineVials: number | undefined) {
  const routine = { vials: routineVials ?? 1, custom: routineVials === undefined };
  if (!saved) return routine;
  switch (saved.kind) {
    case "prophylaxis":
      if (saved.vials) return { vials: saved.vials, custom: true };
      return { vials: chargedVials(saved) ?? routine.vials, custom: false };
    case "on-demand":
    case "follow-up":
      return { vials: saved.vials, custom: true };
    case "makeup":
      if (saved.amount.source === "custom") return { vials: saved.amount.vials, custom: true };
      return { vials: chargedVials(saved) ?? routine.vials, custom: false };
  }
}

/**
 * Recording an injection: one sheet holding the kind of use, the vial count,
 * and — for a dose taken late — the day it was owed for.
 *
 * All three used to be steps of their own, so the commonest entry in the app
 * cost four taps across three stacked sheets. They are one sheet now: the kind
 * is pre-picked (what the day already holds, else prophylaxis), the count is
 * pre-filled from the routine, and a dose that matches the routine is a single
 * tap on Track. Everything is still editable before saving, and reopening an
 * entry from Edit lands on it with its own values in place.
 *
 * "Missed dose" is a kind of use like the others, not a wizard of its own: the
 * day being logged is the day it was taken, and the extra question is which
 * planned day it was owed for. Only days that are actually missed — planned,
 * past, and with nothing logged on them — are offered, which is what keeps one
 * dose from being charged both on its planned day and again here.
 */
export function FactorUseFlow({
  saved,
  routineVials,
  missedDays,
  onSave,
  onBack,
  onClose,
}: {
  /** The factor use already on this day, if any. The tracker allows only one. */
  saved: SavedUse | undefined;
  /** The routine's dose size, which seeds the count. Undefined with no routine. */
  routineVials: number | undefined;
  /** Planned days with no dose on them, newest first, that this date can make up for. */
  missedDays: string[];
  onSave: (use: FactorUse) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<UseType>(saved?.kind ?? "prophylaxis");
  const [amount, setAmount] = useState(() => initialAmount(saved, routineVials));
  // The most recent miss is nearly always the one meant, so it is pre-picked.
  const [makeupDay, setMakeupDay] = useState<string | null>(
    (saved?.kind === "makeup" ? saved.missedDateKey : null) ?? missedDays[0] ?? null,
  );

  const step = (by: number) =>
    setAmount((current) => ({
      vials: Math.min(VIALS_MAX, Math.max(1, current.vials + by)),
      custom: true,
    }));

  const save = () => {
    if (type === "on-demand" || type === "follow-up")
      return onSave({ kind: type, vials: amount.vials });
    if (type === "prophylaxis")
      return onSave({ kind: "prophylaxis", ...(amount.custom ? { vials: amount.vials } : {}) });
    if (!makeupDay) return;
    onSave({
      kind: "makeup",
      missedDateKey: makeupDay,
      amount: amount.custom ? { source: "custom", vials: amount.vials } : { source: "routine" },
    });
  };

  const noDayToMakeUp = type === "makeup" && !makeupDay;

  return (
    <Sheet
      tier="action"
      eyebrow="Factor Use"
      title="What kind of use?"
      onBack={onBack}
      backLabel="Back to date actions"
      onClose={onClose}
      closeLabel="Close all pop-ups"
    >
      <div className="mt-6 space-y-2.5">
        {TYPES.map(({ value, title }) => (
          <SheetOption
            key={value}
            title={title}
            pressed={type === value}
            onClick={() => setType(value)}
            trailing={
              value === "on-demand" ? (
                <BleedDropIcon
                  className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#A63A2E]"
                  label="Bleed indicator"
                />
              ) : undefined
            }
          />
        ))}
      </div>

      {type === "makeup" ? (
        missedDays.length ? (
          <div className="mt-4">
            <p className="text-sm font-bold text-[#242A2F]">Dose was for</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missedDays.map((dateKey) => (
                <button
                  key={dateKey}
                  onClick={() => setMakeupDay(dateKey)}
                  aria-pressed={dateKey === makeupDay}
                  style={dateKey === makeupDay ? { boxShadow: "0 0 0 2px #2C7A70" } : undefined}
                  className="min-h-11 rounded-full border border-[#E7E5E0] bg-[#F7F6F3] px-4 py-2 text-xs font-bold text-[#242A2F] transition"
                >
                  {dayLabel(dateKey)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-4 text-sm text-[#5C646C]">
            No missed doses in the week before this day. A dose taken on its own day is a regular
            prophylaxis use.
          </p>
        )
      ) : null}

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-3 pl-4">
        <div>
          <p className="text-sm font-bold text-[#242A2F]">Vials used</p>
          {!amount.custom ? (
            <p className="mt-0.5 text-xs text-[#5C646C]">Regular prophylaxis amount</p>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <StepButton label="One vial fewer" disabled={amount.vials <= 1} onClick={() => step(-1)}>
            −
          </StepButton>
          <span className="w-9 text-center font-mono text-2xl font-semibold text-ink">
            {amount.vials}
          </span>
          <StepButton
            label="One vial more"
            disabled={amount.vials >= VIALS_MAX}
            onClick={() => step(1)}
          >
            +
          </StepButton>
        </div>
      </div>

      <button
        disabled={noDayToMakeUp}
        onClick={save}
        className="mt-4 w-full rounded-xl bg-[#274A63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#274A63] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Track
      </button>
    </Sheet>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid h-11 w-11 place-items-center rounded-xl bg-[#FFFFFF] text-lg font-bold text-[#242A2F] transition disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
