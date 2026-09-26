/**
 * The dose device: an Arduino Uno on USB, spoken to with the Web Serial API.
 *
 * The browser talks to the board directly; the server never sees it. The
 * board sends one line per event — `DOSE_TAKEN` when its dose button is
 * pressed, `VIALS:<n>` for what its display shows, after each press of its
 * + and − — and the page sends `SET_VIALS:<n>`, `SET_DATE:<text>` and
 * `DOSE_ALERT_ON`. What a `VIALS:` line means is `useDevice`'s call: it is
 * answered with the app's figure until the board is in step, and filed as a
 * stock count after. Whichever profile is active in the browser is the one a
 * device dose or count is logged against.
 *
 * Only Chrome and Edge on desktop have the API, and only on HTTPS or
 * localhost. `isDeviceSupported` gates every caller, so the phone build never
 * shows a device at all.
 *
 * One link at a time lives at module level rather than in a component: a
 * port that is open cannot be opened again, and React mounts the tracker
 * twice in development, so the page attaches to whatever is already open
 * instead of racing itself for the port.
 */

const BAUD_RATE = 9600;
/** An Uno reboots when its port opens; anything sent before this is lost. */
const BOOT_DELAY_MS = 2000;

export type DeviceHandlers = {
  /** The board's button was pressed. */
  onDoseTaken: () => void;
  /** The board reported what its display shows. */
  onVials: (count: number) => void;
  /** The port went away: unplugged, or closed by the page. */
  onClose: (link: DeviceLink) => void;
};

const SILENT: DeviceHandlers = {
  onDoseTaken: () => undefined,
  onVials: () => undefined,
  onClose: () => undefined,
};

export function isDeviceSupported(): boolean {
  return typeof navigator !== "undefined" && navigator.serial !== undefined;
}

/** "24 Sep" — the date as the board's display shows it. */
export function formatDeviceDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** An open port and its read loop. `close()` ends the loop and releases the port. */
export class DeviceLink {
  handlers: DeviceHandlers;
  private closing = false;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private piped: Promise<void> = Promise.resolve();

  constructor(
    private readonly port: SerialPort,
    handlers: DeviceHandlers,
  ) {
    this.handlers = handlers;
    void this.read();
  }

  async send(line: string): Promise<void> {
    if (!this.port.writable) return;
    const writer = this.port.writable.getWriter();
    try {
      await writer.write(new TextEncoder().encode(`${line}\n`));
    } finally {
      writer.releaseLock();
    }
  }

  async close(): Promise<void> {
    if (this.closing) return;
    this.closing = true;
    try {
      await this.reader?.cancel();
      await this.piped;
      await this.port.close();
    } catch {
      // Already gone: an unplugged board closes itself.
    }
  }

  private async read(): Promise<void> {
    if (!this.port.readable) return;
    const decoder = new TextDecoderStream();
    // The decoder takes any buffer; the port hands it bytes. The pipe rejects
    // when the board is unplugged, which is the close signal.
    this.piped = this.port.readable
      .pipeTo(decoder.writable as WritableStream<Uint8Array>)
      .catch(() => undefined);
    this.reader = decoder.readable.getReader();
    let buffer = "";
    try {
      for (;;) {
        const { value, done } = await this.reader.read();
        if (done) break;
        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        lines.forEach((raw) => this.handle(raw.trim()));
      }
    } catch {
      // Same as `done`: the stream errors when the board goes away.
    } finally {
      if (!this.closing) {
        this.closing = true;
        await this.piped;
        await this.port.close().catch(() => undefined);
      }
      if (current === this) current = null;
      this.handlers.onClose(this);
    }
  }

  private handle(line: string) {
    if (line === "DOSE_TAKEN") {
      this.handlers.onDoseTaken();
    } else if (line.startsWith("VIALS:")) {
      const count = Number.parseInt(line.slice("VIALS:".length), 10);
      if (Number.isFinite(count)) this.handlers.onVials(count);
    }
  }
}

let current: DeviceLink | null = null;
let opening: Promise<DeviceLink | null> | null = null;

async function open(port: SerialPort, handlers: DeviceHandlers): Promise<DeviceLink> {
  await port.open({ baudRate: BAUD_RATE });
  await new Promise((resolve) => setTimeout(resolve, BOOT_DELAY_MS));
  current = new DeviceLink(port, handlers);
  return current;
}

/**
 * The link that is already open, or a fresh one to a board this site was
 * allowed to use before. Null when there is none plugged in. Never prompts.
 */
export function attachDevice(handlers: DeviceHandlers): Promise<DeviceLink | null> {
  if (current) {
    current.handlers = handlers;
    return Promise.resolve(current);
  }
  if (opening) return opening;
  const serial = navigator.serial;
  if (!serial) return Promise.resolve(null);
  opening = serial
    .getPorts()
    .then(([port]) => (port ? open(port, handlers) : null))
    .finally(() => {
      opening = null;
    });
  return opening;
}

/** Ask for a port with the browser's picker. Null when the person dismissed it. */
export async function pairDevice(handlers: DeviceHandlers): Promise<DeviceLink | null> {
  const serial = navigator.serial;
  if (!serial) return null;
  if (current) await current.close();
  let port: SerialPort;
  try {
    port = await serial.requestPort();
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === "NotFoundError") return null;
    throw cause;
  }
  return open(port, handlers);
}

/** Stop calling into a page that is going away, but leave the port open for the next one. */
export function detachDevice(link: DeviceLink | null): void {
  if (link) link.handlers = SILENT;
}
