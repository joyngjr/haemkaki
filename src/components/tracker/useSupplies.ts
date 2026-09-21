import { useCallback, useEffect, useRef, useState } from "react";

import { api, type SupplyItemDraft } from "@/lib/api";

/** One row on the Inventory card. `key` is local and stable; the server's id is never needed. */
export type Supply = { key: string; name: string; quantity: number };

export type Supplies = {
  items: Supply[];
  /** Apply a change locally and send the whole list to the server. The updater must be pure. */
  update: (updater: (current: Supply[]) => Supply[]) => void;
  isLoading: boolean;
  error: string | null;
};

let nextKey = 0;
const newKey = () => `supply-${Date.now()}-${nextKey++}`;

/**
 * The Inventory card's list, backed by `/users/{id}/supplies`.
 *
 * The API replaces the whole list on every write, which keeps this simpler
 * than `useLedger`: each change is applied locally at once and the full list
 * is queued to the server, one write at a time, so a burst of taps on "+"
 * lands in order. A failed write reloads the list the server actually holds
 * and says why above the card.
 */
export function useSupplies(profileId: number | undefined): Supplies {
  const [items, setItems] = useState<Supply[]>([]);
  const [isLoading, setIsLoading] = useState(profileId !== undefined);
  const [error, setError] = useState<string | null>(null);
  /** What the screen shows right now; updates are computed from this, not from a stale closure. */
  const latest = useRef<Supply[]>([]);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const adopt = useCallback((loaded: Supply[]) => {
    latest.current = loaded;
    setItems(loaded);
  }, []);

  useEffect(() => {
    if (profileId === undefined) return;
    let cancelled = false;
    api.listSupplies(profileId).then(
      (loaded) => {
        if (cancelled) return;
        adopt(loaded.map(({ name, quantity }) => ({ key: newKey(), name, quantity })));
        setError(null);
        setIsLoading(false);
      },
      (cause: unknown) => {
        if (cancelled) return;
        setError(cause instanceof Error ? cause.message : "Could not load your supplies");
        setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [profileId, adopt]);

  const update = useCallback(
    (updater: (current: Supply[]) => Supply[]) => {
      if (profileId === undefined) return;
      const next = updater(latest.current);
      adopt(next);
      const drafts: SupplyItemDraft[] = next.map(({ name, quantity }) => ({ name, quantity }));
      queue.current = queue.current
        .then(async () => {
          await api.replaceSupplies(profileId, drafts);
          setError(null);
        })
        .catch(async (cause: unknown) => {
          setError(cause instanceof Error ? cause.message : "Could not save your supplies");
          // Put the card back on what the server actually has.
          const saved = await api.listSupplies(profileId).catch(() => null);
          if (saved) adopt(saved.map(({ name, quantity }) => ({ key: newKey(), name, quantity })));
        });
    },
    [profileId, adopt],
  );

  return { items, update, isLoading, error };
}
