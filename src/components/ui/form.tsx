/**
 * The button and field primitives Home and the Quick Log sheet share.
 *
 * Deliberately small: `PrimaryButton` is the sand-900 fill main uses for the
 * one action on a surface, `OutlineButton` its quieter pair, `GhostRow` the
 * full-width tappable row inside a card.
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PrimaryButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 rounded-2xl bg-sand-900 px-4 py-2 text-sm font-semibold text-sand-50 transition-colors hover:bg-sand-700 disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function OutlineButton({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "min-h-11 rounded-2xl border border-sand-300 bg-white px-4 py-2 text-sm font-semibold text-sand-700 transition-colors hover:bg-sand-100",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function GhostRow({
  children,
  className,
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-auto w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-sand-100/70",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Field({ id, label, children }: { id: string; label: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-sand-700">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export const INPUT_CLASS =
  "min-h-11 w-full rounded-2xl border border-sand-300 bg-white px-3 py-2 text-sm text-sand-900 focus:outline-none focus:ring-2 focus:ring-sand-400";
