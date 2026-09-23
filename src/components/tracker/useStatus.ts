import { useEffect, useRef, useState } from "react";

import { api, type Status } from "@/lib/api";

/**
 * The folded status for the tracker: factor on hand, the run-out date and the
 * order advice. Re-read whenever `version` moves — the ledger and the
 * schedule each bump theirs after a write — so the supply card follows the
 * calendar without the page running its own copy of the fold.
 */
export function useStatus(
  profileId: number | undefined,
  version: number,
): { status: Status | null; error: string | null } {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ticket = useRef(0);

  useEffect(() => {
    if (profileId === undefined) return;
    const mine = ++ticket.current;
    api.getStatus(profileId).then(
      (loaded) => {
        if (mine !== ticket.current) return;
        setStatus(loaded);
        setError(null);
      },
      (cause: unknown) => {
        if (mine !== ticket.current) return;
        setError(cause instanceof Error ? cause.message : "Could not load your supply");
      },
    );
  }, [profileId, version]);

  return { status, error };
}
