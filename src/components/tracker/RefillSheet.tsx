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
