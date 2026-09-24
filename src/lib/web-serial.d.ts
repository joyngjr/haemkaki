/**
 * The slice of the Web Serial API the dose device uses. TypeScript's DOM
 * library does not ship these; Chrome and Edge on desktop implement them, and
 * `navigator.serial` is simply absent everywhere else.
 */
interface SerialPortOpenOptions {
  baudRate: number;
}

interface SerialPort {
  readonly readable: ReadableStream<Uint8Array> | null;
  readonly writable: WritableStream<Uint8Array> | null;
  open(options: SerialPortOpenOptions): Promise<void>;
  close(): Promise<void>;
}

interface Serial {
  /** The ports this site was already allowed to use and that are plugged in now. No prompt. */
  getPorts(): Promise<SerialPort[]>;
  /** The browser's port picker. Needs a user gesture; rejects with NotFoundError when dismissed. */
  requestPort(): Promise<SerialPort>;
}

interface Navigator {
  readonly serial?: Serial;
}
