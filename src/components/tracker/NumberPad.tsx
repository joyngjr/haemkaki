const KEY_CLASS = "h-10 rounded-lg bg-[#f8f0e2] text-sm font-bold transition hover:bg-[#f4ead8]";

/**
 * The digit grid behind every "how many?" question in the tracker — refills,
 * factor use, made-up doses, and both numeric routine fields.
 */
export function NumberPad({
  value,
  onChange,
  maxLength = 3,
  hint,
  suffix,
  confirmLabel,
  onConfirm,
}: {
  value: string;
  onChange: (next: string) => void;
  /** 3 for vial counts, 2 for a dosing interval in days. */
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
      {hint ? <p className="mt-2 text-xs text-[#806d51]">{hint}</p> : null}
      <div
        className={`relative mt-3 rounded-xl bg-[#f8f0e2] text-center text-2xl font-bold tracking-wide text-[#3b281c] ${suffix ? "px-4 py-2" : "px-3 py-2"}`}
      >
        <span>{value || "0"}</span>
        {suffix ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#806d51]">
            {suffix}
          </span>
        ) : null}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
          <button
            key={number}
            onClick={() => append(String(number))}
            className={`${KEY_CLASS} text-[#443229]`}
          >
            {number}
          </button>
        ))}
        <button onClick={() => onChange("")} className={`${KEY_CLASS} text-[#806d51]`}>
          Clear
        </button>
        <button onClick={() => append("0")} className={`${KEY_CLASS} text-[#443229]`}>
          0
        </button>
        <button
          onClick={() => onChange(value.slice(0, -1))}
          aria-label="Delete last digit"
          className={`${KEY_CLASS} text-[#806d51]`}
        >
          ⌫
        </button>
      </div>
      <button
        disabled={!(Number(value) > 0)}
        onClick={onConfirm}
        className="mt-3 w-full rounded-xl bg-[#a98559] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#80633e] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </>
  );
}
