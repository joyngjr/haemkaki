import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type NumpadMode = "date" | "decimal" | "integer";

function dateDigits(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[3]}${match[2]}${match[1]}` : "";
}

function displayDate(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean).join(" / ");
}

function isoDate(digits: string): string | null {
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function NumpadField({
  label,
  hint,
  value,
  onChange,
  mode,
  placeholder,
  suffix,
  required = false,
  max,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  mode: NumpadMode;
  placeholder?: string;
  suffix?: string;
  required?: boolean;
  max?: number | string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  function showKeypad() {
    setDraft(mode === "date" ? dateDigits(value) : value);
    setError(null);
    setOpen(true);
  }

  function enter(character: string) {
    setError(null);
    setDraft((current) => {
      if (mode === "date") return current.length < 8 ? current + character : current;
      if (character === "." && (mode === "integer" || current.includes("."))) return current;
      if (current.length >= 8) return current;
      return current === "0" && character !== "." ? character : current + character;
    });
  }

  function accept() {
    if (mode === "date") {
      if (!draft && !required) {
        onChange("");
        setOpen(false);
        return;
      }
      const next = isoDate(draft);
      if (!next) {
        setError("Enter a valid date as DD/MM/YYYY.");
        return;
      }
      const maximumDate =
        typeof max === "string"
          ? max
          : max === undefined
            ? undefined
            : new Date(max).toISOString().slice(0, 10);
      if (maximumDate && next > maximumDate) {
        setError("The date cannot be in the future.");
        return;
      }
      onChange(next);
    } else {
      const number = Number(draft);
      if (
        !draft ||
        !Number.isFinite(number) ||
        number <= 0 ||
        (typeof max === "number" && number > max)
      ) {
        setError(
          `Enter a value greater than 0${typeof max === "number" ? ` and no more than ${max}` : ""}.`,
        );
        return;
      }
      onChange(draft);
    }
    setOpen(false);
  }

  const shown = mode === "date" ? (value ? displayDate(dateDigits(value)) : "") : value;

  return (
    <label className="block">
      <span className="text-sm font-semibold text-sand-900">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-sand-600">{hint}</span> : null}
      <button
        type="button"
        onClick={showKeypad}
        className="mt-2 flex min-h-[48px] w-full items-center justify-between rounded-2xl border border-sand-300 bg-white px-4 text-left text-base outline-none focus:border-teal-700 focus:ring-1 focus:ring-teal-700"
      >
        <span className={shown ? "text-sand-900" : "text-sand-400"}>{shown || placeholder}</span>
        {suffix ? (
          <span className="ml-2 shrink-0 text-sm font-semibold text-sand-600">{suffix}</span>
        ) : null}
      </button>
      {open
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center">
              <button
                type="button"
                aria-label="Close number pad"
                onClick={() => setOpen(false)}
                className="absolute inset-0 bg-sand-900/45"
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-label={`${label} number pad`}
                className="relative w-full max-w-md rounded-t-[28px] bg-sand-50 px-5 pb-7 pt-4 shadow-2xl"
              >
                <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-sand-300" />
                <p className="text-sm font-bold text-sand-900">{label}</p>
                <div
                  className={cn(
                    "mt-2 flex min-h-[52px] items-center rounded-2xl bg-white px-4 text-2xl font-semibold tracking-wide text-sand-900 ring-1 ring-sand-200",
                    !draft && "text-sand-400",
                  )}
                >
                  {(mode === "date" ? displayDate(draft) : draft) ||
                    (mode === "date" ? "DD / MM / YYYY" : "0")}
                  {suffix && draft ? (
                    <span className="ml-2 text-sm text-sand-600">{suffix}</span>
                  ) : null}
                </div>
                {error ? (
                  <p role="alert" className="mt-2 text-sm font-medium text-rose-700">
                    {error}
                  </p>
                ) : null}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((digit) => (
                    <button
                      key={digit}
                      type="button"
                      onClick={() => enter(digit)}
                      className="min-h-[54px] rounded-2xl bg-white text-xl font-semibold text-sand-900 shadow-sm active:bg-sand-200"
                    >
                      {digit}
                    </button>
                  ))}
                  {mode === "decimal" ? (
                    <button
                      type="button"
                      onClick={() => enter(".")}
                      className="min-h-[54px] rounded-2xl bg-white text-xl font-semibold text-sand-900 shadow-sm"
                    >
                      .
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDraft("")}
                      className="min-h-[54px] rounded-2xl bg-sand-100 text-sm font-bold text-sand-700"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => enter("0")}
                    className="min-h-[54px] rounded-2xl bg-white text-xl font-semibold text-sand-900 shadow-sm"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    aria-label="Delete last digit"
                    onClick={() => setDraft((current) => current.slice(0, -1))}
                    className="min-h-[54px] rounded-2xl bg-sand-100 text-xl font-semibold text-sand-700"
                  >
                    ⌫
                  </button>
                </div>
                <button
                  type="button"
                  onClick={accept}
                  className="mt-3 min-h-[50px] w-full rounded-2xl bg-teal-800 px-4 font-bold text-white"
                >
                  Done
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </label>
  );
}
