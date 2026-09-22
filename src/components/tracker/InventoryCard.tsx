import { useState } from "react";

import { Card, CardTitle } from "@/components/ui/Card";
import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { CloseIcon, PlusIcon } from "./TrackerIcons";
import { useSupplies } from "./useSupplies";

const STEPPER = cn(
  "grid h-[38px] w-[38px] shrink-0 place-items-center rounded-xl border border-sand-300",
  "bg-card text-ink-muted transition-colors hover:bg-soft disabled:opacity-40 disabled:hover:bg-card",
);

/**
 * "Other supplies" — everything other than factor (needles, swabs, a sharps
 * bin, whatever else gets added), tracked as a counted list. The list lives in
 * `/users/{id}/supplies` behind `useSupplies`; only whether the card is shown
 * is local. Dismissing it swaps the card for a one-line button so it can be
 * brought back without losing anything.
 */
export function InventoryCard({
  profileId,
  className,
}: {
  profileId: number | undefined;
  className?: string;
}) {
  const { items, update, isLoading, error } = useSupplies(profileId);
  const [visible, setVisible] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState("");

  function updateQuantity(key: string, change: number) {
    update((current) =>
      current.map((item) =>
        item.key === key ? { ...item, quantity: Math.max(0, item.quantity + change) } : item,
      ),
    );
  }

  function removeItem(key: string) {
    update((current) => current.filter((item) => item.key !== key));
  }

  function addItem() {
    const name = draftName.trim();
    if (!name) return;
    update((current) => [...current, { key: `new-${Date.now()}`, name, quantity: 0 }]);
    setDraftName("");
    setIsAdding(false);
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => setVisible(true)}
        className={cn(
          "flex h-12 w-full items-center justify-center gap-2 rounded-card border border-dashed border-sand-300",
          "text-sm font-medium text-ink-muted transition-colors hover:bg-soft",
          FOCUS_RING,
          className,
        )}
      >
        <PlusIcon className="h-4 w-4" />
        Show other supplies
      </button>
    );
  }

  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex items-center justify-between gap-2">
        <CardTitle>Other supplies</CardTitle>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Hide other supplies"
          className={cn(
            "-my-2.5 -mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-soft",
            FOCUS_RING,
          )}
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <p
          role="status"
          className="mt-3 rounded-xl border border-brick-200 bg-brick-50 px-3.5 py-2.5 text-sm font-medium text-brick-600"
        >
          {error}
        </p>
      )}

      <ul className="mt-4">
        {items.map((item) => (
          <li key={item.key} className="flex items-center gap-3.5 py-2">
            <span className="min-w-0 flex-grow">
              <span className="block truncate text-[15px]">{item.name}</span>
              <span className="flex items-center gap-2.5 text-[12.5px]">
                {item.quantity === 0 && (
                  <span className="font-medium text-brick-600">Out of stock</span>
                )}
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  aria-label={`Remove ${item.name}`}
                  className={cn("-mx-1 px-1 py-1 text-ink-faint underline", FOCUS_RING)}
                >
                  Remove
                </button>
              </span>
            </span>
            <span
              className={cn(
                "w-7 shrink-0 text-right font-mono text-[17px] font-semibold",
                item.quantity === 0 ? "text-brick-600" : "text-ink",
              )}
            >
              {item.quantity}
            </span>
            <span className="flex shrink-0 gap-1.5">
              <button
                type="button"
                onClick={() => updateQuantity(item.key, -1)}
                disabled={item.quantity === 0}
                aria-label={`One fewer ${item.name}`}
                className={cn(STEPPER, FOCUS_RING)}
              >
                &minus;
              </button>
              <button
                type="button"
                onClick={() => updateQuantity(item.key, 1)}
                aria-label={`One more ${item.name}`}
                className={cn(STEPPER, FOCUS_RING)}
              >
                <PlusIcon className="h-4 w-4" />
              </button>
            </span>
          </li>
        ))}
        {items.length === 0 && (
          <li className="rounded-xl bg-soft px-3.5 py-3 text-sm text-ink-muted">
            {isLoading ? "Loading…" : "No supplies yet."}
          </li>
        )}
      </ul>

      {isAdding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addItem();
          }}
          className="mt-3.5 flex items-center gap-2"
        >
          <input
            autoFocus
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="e.g. Alcohol swabs"
            aria-label="Name of the supply to add"
            maxLength={40}
            className="h-12 min-w-0 flex-1 rounded-xl border border-sand-300 bg-card px-3.5 text-[15px] text-ink placeholder:text-ink-faint focus:border-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-600"
          />
          <button
            type="submit"
            disabled={!draftName.trim()}
            className={cn(
              "h-12 shrink-0 rounded-xl bg-slate-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:bg-rail disabled:text-ink-disabled",
              FOCUS_RING,
            )}
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdding(false);
              setDraftName("");
            }}
            aria-label="Cancel"
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-full text-ink-faint hover:bg-soft",
              FOCUS_RING,
            )}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          disabled={profileId === undefined}
          className={cn(
            "mt-3.5 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-sand-300",
            "text-sm font-medium text-ink-muted transition-colors hover:bg-soft disabled:opacity-40",
            FOCUS_RING,
          )}
        >
          <PlusIcon className="h-4 w-4" />
          Add supply
        </button>
      )}
    </Card>
  );
}
