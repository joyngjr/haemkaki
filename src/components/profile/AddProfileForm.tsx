import { useState, type FormEvent } from "react";

import { type DoseState, type StockState } from "@/components/platelet/Platelet";
import type { FactorType } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

const FACTORS: { value: FactorType; label: string }[] = [
  { value: "VIII", label: "Factor VIII" },
  { value: "IX", label: "Factor IX" },
];

const DOSES: { value: DoseState; label: string }[] = [
  { value: "covered", label: "Covered" },
  { value: "low", label: "Low" },
  { value: "veryLow", label: "Very low" },
];

const STOCKS: { value: StockState; label: string }[] = [
  { value: "wellStocked", label: "Stocked" },
  { value: "moderate", label: "Moderate" },
  { value: "low", label: "Low" },
];

function Segmented<T extends string>({
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
      <legend className="text-xs font-semibold uppercase tracking-wide text-sand-600">
        {legend}
      </legend>
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-[44px] rounded-full border px-4 text-sm font-medium transition-colors",
              value === option.value
                ? "border-sand-900 bg-sand-900 text-sand-50"
                : "border-sand-300 bg-white text-sand-700",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NumberField({
  label,
  value,
  max,
  onChange,
}: {
  label: string;
  value: number;
  max: number;
  onChange: (next: number) => void;
}) {
  return (
    <label className="flex-1">
      <span className="text-xs font-semibold uppercase tracking-wide text-sand-600">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={max}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isFinite(next) ? Math.min(max, Math.max(0, Math.trunc(next))) : 0);
        }}
        className="mt-2 min-h-[44px] w-full rounded-2xl border border-sand-300 bg-white px-4 text-base text-sand-900 outline-none focus:border-sand-900"
      />
    </label>
  );
}

export function AddProfileForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const { createProfile } = useProfiles();

  const [name, setName] = useState("");
  const [factorType, setFactorType] = useState<FactorType>("VIII");
  const [dose, setDose] = useState<DoseState>("covered");
  const [stock, setStock] = useState<StockState>("wellStocked");
  const [vials, setVials] = useState(7);
  const [daysCover, setDaysCover] = useState(14);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || saving) return;

    setSaving(true);
    setError(null);
    try {
      await createProfile({
        name: name.trim(),
        factor_type: factorType,
        dose_state: dose,
        stock_state: stock,
        vials_on_hand: vials,
        days_cover: daysCover,
      });
      onDone();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save the profile");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-sand-900">Add a profile</h2>
        <p className="mt-1 text-sm text-sand-600">
          No password needed — profiles are just names on this device.
        </p>
      </div>

      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-wide text-sand-600">Name</span>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder="e.g. Mia"
          className="mt-2 min-h-[44px] w-full rounded-2xl border border-sand-300 bg-white px-4 text-base text-sand-900 outline-none placeholder:text-sand-400 focus:border-sand-900"
        />
      </label>

      <Segmented legend="Product" options={FACTORS} value={factorType} onChange={setFactorType} />
      <Segmented legend="Dose right now" options={DOSES} value={dose} onChange={setDose} />
      <Segmented legend="Stock at home" options={STOCKS} value={stock} onChange={setStock} />

      <div className="flex gap-3">
        <NumberField label="Vials" value={vials} max={99} onChange={setVials} />
        <NumberField label="Days cover" value={daysCover} max={365} onChange={setDaysCover} />
      </div>

      {error ? (
        <p role="alert" className="text-sm font-medium text-rose-700">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[48px] flex-1 rounded-2xl border border-sand-300 bg-white px-4 font-semibold text-sand-700"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={!name.trim() || saving}
          className="min-h-[48px] flex-1 rounded-2xl bg-sand-900 px-4 font-semibold text-sand-50 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}
