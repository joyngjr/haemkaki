import { useState } from "react";

import { MEDICATION_UNIT, type MedicationDraft } from "@/components/profile/clinical-profile";
import { Field, inputClass } from "@/components/profile/form-fields";
import type { DiagnosisType } from "@/lib/api";
import {
  matchedMedication,
  medicationSuggestions,
  type MedicationKind,
  type MedicationProduct,
} from "@/lib/medication-catalog";
import { VIALS_DIGITS } from "@/lib/tracker-entries";

/** Matches `IU_PER_VIAL_MAX` in the API's schemas.py. */
const IU_PER_VIAL_MAX = 10_000;

/**
 * Product, dose and vial strength, with the catalog's suggestions filtered to
 * the diagnosis. Anything can be typed as the product; the dose is whole vials,
 * the only unit the app counts in, so the unit is shown beside the field rather
 * than asked. The IU per vial is only printed on the Medical ID.
 */
export function MedicationFields({
  medication,
  onChange,
  kind,
  diagnosis,
}: {
  medication: MedicationDraft;
  onChange: (next: MedicationDraft) => void;
  kind: MedicationKind;
  diagnosis: DiagnosisType;
}) {
  const [focused, setFocused] = useState(false);
  const update = (patch: Partial<MedicationDraft>) => onChange({ ...medication, ...patch });
  const suggestions = medicationSuggestions(medication.name, kind, diagnosis);

  function selectProduct(selected: MedicationProduct) {
    update({ name: selected.name });
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
              // An exact match closes the suggestions, as picking one would.
              if (matchedMedication(name)) setFocused(false);
              update({ name });
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
      <Field label="Dose per injection">
        <div className="relative">
          <input
            type="text"
            // Whole vials only — the handler enforces it, this picks the keypad iOS shows.
            inputMode="numeric"
            autoComplete="off"
            className={`${inputClass} pr-14`}
            value={medication.dose}
            placeholder="Enter dose per injection"
            onChange={(event) =>
              update({
                dose: event.target.value
                  .replace(/[^0-9]/g, "")
                  .slice(0, VIALS_DIGITS)
                  .replace(/^0+(?=\d)/, ""),
              })
            }
          />
          <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-semibold text-sand-600">
            {MEDICATION_UNIT}
          </span>
        </div>
      </Field>
      <Field label="IU per vial">
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className={`${inputClass} pr-14`}
            value={medication.iuPerVial}
            placeholder="As on the vial's label"
            onChange={(event) => {
              const digits = event.target.value.replace(/[^0-9]/g, "").replace(/^0+/, "");
              // Past the API's cap the keystroke is dropped rather than saved into a 422.
              if (Number(digits) <= IU_PER_VIAL_MAX) update({ iuPerVial: digits });
            }}
          />
          <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-sm font-semibold text-sand-600">
            IU
          </span>
        </div>
      </Field>
    </div>
  );
}
