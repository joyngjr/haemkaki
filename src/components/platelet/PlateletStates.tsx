import { useState } from "react";

import { FactorScene, type StockState } from "@/components/platelet/FactorScene";
import { type DoseState } from "@/components/platelet/Platelet";
import { cn } from "@/lib/utils";

const DOSES: { value: DoseState; label: string }[] = [
  { value: "covered", label: "Covered" },
  { value: "low", label: "Low" },
  { value: "veryLow", label: "Very low" },
];

const STOCKS: { value: StockState; label: string }[] = [
  { value: "wellStocked", label: "Well stocked" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
];

function Toggle<T extends string>({
  legend,
  options,
  value,
  onChange,
}: {
  legend: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {legend}
      </legend>
      <div className="mt-2 flex gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              value === option.value
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function PlateletStates() {
  const [dose, setDose] = useState<DoseState>("covered");
  const [stock, setStock] = useState<StockState>("wellStocked");

  return (
    <section>
      <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Platelet states</h2>
      <p className="mt-2 max-w-2xl text-sm text-slate-600">
        Two independent axes. Dose drives the platelet, stock drives the shelf, and the room takes
        its colour from whichever one is more urgent.
      </p>

      <div className="mt-8 flex flex-wrap gap-8">
        <Toggle legend="Dose" options={DOSES} value={dose} onChange={setDose} />
        <Toggle legend="Stock" options={STOCKS} value={stock} onChange={setStock} />
      </div>

      <FactorScene dose={dose} stock={stock} className="mt-6 max-w-2xl" />
    </section>
  );
}
