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
  /** The board's dose button was pressed: log today's dose. */
  onDoseTaken: () => void;
  /** The board's + and − settled on a count: file it as today's stock count. */
  onCount: (vials: number) => void;
};

/** How long after a change to wait before telling the board, so a burst of writes sends once. */
const SYNC_DELAY_MS = 300;
/** How long the board must be quiet after a press before the count it shows is filed. */
const COUNT_QUIET_MS = 1000;

function describe(cause: unknown, fallback: string) {
  return cause instanceof Error && cause.message ? cause.message : fallback;
}

/**
 * The dose device for this page: reconnects to a board the site was already
 * allowed to use, keeps its display level with the ledger and the schedule,
 * logs a dose when its dose button is pressed, files a count its + and −
 * settle on, and sounds its reminder once a day while a dose is due.
 *
 * The ledger is the source of truth. Until the page has sent the board its
 * own figure, a count the board reports is whatever it booted with, and is
 * answered with the app's. After that the board reports the whole count after
 * each press; once it has been quiet for a moment, the count is filed as
 * today's stock count — a ledger row like any other, visible and editable on
 * the calendar — and the fold's answer is sent back, which the board already
 * shows. A count the app moves itself in the meantime wins, and the board is
 * told.
 */
export function useDevice({
  todayKey,
  vials,
  dateLabel,
  doseDue,
  onDoseTaken,
  onCount,
}: Options): Device {
  const supported = isDeviceSupported();
  const link = useRef<DeviceLink | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The read loop outlives any one render, so it reads the latest of these
  // (kept current after each commit, which is soon enough for a serial line).
  const latest = useRef({ vials, onDoseTaken, onCount });
  useEffect(() => {
    latest.current = { vials, onDoseTaken, onCount };
  });
  /** The count last sent over this link, once one has been: the board is in step from then on. */
  const lastSent = useRef<number | undefined>(undefined);
  /** A count the board's buttons are still settling on. */
  const countTimer = useRef<number | undefined>(undefined);

  const adopt = useCallback((next: DeviceLink | null) => {
    link.current = next;
    // A new link, or none, is out of step until the display effect has sent the figure.
    lastSent.current = undefined;
    window.clearTimeout(countTimer.current);
    setConnected(next !== null);
  }, []);

  const handlers = useMemo<DeviceHandlers>(
    () => ({
      onDoseTaken: () => latest.current.onDoseTaken(),
      onVials: (count) => {
        const mine = latest.current.vials;
        // Whatever the board was settling on, this is what it shows now.
        window.clearTimeout(countTimer.current);
        if (mine === undefined || count === mine) return;
        if (lastSent.current === undefined) {
          // Not in step yet: the board's number is what it booted with.
          void link.current?.send(`SET_VIALS:${mine}`).catch(() => undefined);
          return;
        }
        countTimer.current = window.setTimeout(() => latest.current.onCount(count), COUNT_QUIET_MS);
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
      window.clearTimeout(countTimer.current);
      detachDevice(link.current);
    };
  }, [supported, handlers, adopt]);

  // The display follows the ledger and the schedule.
  useEffect(() => {
    if (!connected) return;
    const timer = window.setTimeout(() => {
      const open = link.current;
      if (!open) return;
      const update = async () => {
        if (vials !== undefined) {
          // The app moved the count itself, so a press the board made against
          // the old figure is stale: the board is told the new one instead.
          if (vials !== lastSent.current) window.clearTimeout(countTimer.current);
          await open.send(`SET_VIALS:${vials}`);
          lastSent.current = vials;
        }
        await open.send(`SET_DATE:${dateLabel}`);
      };
      update().catch((cause: unknown) => setError(describe(cause, "Could not update the device")));
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
