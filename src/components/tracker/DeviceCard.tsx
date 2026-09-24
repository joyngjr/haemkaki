import { OutlineButton } from "@/components/ui/Button";
import { Card, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

import type { Device } from "./useDevice";

/**
 * "Dose device" — the USB board that shows the vials at home and the next
 * dose, and logs a dose at the press of its button. Only rendered where the
 * browser can open a serial port, which is Chrome and Edge on a desktop; a
 * phone never sees it.
 *
 * Pairing needs a click, because the browser's port picker will not open on
 * its own. After that the site reconnects on load without asking.
 */
export function DeviceCard({ device, className }: { device: Device; className?: string }) {
  if (!device.supported) return null;
  const { connected } = device;

  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>Dose device</CardTitle>
          <p className="mt-1 flex items-center gap-2 text-sm text-ink-muted">
            <span
              className={cn("h-2 w-2 rounded-full", connected ? "bg-moss-600" : "bg-sand-300")}
              aria-hidden="true"
            />
            {connected ? "Connected" : "Not connected"}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          {connected ? (
            <OutlineButton className="h-11 px-4 text-sm" onClick={() => void device.ring()}>
              Test reminder
            </OutlineButton>
          ) : null}
          <OutlineButton
            className="h-11 px-4 text-sm"
            onClick={() => void (connected ? device.disconnect() : device.connect())}
          >
            {connected ? "Disconnect" : "Connect"}
          </OutlineButton>
        </div>
      </div>
      {device.error ? (
        <p role="status" className="mt-3 text-sm text-brick-600">
          {device.error}
        </p>
      ) : null}
    </Card>
  );
}
