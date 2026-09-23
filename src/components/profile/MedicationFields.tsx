import { useState } from "react";

import type { MedicationDraft } from "@/components/profile/clinical-profile";
import { Field, inputClass } from "@/components/profile/form-fields";
import { NumericField } from "@/components/profile/NumericField";
import type { DiagnosisType } from "@/lib/api";
import {
  ALL_UNITS,
  matchedMedication,
  medicationSuggestions,
  type MedicationKind,
  type MedicationProduct,
} from "@/lib/medication-catalog";

/**
 * Product, dose and unit, with the catalog's suggestions filtered to the
 * diagnosis. A caller can fix the unit when the rest of the app tracks that
 * medication in one canonical measure (regular factor uses vials).
 */
export function MedicationFields({
  medication,
  onChange,
  kind,
  diagnosis,
  fixedUnit,
}: {
  medication: MedicationDraft;
  onChange: (next: MedicationDraft) => void;
  kind: MedicationKind;
  diagnosis: DiagnosisType;
  /** Regular factor is tracked as whole vials rather than a product-specific unit. */
  fixedUnit?: string;
}) {
  const [focused, setFocused] = useState(false);
  const update = (patch: Partial<MedicationDraft>) => onChange({ ...medication, ...patch });
  const product = matchedMedication(medication.name);
  const suggestions = medicationSuggestions(medication.name, kind, diagnosis);
  const units = fixedUnit ? [fixedUnit] : (product?.units ?? ALL_UNITS);

  function selectProduct(selected: MedicationProduct) {
    update({ name: selected.name, unit: fixedUnit ?? selected.units[0] });
    setFocused(false);
  }

  return (
    <div className="space-y-4">
      <Field label="Product name">
        <div className="relative">
          <input
            className={inputClass}
            value={medication.name}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 150)}
            onChange={(event) => {
              const name = event.target.value;
              const exact = matchedMedication(name);
              update({ name, unit: fixedUnit ?? exact?.units[0] ?? "" });
            }}
            autoComplete="off"
            placeholder="Type a product or medicine"
          />
          {focused && suggestions.length > 0 ? (
            <div className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto rounded-2xl border border-sand-200 bg-white shadow-xl">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.name}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectProduct(suggestion)}
                  className="flex min-h-[48px] w-full items-center justify-between border-b border-sand-100 px-4 py-2 text-left last:border-0 active:bg-teal-50"
                >
                  <span className="text-sm font-semibold text-sand-900">{suggestion.name}</span>
                  <span className="ml-3 text-right text-xs text-sand-500">
                    {suggestion.aliases[0]}
                    {suggestion.status ? (
                      <span className="block text-amber-700">{suggestion.status}</span>
                    ) : null}
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </Field>
      <div className={fixedUnit ? undefined : "grid grid-cols-[1fr_128px] gap-3"}>
        <NumericField
          label={fixedUnit === "vials" ? "Vials per dose" : "Dose"}
          mode={fixedUnit === "vials" ? "integer" : "decimal"}
          value={medication.dose}
          onChange={(dose) => update({ dose })}
          placeholder={fixedUnit === "vials" ? "Number of vials" : "Enter dose"}
          max={fixedUnit === "vials" ? 99 : undefined}
        />
        {!fixedUnit ? (
          <Field label="Unit">
            <select
              className={inputClass}
              value={medication.unit}
              onChange={(event) => update({ unit: event.target.value })}
              disabled={!medication.name}
            >
              {!medication.unit ? <option value="">Select</option> : null}
              {units.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>
    </div>
  );
}
