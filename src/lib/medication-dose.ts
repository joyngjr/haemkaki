import type { MedicationDetails } from "@/lib/api";

/** Display a stored medication dose, with natural vial singular/plural. */
export function medicationDoseLabel(
  medication: Pick<MedicationDetails, "dose" | "unit"> | null | undefined,
): string | undefined {
  if (!medication?.dose || !medication.unit) return undefined;
  if (/^vials?$/i.test(medication.unit.trim())) {
    return `${medication.dose} ${Number(medication.dose) === 1 ? "vial" : "vials"}`;
  }
  return `${medication.dose} ${medication.unit}`;
}

/** A valid whole-vial prophylaxis amount that can seed the tracker routine. */
export function medicationVialCount(
  medication: Pick<MedicationDetails, "dose" | "unit"> | null | undefined,
): number | undefined {
  if (!medication || !/^vials?$/i.test(medication.unit.trim())) return undefined;
  const count = Number(medication.dose);
  return Number.isInteger(count) && count > 0 && count <= 99 ? count : undefined;
}
