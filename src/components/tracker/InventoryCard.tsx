import { useState } from "react";

import { CloseIcon, PlusIcon } from "./TrackerIcons";

type InventoryItem = { id: string; name: string; quantity: number };

const DEFAULT_ITEMS: InventoryItem[] = [
  { id: "gauze", name: "Gauze", quantity: 0 },
  { id: "syringes", name: "Syringes", quantity: 0 },
  { id: "saline", name: "Saline", quantity: 0 },
];

/**
 * "Inventory" — supplies other than factor (gauze, syringes, saline, and
 * whatever else gets added), tracked as a simple counted list. Collapsible:
 * dismissing it swaps the card for a one-line button so it can be brought
 * back without losing what's in it. State is local only, matching the rest
 * of the tracker — nothing here is persisted yet.
 */
export function InventoryCard() {
  const [items, setItems] = useState<InventoryItem[]>(DEFAULT_ITEMS);
  const [visible, setVisible] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [draftName, setDraftName] = useState("");

  function updateQuantity(id: string, change: number) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity + change) } : item,
      ),
    );
  }

  function removeItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  function addItem() {
    const name = draftName.trim();
    if (!name) return;
    setItems((current) => [...current, { id: `custom-${Date.now()}`, name, quantity: 0 }]);
    setDraftName("");
    setIsAdding(false);
  }

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d8c3a0] text-sm font-bold text-[#80633e] transition hover:bg-[#f4ead8] sm:mt-6"
      >
        <PlusIcon className="h-4 w-4" />
        Add Inventory section
      </button>
    );
  }

  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="ml-1 text-xl font-bold tracking-tight text-[#6b3817] sm:ml-2 sm:text-2xl">
            Inventory
          </h2>
          <p className="ml-1 mt-1 text-sm text-[#a8977c] sm:ml-2">
            Other supplies needed for your treatment
          </p>
        </div>
        <button
          onClick={() => setVisible(false)}
          aria-label="Remove Inventory section"
          className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#806d51] transition hover:bg-[#f4ead8]"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-2 rounded-xl bg-[#f8f0e2] px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-[#443229]">{item.name}</p>
              <div className="flex items-center gap-2 text-xs">
                {item.quantity === 0 && (
                  <span className="font-semibold text-[#cd5952]">Out of stock</span>
                )}
                <button
                  onClick={() => removeItem(item.id)}
                  aria-label={`Remove ${item.name}`}
                  className="-mx-1 -my-2 px-1 py-3 text-[#806d51] underline"
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                disabled={item.quantity === 0}
                aria-label={`Decrease ${item.name}`}
                className="grid h-11 w-11 place-items-center rounded-full text-xl font-bold text-[#80633e] transition hover:bg-[#f4ead8] disabled:opacity-30"
              >
                &minus;
              </button>
              <span
                className={`min-w-8 text-center text-base font-bold ${item.quantity === 0 ? "text-[#cd5952]" : "text-[#443229]"}`}
              >
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.id, 1)}
                aria-label={`Increase ${item.name}`}
                className="grid h-11 w-11 place-items-center rounded-full text-[#80633e] transition hover:bg-[#f4ead8]"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        ))}
        {items.length === 0 && (
          <p className="rounded-xl bg-[#f8f0e2] px-3 py-3 text-center text-sm text-[#806d51]">
            No supplies yet. Add one below.
          </p>
        )}
      </div>

      {isAdding ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            addItem();
          }}
          className="mt-3 flex items-center gap-2"
        >
          <input
            autoFocus
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            placeholder="e.g. Alcohol swabs"
            maxLength={40}
            className="h-11 min-w-0 flex-1 rounded-xl border border-[#eee5d5] bg-white px-3 text-base text-[#443229] placeholder:text-[#a8977c] focus:outline-none focus:ring-2 focus:ring-[#a98559]"
          />
          <button
            type="submit"
            disabled={!draftName.trim()}
            className="h-11 shrink-0 rounded-xl bg-[#a98559] px-4 text-sm font-bold text-white transition disabled:opacity-40"
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
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[#806d51] transition hover:bg-[#f4ead8]"
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </form>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8c3a0] text-sm font-bold text-[#80633e] transition hover:bg-[#f4ead8]"
        >
          <PlusIcon className="h-4 w-4" />
          Add item
        </button>
      )}
    </section>
  );
}
