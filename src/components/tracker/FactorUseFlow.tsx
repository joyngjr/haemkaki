import { useState } from "react";

import type { BleedNature } from "@/lib/api";
import { fromKey } from "@/lib/tracker-dates";
import {
  BLEED_NATURE_LABEL,
  VIALS_DIGITS,
  chargedVials,
  type DoseAmount,
  type TrackerEntry,
} from "@/lib/tracker-entries";

import { Sheet } from "./Sheet";
import { BleedDropIcon, ChevronDownIcon } from "./TrackerIcons";

export type UseType = "prophylaxis" | "on-demand" | "follow-up" | "makeup";

/** The entry this sheet hands back, before the ledger gives it an id. */
export type FactorUse =
  | { kind: "prophylaxis"; vials?: number }
  | { kind: "on-demand"; vials: number; nature: BleedNature }
  | { kind: "follow-up"; vials: number }
  | { kind: "makeup"; missedDateKey: string; amount: DoseAmount };

const NATURES = Object.keys(BLEED_NATURE_LABEL) as BleedNature[];

/** The day's factor use, when one is already logged. */
export type SavedUse = Extract<TrackerEntry, { kind: UseType }>;

const TYPES: { value: UseType; title: string }[] = [
  { value: "prophylaxis", title: "Regular prophylaxis use" },
  { value: "on-demand", title: "On-demand use" },
  { value: "follow-up", title: "Follow-up use after a bleed" },
  { value: "makeup", title: "Missed dose taken late" },
];

