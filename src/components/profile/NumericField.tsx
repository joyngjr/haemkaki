import { useState } from "react";

import { Field, inputClass } from "@/components/profile/form-fields";

type NumericMode = "date" | "decimal" | "integer";

/**
 * A number the user types, in the two profile forms.
 *
 * This used to open a nine-key pad in a bottom sheet. A plain input still shows
 * the phone's numeric keypad through `inputMode`, and a date is a native date
 * input rather than eight digits entered blind as DDMMYYYY.
 */
export function NumericField({
  label,
  hint,
  value,
  onChange,
  mode,
  placeholder,
  max,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  mode: NumericMode;
  placeholder?: string;
  /** An ISO date for `date` mode, otherwise the largest number accepted. */
  max?: number | string;
}) {
  const [touched, setTouched] = useState(false);

  if (mode === "date") {
    const maximum =
      typeof max === "number" ? new Date(max).toISOString().slice(0, 10) : (max ?? undefined);
    // A typed date gets past the picker's own `max`, so it is still checked here.
    const error = touched && maximum && value && value > maximum;
    return (
      <Field label={label} hint={hint}>
        <input
          type="date"
          className={inputClass}
          value={value}
          max={maximum}
          placeholder={placeholder}
          onBlur={() => setTouched(true)}
          onChange={(event) => onChange(event.target.value)}
        />
        {error ? (
          <span role="alert" className="mt-1 block text-xs font-medium text-rose-700">
            The date cannot be in the future.
          </span>
        ) : null}
      </Field>
    );
  }

  const error =
    touched &&
    value !== "" &&
    (Number(value) <= 0 || (typeof max === "number" && Number(value) > max));

  return (
    <Field label={label} hint={hint}>
      <input
        type="text"
        // Digits only — the handler enforces it, this picks the keypad iOS shows.
        inputMode={mode === "decimal" ? "decimal" : "numeric"}
        autoComplete="off"
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onBlur={() => setTouched(true)}
        onChange={(event) => {
          const cleaned = event.target.value.replace(
            mode === "decimal" ? /[^0-9.]/g : /[^0-9]/g,
            "",
          );
          // Keep the first decimal point and drop any the user types after it.
          const [whole, ...rest] = cleaned.split(".");
          onChange(rest.length ? `${whole}.${rest.join("")}` : whole);
        }}
      />
      {error ? (
        <span role="alert" className="mt-1 block text-xs font-medium text-rose-700">
          Enter a value greater than 0{typeof max === "number" ? ` and no more than ${max}` : ""}.
        </span>
      ) : null}
    </Field>
  );
}
