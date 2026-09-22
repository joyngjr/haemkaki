import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The controls the two profile forms share.
 *
 * Onboarding records the diagnosis and the regular medication; the Medical ID
 * form records everything a responder reads. They are separate screens on
 * purpose, so these live here rather than in either one.
 */

export const inputClass =
  "mt-2 min-h-[48px] w-full rounded-2xl border border-sand-300 bg-white px-4 text-base text-sand-900 outline-none placeholder:text-sand-400 focus:border-teal-700 focus:ring-1 focus:ring-teal-700";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-sand-900">{label}</span>
      {hint ? <span className="mt-1 block text-xs leading-5 text-sand-600">{hint}</span> : null}
      {children}
    </label>
  );
}

export function Choice<T extends string>({
  options,
  value,
  onChange,
  columns = false,
}: {
  options: { value: T; label: string; description?: string }[];
  value: T | "";
  onChange: (value: T) => void;
  columns?: boolean;
}) {
  return (
    <div className={cn("mt-3 grid gap-2", columns ? "grid-cols-2" : "grid-cols-1")}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "min-h-[48px] rounded-2xl border px-4 py-3 text-left transition-colors",
            value === option.value
              ? "border-teal-700 bg-teal-50 text-teal-950 ring-1 ring-teal-700"
              : "border-sand-300 bg-white text-sand-800 active:bg-sand-100",
          )}
        >
          <span className="block text-sm font-semibold">{option.label}</span>
          {option.description ? (
            <span className="mt-0.5 block text-xs leading-5 text-sand-600">
              {option.description}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}

/** A titled block of fields, as both forms draw one. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-4 rounded-3xl border border-sand-200 bg-sand-100/60 p-4">
      <h3 className="text-sm font-bold text-sand-900">{title}</h3>
      {children}
    </section>
  );
}