function dayLabel(dateKey: string) {
  return fromKey(dateKey).toLocaleDateString("en-SG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * What the amount field opens on: the size already logged when this is an
 * edit, otherwise the routine's dose — or, with no routine, the usual dose
 * recorded on the profile, which then goes with the entry as its own size.
 *
 * `custom` is whether that number is the user's own rather than the routine's.
 * It is what decides, for the two kinds that may defer to the schedule, between
 * sending an explicit size and sending none — a dose left at the routine size
 * must stay routine-sized, so that changing the routine later still moves it.
 */
function initialAmount(
  saved: SavedUse | undefined,
  routineVials: number | undefined,
  usualVials: number | undefined,
) {
  const routine =
    routineVials === undefined
      ? { vials: usualVials ?? 0, custom: true }
      : { vials: routineVials, custom: false };
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
 * Recording an injection: one sheet holding the kind of use, the amount in vials,
 * and — for a dose taken late — the day it was owed for.
 *
 * All three used to be steps of their own, so the commonest entry in the app
 * cost four taps across three stacked sheets. They are one sheet now: the kind
 * is pre-picked (what the day already holds, else prophylaxis), the amount is
 * pre-filled from the routine, and a dose that matches the routine is a single
 * tap on Track. Everything is still editable before saving, and reopening an
 * entry from Edit lands on it with its own values in place.
 *
 * The kind is a native `<select>` rather than four stacked cards: the four are
 * fixed and mutually exclusive, so the phone's own picker is both shorter than
 * the sheet was and the control people already know. On-demand is the app's
 * marker for a treated bleed, so the drop moves to the field label when it is
 * the one chosen — an `<option>` cannot carry an icon.
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
  usualVials,
  missedDays,
  onSave,
  onBack,
  onClose,
}: {
  /** The factor use already on this day, if any. The tracker allows only one. */
  saved: SavedUse | undefined;
  /** The routine's dose size, which seeds the amount. Undefined with no routine. */
  routineVials: number | undefined;
  /** The regular dose recorded on the profile, in vials — what seeds the amount without a routine. */
  usualVials: number | undefined;
  /** Planned days with no dose on them, newest first, that this date can make up for. */
  missedDays: string[];
  onSave: (use: FactorUse) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [usageType, setUsageType] = useState<UseType>(saved?.kind ?? "prophylaxis");
  const [amount, setAmount] = useState(() => initialAmount(saved, routineVials, usualVials));
  // The most recent miss is nearly always the one meant, so it is pre-picked.
  const [makeupDay, setMakeupDay] = useState<string | null>(
    (saved?.kind === "makeup" ? saved.missedDateKey : null) ?? missedDays[0] ?? null,
  );
  // Asked for a bleed. Empty on an entry logged before the question existed.
  const [nature, setNature] = useState<BleedNature | null>(
    saved?.kind === "on-demand" ? (saved.nature ?? null) : null,
  );

  /** A typed amount is the user's own, even one that happens to match the routine. */
  const typeAmount = (raw: string) =>
    setAmount({ vials: Number(raw.replace(/[^0-9]/g, "").slice(0, VIALS_DIGITS)), custom: true });

  const save = () => {
    if (usageType === "on-demand") {
      if (!nature) return;
      return onSave({ kind: "on-demand", vials: amount.vials, nature });
    }
    if (usageType === "follow-up") return onSave({ kind: "follow-up", vials: amount.vials });
    if (usageType === "prophylaxis")
      return onSave({ kind: "prophylaxis", ...(amount.custom ? { vials: amount.vials } : {}) });
    if (!makeupDay) return;
    onSave({
      kind: "makeup",
      missedDateKey: makeupDay,
      amount: amount.custom ? { source: "custom", vials: amount.vials } : { source: "routine" },
    });
  };

  const noDayToMakeUp = usageType === "makeup" && !makeupDay;
  const noBleedNature = usageType === "on-demand" && !nature;

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
      <label className="mt-6 block" htmlFor="usage_type">
        <span className="flex items-center gap-1.5 text-sm font-bold text-[#242A2F]">
          Type of use
          {usageType === "on-demand" ? (
            <BleedDropIcon className="h-4 w-4 text-[#A63A2E]" label="Marks this day as a bleed" />
          ) : null}
        </span>
        <div className="relative mt-2">
          <select
            id="usage_type"
            name="usage_type"
            value={usageType}
            onChange={(event) => setUsageType(event.target.value as UseType)}
            className="min-h-12 w-full appearance-none rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] py-3 pl-4 pr-11 text-sm font-bold text-[#242A2F] outline-none focus:border-[#2C7A70] focus:ring-1 focus:ring-[#2C7A70]"
          >
            {TYPES.map(({ value, title }) => (
              <option key={value} value={value}>
                {title}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5C646C]" />
        </div>
      </label>

      {usageType === "on-demand" ? (
        <div className="mt-4">
          <p className="text-sm font-bold text-[#242A2F]">Bleed</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {NATURES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setNature(option)}
                aria-pressed={option === nature}
                style={option === nature ? { boxShadow: "0 0 0 2px #2C7A70" } : undefined}
                className="min-h-11 rounded-full border border-[#E7E5E0] bg-[#F7F6F3] px-4 py-2 text-xs font-bold text-[#242A2F] transition"
              >
                {BLEED_NATURE_LABEL[option]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {usageType === "makeup" ? (
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

      <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[#E7E5E0] bg-[#F7F6F3] p-3 pl-4">
        <div className="min-w-0">
          <p className="text-sm font-bold text-[#242A2F]">Factor used</p>
          {!amount.custom ? (
            <p className="mt-0.5 text-xs text-[#5C646C]">Regular prophylaxis amount</p>
          ) : null}
        </div>
        <div className="relative shrink-0">
          <input
            aria-label="Vials used"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            placeholder="0"
            value={amount.vials ? String(amount.vials) : ""}
            onFocus={(event) => event.target.select()}
            onChange={(event) => typeAmount(event.target.value)}
            className="h-11 w-36 rounded-xl bg-[#FFFFFF] pl-3 pr-14 text-right font-mono text-2xl font-semibold text-ink outline-none ring-[#274A63] placeholder:text-[#A8AEB4] focus:ring-2"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C646C]">
            vials
          </span>
        </div>
      </div>

      <button
        disabled={noDayToMakeUp || noBleedNature || amount.vials <= 0}
        onClick={save}
        className="mt-4 w-full rounded-xl bg-[#274A63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#274A63] disabled:cursor-not-allowed disabled:opacity-40"
      >
        Track
      </button>
    </Sheet>
  );
}
