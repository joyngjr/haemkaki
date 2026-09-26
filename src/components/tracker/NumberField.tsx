/**
 * The typed "how many?" field behind every count question in the tracker —
 * refills, factor use, made-up doses, and both numeric routine fields.
 *
 * This used to be a nine-key digit grid. `inputMode="numeric"` still raises the
 * phone's own keypad, so the keys are no smaller on a phone, and a laptop can
 * type the number instead of clicking at it.
 */
export function NumberField({
  label,
  value,
  onChange,
  maxLength = 2,
  min = 1,
  max,
  hint,
  suffix,
  confirmLabel,
  onConfirm,
}: {
  /** Names the input for screen readers; the Sheet's title is not tied to it. */
  label: string;
  value: string;
  onChange: (next: string) => void;
  /**
   * 2 by default, for the day counts: a dosing interval is capped at 90 days.
   * Amounts pass `VIALS_DIGITS`, since the API caps them at `VIALS_MAX` (999),
   * and a field that can enter more only produces a 422 the user cannot act on.
   */
  maxLength?: number;
  /** Smallest accepted value: 1 by default, 0 where none is a real answer (a stock count). */
  min?: number;
  /** Largest accepted value, when the domain has one (day 31 of a month). */
  max?: number;
  hint?: string;
  /** Unit rendered inside the field, e.g. "vials". */
  suffix?: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const valid = value !== "" && Number(value) >= min && (max === undefined || Number(value) <= max);

  return (
    <>
      {hint ? <p className="mt-2 text-xs text-[#5C646C]">{hint}</p> : null}
      <div className="relative mt-3">
        <input
          // The sheets are mounted only while open, so this focuses on the step
          // the user just opened and the phone keypad comes up with it.
          autoFocus
          type="text"
          inputMode="numeric"
          // Digits only — the handler enforces it, this only picks the keypad
          // iOS shows and keeps the field out of numeric autofill.
          pattern="[0-9]*"
          autoComplete="off"
          aria-label={label}
          placeholder="0"
          value={value}
          onFocus={(event) => event.target.select()}
          onChange={(event) =>
            onChange(
              event.target.value
                .replace(/[^0-9]/g, "")
                .slice(0, maxLength)
                .replace(/^0+(?=\d)/, ""),
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter" && valid) onConfirm();
          }}
          className={`w-full rounded-xl bg-[#F7F6F3] text-center font-mono text-2xl font-semibold text-ink outline-none ring-[#274A63] placeholder:text-[#A8AEB4] focus:ring-2 ${
            suffix ? "px-14 py-3" : "px-3 py-3"
          }`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C646C]">
            {suffix}
          </span>
        ) : null}
      </div>
      <button
        disabled={!valid}
        onClick={onConfirm}
        className="mt-3 w-full rounded-xl bg-[#274A63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#274A63] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </>
  );
}
