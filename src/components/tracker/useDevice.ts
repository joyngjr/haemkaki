import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  attachDevice,
  detachDevice,
  isDeviceSupported,
  pairDevice,
  type DeviceHandlers,
  type DeviceLink,
} from "@/lib/arduino";

export type Device = {
  /** Web Serial is only in Chrome and Edge on desktop; nothing is shown elsewhere. */
  supported: boolean;
  connected: boolean;
  /** Why the last connect or send failed, or null. */
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  /** Sound the reminder on the board now. */
  ring: () => Promise<void>;
};

type Options = {
  /** Today's `YYYY-MM-DD`, which the once-a-day reminder is keyed on. */
  todayKey: string;
  /** Vials at home as the ledger folds them — what the board's display shows. */
  vials: number | undefined;
  /** What the display shows as the next dose, already formatted. */
  dateLabel: string;
  /** A planned dose is due or overdue and nothing has been logged today. */
  doseDue: boolean;
  /** The board's button was pressed: log today's dose. */
  onDoseTaken: () => void;
};

/** How long after a change to wait before telling the board, so a burst of writes sends once. */
const SYNC_DELAY_MS = 300;

function describe(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/**
 * The dose device for this page: reconnects to a board the site was already
 * allowed to use, keeps its display level with the ledger and the schedule,
 * logs a dose when its button is pressed, and sounds its reminder once a day
 * while a dose is due.
 *
 * The ledger is the source of truth. A count the board reports that differs
 * from the app's is answered with the app's, never adopted — the board is a
 * display and a button, not a second cupboard.
 */
export function useDevice({ todayKey, vials, dateLabel, doseDue, onDoseTaken }: Options): Device {
  const supported = isDeviceSupported();
  const link = useRef<DeviceLink | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The read loop outlives any one render, so it reads the latest of these
  // (kept current after each commit, which is soon enough for a serial line).
  const latest = useRef({ vials, onDoseTaken });
  useEffect(() => {
    latest.current = { vials, onDoseTaken };
  });

  const adopt = useCallback((next: DeviceLink | null) => {
    link.current = next;
    setConnected(next !== null);
  }, []);

  const handlers = useMemo<DeviceHandlers>(
    () => ({
      onDoseTaken: () => latest.current.onDoseTaken(),
      onVials: (count) => {
        const mine = latest.current.vials;
        if (mine !== undefined && count !== mine) {
          void link.current?.send(`SET_VIALS:${mine}`).catch(() => undefined);
        }
      },
      onClose: (closed) => {
        if (link.current === closed) adopt(null);
      },
    }),
    [adopt],
  );

  // Attach to a board this site was already allowed to use, without a prompt.
  useEffect(() => {
    if (!supported) return;
    let active = true;
    attachDevice(handlers).then(
      (found) => {
        if (active) adopt(found);
      },
      () => {
        // In use by another tab, or unplugged since it was granted. Stay off.
      },
    );
    return () => {
      active = false;
      detachDevice(link.current);
    };
  }, [supported, handlers, adopt]);

  // The display follows the ledger and the schedule.
  useEffect(() => {
    if (!connected) return;
    const timer = window.setTimeout(() => {
      const open = link.current;
      if (!open) return;
      const lines = [`SET_DATE:${dateLabel}`];
      if (vials !== undefined) lines.unshift(`SET_VIALS:${vials}`);
      lines
        .reduce((chain, line) => chain.then(() => open.send(line)), Promise.resolve())
        .catch((cause: unknown) => setError(describe(cause, "Could not update the device")));
    }, SYNC_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [connected, vials, dateLabel]);

  // Once a day: the reminder sounds while a dose is due and nothing is logged.
  const alertedOn = useRef<string | null>(null);
  useEffect(() => {
    if (!connected || !doseDue || alertedOn.current === todayKey) return;
    alertedOn.current = todayKey;
    void link.current?.send("DOSE_ALERT_ON").catch(() => undefined);
  }, [connected, doseDue, todayKey]);

  const connect = useCallback(async () => {
    setError(null);
    try {
      const paired = await pairDevice(handlers);
      if (paired) adopt(paired);
    } catch (cause) {
      setError(describe(cause, "Could not connect to the device"));
    }
  }, [handlers, adopt]);

  const disconnect = useCallback(async () => {
    const open = link.current;
    adopt(null);
    await open?.close();
  }, [adopt]);

  const ring = useCallback(async () => {
    try {
      await link.current?.send("DOSE_ALERT_ON");
    } catch (cause) {
      setError(describe(cause, "Could not reach the device"));
    }
  }, []);

  return { supported, connected, error, connect, disconnect, ring };
}
