let port: any = null;
let reader: any = null;
let keepReading = false;

export interface ArduinoHandlers {
  onDoseTaken?: () => void;
  onVialsChange?: (vials: number) => void;
  onStatusChange?: (connected: boolean) => void;
}

// 1. Try to automatically reconnect to an already-paired Uno when page loads
export async function tryAutoConnect(handlers: ArduinoHandlers) {
  if (!("serial" in navigator)) return false;

  try {
    const ports = await (navigator as any).serial.getPorts();
    if (ports.length > 0) {
      port = ports[0];
      await port.open({ baudRate: 9600 });
      await new Promise((resolve) => setTimeout(resolve, 2000));
      keepReading = true;
      handlers.onStatusChange?.(true);
      startReadLoop(handlers);
      return true;
    }
  } catch (err) {
    console.warn("Auto-connect did not succeed:", err);
  }
  return false;
}

// 2. Manual connect (only needed the very first time you pair the board)
export async function connectArduino(
  handlers: ArduinoHandlers,
  initialVials?: number,
  nextDate?: string
) {
  if (!("serial" in navigator)) {
    alert("Web Serial is only supported in Google Chrome or Microsoft Edge.");
    return false;
  }

  try {
        port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });

    // Wait 2 seconds for Arduino Uno to finish rebooting
    await new Promise((resolve) => setTimeout(resolve, 2000));

    keepReading = true;
    handlers.onStatusChange?.(true);

    if (initialVials !== undefined) {
      await sendToArduino(`SET_VIALS:${initialVials}`);
    }
    if (nextDate) {
      await sendToArduino(`SET_DATE:${nextDate}`);
    }

    startReadLoop(handlers);
    return true;
  } catch (err: any) {
    if (err.name !== "NotFoundError") {
      console.error("Arduino connection error:", err);
    }
    handlers.onStatusChange?.(false);
    return false;
  }
}

// Helper: continuous loop that listens for messages from the Uno
async function startReadLoop(handlers: ArduinoHandlers) {
  try {
    const textDecoder = new (window as any).TextDecoderStream();
    port.readable.pipeTo(textDecoder.writable);
    reader = textDecoder.readable.getReader();

    let buffer = "";
    while (keepReading) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += value;
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        if (line === "DOSE_TAKEN") {
          handlers.onDoseTaken?.();
        } else if (line.startsWith("VIALS:")) {
          const count = parseInt(line.replace("VIALS:", ""), 10);
          if (!isNaN(count)) {
            handlers.onVialsChange?.(count);
          }
        }
      }
    }
  } catch (err) {
    console.warn("Serial read loop closed:", err);
  }
}

// 3. Disconnect
export async function disconnectArduino(handlers?: ArduinoHandlers) {
  keepReading = false;
  try {
    if (reader) {
      await reader.cancel();
      reader = null;
    }
    if (port) {
      await port.close();
      port = null;
    }
  } catch (err) {
    console.error("Disconnect error:", err);
  } finally {
    handlers?.onStatusChange?.(false);
  }
}

// 4. Send commands to Arduino screen / buzzer
export async function sendToArduino(message: string) {
  if (!port || !port.writable) return;
  try {
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    await writer.write(encoder.encode(message + "\n"));
    writer.releaseLock();
  } catch (err) {
    console.error("Failed to send command to Arduino:", err);
  }
}
