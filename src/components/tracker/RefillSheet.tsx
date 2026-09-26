import { useState } from "react";

import { VIALS_DIGITS } from "@/lib/tracker-entries";

import { NumberField } from "./NumberField";
import { Sheet } from "./Sheet";

/**
 * "How many vials arrived?" for a delivery.
 *
 * Mounted only while the flow is open, so the saved value seeds the draft on
 * mount instead of needing an effect to copy it in.
 */
export function RefillSheet({
  savedVials,
  onSave,
  onBack,
  onClose,
}: {
  savedVials: number | undefined;
  onSave: (vials: number) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState(savedVials ? String(savedVials) : "");

  return (
    <Sheet
      tier="action"
      offset="top"
      eyebrow="Factor Refill"
      title="How many vials arrived?"
      onBack={onBack}
      backLabel="Back to date actions"
      onClose={onClose}
      closeLabel="Close all pop-ups"
    >
      <NumberField
        label="Vials"
        value={count}
        onChange={setCount}
        maxLength={VIALS_DIGITS}
        suffix="vials"
        confirmLabel="Add factor"
        onConfirm={() => onSave(Number(count))}
      />
    </Sheet>
  );
}

/** Record stock that should no longer be counted, without calling it a treatment dose. */
export function RemoveFactorSheet({
  savedVials,
  onSave,
  onBack,
  onClose,
}: {
  savedVials: number | undefined;
  onSave: (vials: number) => void;
  onBack: () => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState(savedVials ? String(savedVials) : "");

  return (
    <Sheet
      tier="action"
      offset="top"
      eyebrow="Remove Factor"
      title="How many vials should be removed?"
      onBack={onBack}
      backLabel="Back to date actions"
      onClose={onClose}
      closeLabel="Close all pop-ups"
    >
      <p className="mb-4 text-sm leading-relaxed text-ink-muted">
        Use this to correct an erroneous factor refill or account for vials that have expired.
      </p>
      <NumberField
        label="Vials"
        value={count}
        onChange={setCount}
        maxLength={VIALS_DIGITS}
        suffix="vials"
        confirmLabel="Remove factor"
        onConfirm={() => onSave(Number(count))}
      />
    </Sheet>
  );
}
