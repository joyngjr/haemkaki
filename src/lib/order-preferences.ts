export type OrderPreferences = {
  bufferVials: number | null;
  orderDayOfMonth: number | null;
};

/**
 * The API currently offers one numeric profile slot for order preferences.
 * Keep whole vials in the integer part and the recurring day in hundredths,
 * so both settings remain profile-backed without changing the wire shape.
 */
export function encodeOrderPreferences(bufferVials: number, orderDayOfMonth: number): number {
  return bufferVials + orderDayOfMonth / 100;
}

export function decodeOrderPreferences(stored: number | null | undefined): OrderPreferences {
  if (stored === null || stored === undefined) {
    return { bufferVials: null, orderDayOfMonth: null };
  }
  const whole = Math.floor(stored);
  const encodedDay = Math.round((stored - whole) * 100);
  if (encodedDay >= 1 && encodedDay <= 31) {
    return { bufferVials: whole, orderDayOfMonth: encodedDay };
  }
  // Older profiles stored only a (sometimes fractional) day buffer.
  return { bufferVials: Math.ceil(stored), orderDayOfMonth: null };
}
