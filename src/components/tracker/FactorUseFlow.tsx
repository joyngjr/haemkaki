import { useState } from "react";

import { BLEED_NATURE_LABEL, type BleedNature } from "@/lib/tracker-entries";

import { NumberPad } from "./NumberPad";
import { Sheet, SheetOption } from "./Sheet";
import { BleedDropIcon } from "./TrackerIcons";

export type UseType = "prophylaxis" | "on-demand" | "follow-up";

/** What is already logged for this date, used to tick the matching option. */
export type SavedUse = {
  prophylaxis: boolean;
  "on-demand": number | undefined;
  "follow-up": number | undefined;
  /** How the on-demand bleed started, if it was recorded. */
  onDemandNature: BleedNature | undefined;
};

const NATURE_DESCRIPTION: Record<BleedNature, string> = {
  spontaneous: "The bleed started on its own, without an injury",
  traumatic: "The bleed followed an injury or impact",
};

const COUNTED_LABEL: Record<"on-demand" | "follow-up", string> = {
  "on-demand": "On-demand use",
  "follow-up": "Follow-up use after a bleed",
};

/**
 * Recording an injection: pick the kind of use, then a vial count for the two
 * kinds that need one. An on-demand dose also asks whether the bleed was
 * spontaneous or traumatic first. A prophylaxis dose is always the routine
 * amount, so it saves as soon as it is picked.
 */
export function FactorUseFlow({
  saved,
  initialType,
  onSaveProphylaxis,
  onSaveCounted,
  onBack,
  onClose,
}: {
  saved: SavedUse;
  /** Set when the flow was reopened from an existing entry's Edit button. */
  initialType: Exclude<UseType, "prophylaxis"> | null;
  onSaveProphylaxis: () => void;
  onSaveCounted: (type: "on-demand" | "follow-up", vials: number, nature?: BleedNature) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [type, setType] = useState<UseType | null>(initialType);
  const [count, setCount] = useState(initialType ? (saved[initialType] ?? "").toString() : "");
  const [nature, setNature] = useState<BleedNature | undefined>(saved.onDemandNature);
  /** On-demand asks about the bleed before the count; this is set once it has been answered. */
  const [natureAnswered, setNatureAnswered] = useState(false);

  if (type === "on-demand" && !natureAnswered) {
    return (
      <Sheet
        tier="action"
        offset="top"
        eyebrow={COUNTED_LABEL["on-demand"]}
        title="What was the nature of the bleed?"
        onBack={() => {
          setCount("");
          setType(null);
        }}
        backLabel="Back to use type"
        onClose={onClose}
        closeLabel="Close all pop-ups"
      >
        <div className="mt-6 space-y-3">
          {(Object.keys(BLEED_NATURE_LABEL) as BleedNature[]).map((option) => (
            <SheetOption
              key={option}
              title={BLEED_NATURE_LABEL[option]}
              description={NATURE_DESCRIPTION[option]}
              pressed={nature === option}
              onClick={() => {
                setNature(option);
                setNatureAnswered(true);
              }}
            />
          ))}
        </div>
      </Sheet>
    );
  }

  if (type === "on-demand" || type === "follow-up") {
    return (
      <Sheet
        tier="action"
        offset="top"
        eyebrow={COUNTED_LABEL[type]}
        title="How many vials used?"
        onBack={() => {
          if (type === "on-demand") {
            setNatureAnswered(false);
          } else {
            setCount("");
            setType(null);
          }
        }}
        backLabel={type === "on-demand" ? "Back to bleed nature" : "Back to use type"}
        onClose={onClose}
        closeLabel="Close all pop-ups"
      >
        <NumberPad
          value={count}
          onChange={setCount}
          hint="Enter the number of vials used."
          confirmLabel="Track"
          onConfirm={() =>
            onSaveCounted(type, Number(count), type === "on-demand" ? nature : undefined)
          }
        />
      </Sheet>
    );
  }

  // `prophylaxis` saves immediately, so reaching here means nothing is chosen yet.
  if (type === "prophylaxis") return null;

  const pick = (next: "on-demand" | "follow-up") => {
    setCount(saved[next] !== undefined ? String(saved[next]) : "");
    setType(next);
  };

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
      <div className="mt-6 space-y-3">
        <SheetOption
          title="Regular prophylaxis use"
          description="Your planned preventative dose"
          pressed={saved.prophylaxis}
          onClick={() => {
            setType("prophylaxis");
            onSaveProphylaxis();
          }}
        />
        <SheetOption
          title="On-demand use"
          description="Treatment taken when you experience a bleed"
          pressed={saved["on-demand"] !== undefined}
          onClick={() => pick("on-demand")}
          trailing={
            <BleedDropIcon
              className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#cd5952]"
              label="Bleed indicator"
            />
          }
        />
        <SheetOption
          title="Follow-up use after a bleed"
          description="An additional dose after a serious bleed"
          pressed={saved["follow-up"] !== undefined}
          onClick={() => pick("follow-up")}
        />
      </div>
    </Sheet>
  );
}
