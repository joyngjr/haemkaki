import { useState } from "react";

import { VIALS_DIGITS } from "@/lib/tracker-entries";

import { NumberField } from "./NumberField";
import { Sheet } from "./Sheet";

/**
 * "How many vials are at home?" — the fix for a figure a wrong entry threw off.
 *
 * Saved as a count rather than an edit to the figure: the API takes it over
 * whatever the entries before it add up to, so the user corrects the number
 * they can see without hunting for the entry that caused it.
 *
 * Mounted only while open, so `initialVials` seeds the draft on mount.
 */
export function StockCountSheet({
  initialVials,
  onSave,
  onClose,
}: {
  initialVials: number | undefined;
  onSave: (vials: number) => void;
  onClose: () => void;
}) {
  const [count, setCount] = useState(initialVials === undefined ? "" : String(initialVials));

  return (
    <Sheet
      tier="action"
      eyebrow="Factor at home"
      title="How many vials are at home?"
      onClose={onClose}
    >
      <NumberField
        label="Vials at home"
        value={count}
        onChange={setCount}
        maxLength={VIALS_DIGITS}
        min={0}
        suffix="vials"
        confirmLabel="Save count"
        onConfirm={() => onSave(Number(count))}
      />
    </Sheet>
  );
}
