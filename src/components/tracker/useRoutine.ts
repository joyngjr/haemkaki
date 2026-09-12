import { useState } from "react";

/** The prophylaxis routine: how much, how often, and from when. */
export type Routine = {
  vials: number | undefined;
  intervalDays: number | undefined;
  startDate: Date | undefined;
};

export type RoutineProps = {
  /** Regular prophylaxis dose in vials, set during profile creation. Undefined until that flow exists. */
  regularProphylaxisVials?: number;
  /** Date of the last regular prophylaxis dose, set during profile creation. Undefined until that flow exists. */
  lastRegularProphylaxisDate?: Date;
  /** How often regular prophylaxis is due, in days, set during profile creation. Undefined until that flow exists. */
  regularProphylaxisIntervalDays?: number;
  /** Called when the user edits the dosage from "Your Current Routine" — wire this to the profile store to keep them in sync. */
  onRegularProphylaxisVialsChange?: (vials: number) => void;
  /** Called when the user edits the effective start date from "Your Current Routine". */
  onLastRegularProphylaxisDateChange?: (date: Date | undefined) => void;
  /** Called when the user edits the frequency (in days) from "Your Current Routine". */
  onRegularProphylaxisIntervalDaysChange?: (days: number) => void;
};

/**
 * Routine state that the user can edit locally but that the profile owns.
 *
 * Edits are reported upwards through the callbacks; if the profile then pushes
 * a different value back down, the incoming props win. The reset is done during
 * render rather than in an effect so there is never a frame showing the stale
 * value.
 */
export function useRoutine({
  regularProphylaxisVials,
  lastRegularProphylaxisDate,
  regularProphylaxisIntervalDays,
  onRegularProphylaxisVialsChange,
  onLastRegularProphylaxisDateChange,
  onRegularProphylaxisIntervalDaysChange,
}: RoutineProps) {
  const fromProfile: Routine = {
    vials: regularProphylaxisVials,
    intervalDays: regularProphylaxisIntervalDays,
    startDate: lastRegularProphylaxisDate,
  };
  const [routine, setRoutine] = useState(fromProfile);
  const [lastFromProfile, setLastFromProfile] = useState(fromProfile);

  if (
    lastFromProfile.vials !== fromProfile.vials ||
    lastFromProfile.intervalDays !== fromProfile.intervalDays ||
    lastFromProfile.startDate !== fromProfile.startDate
  ) {
    setLastFromProfile(fromProfile);
    setRoutine(fromProfile);
  }

  return {
    routine,
    setVials(vials: number) {
      setRoutine((current) => ({ ...current, vials }));
      onRegularProphylaxisVialsChange?.(vials);
    },
    setIntervalDays(intervalDays: number) {
      setRoutine((current) => ({ ...current, intervalDays }));
      onRegularProphylaxisIntervalDaysChange?.(intervalDays);
    },
    setStartDate(startDate: Date | undefined) {
      setRoutine((current) => ({ ...current, startDate }));
      onLastRegularProphylaxisDateChange?.(startDate);
    },
  };
}
