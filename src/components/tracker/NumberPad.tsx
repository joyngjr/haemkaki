const KEY_CLASS = "h-10 rounded-lg bg-[#F7F6F3] text-sm font-bold transition hover:bg-[#F7F6F3]";

/**
 * The digit grid behind every "how many?" question in the tracker — refills,
 * factor use, made-up doses, and both numeric routine fields.
 */
export function NumberPad({
  value,
  onChange,
  maxLength = 2,
  hint,
  suffix,
  confirmLabel,
  onConfirm,
}: {
  value: string;
  onChange: (next: string) => void;
  /**
   * 2 everywhere today: the API caps a vial count at `VIALS_MAX` (99) and a
   * dosing interval at 90 days, and a pad that can enter 518 vials only
   * produces a 422 the user cannot act on.
   */
  maxLength?: number;
  hint?: string;
  /** Unit rendered inside the display, e.g. "days". */
  suffix?: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  const append = (digit: string) => onChange(`${value}${digit}`.slice(0, maxLength));

  return (
    <>
      {hint ? <p className="mt-2 text-xs text-[#5C646C]">{hint}</p> : null}
      <div
        className={`relative mt-3 rounded-xl bg-[#F7F6F3] text-center font-mono text-2xl font-semibold text-ink ${suffix ? "px-4 py-2" : "px-3 py-2"}`}
      >
        <span>{value || "0"}</span>
        {suffix ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#5C646C]">
            {suffix}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button
            key={number}
            onClick={() => append(String(number))}
            className={`${KEY_CLASS} text-[#242A2F]`}
          >
            {number}
          </button>
        ))}
        <button onClick={() => onChange("")} className={`${KEY_CLASS} text-[#5C646C]`}>
          Clear
        </button>
        <button onClick={() => append("0")} className={`${KEY_CLASS} text-[#242A2F]`}>
          0
        </button>
        <button
          onClick={() => onChange(value.slice(0, -1))}
          aria-label="Delete last digit"
          className={`${KEY_CLASS} text-[#5C646C]`}
        >
          ⌫
        </button>
      </div>
      <button
        disabled={!(Number(value) > 0)}
        onClick={onConfirm}
        className="mt-3 w-full rounded-xl bg-[#274A63] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#274A63] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </>
  );
}
