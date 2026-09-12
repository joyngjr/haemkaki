import { useState } from "react";

import { NumberPad } from "./NumberPad";
import { Sheet } from "./Sheet";

/**
 * "How many vials?" for a delivery.
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
      title="How many vials?"
      onBack={onBack}
      backLabel="Back to date actions"
      onClose={onClose}
      closeLabel="Close all pop-ups"
    >
      <NumberPad
        value={count}
        onChange={setCount}
        hint="Enter the number of vials to add to your supply."
        confirmLabel="Add vials"
        onConfirm={() => onSave(Number(count))}
      />
    </Sheet>
  );
}
