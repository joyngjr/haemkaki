import { useState } from "react";

import { frequencyKey, type Frequency } from "@/lib/tracker-dates";

/** The prophylaxis routine: how much, how often, and from when. */
export type Routine = {
  vials: number | undefined;
  frequency: Frequency | undefined;
  startDate: Date | undefined;
};

export type RoutineProps = {
  /** Regular prophylaxis dose in vials, set during profile creation. Undefined until that flow exists. */
  regularProphylaxisVials?: number;
  /** Date of the last regular prophylaxis dose, set during profile creation. Undefined until that flow exists. */
  lastRegularProphylaxisDate?: Date;
  /** How often regular prophylaxis is due (every N days, or fixed weekdays), set during profile creation. Undefined until that flow exists. */
  regularProphylaxisFrequency?: Frequency;
  /** Called when the user edits the dosage from "Your Current Routine" — wire this to the profile store to keep them in sync. */
  onRegularProphylaxisVialsChange?: (vials: number) => void;
  /** Called when the user edits the effective start date from "Your Current Routine". */
  onLastRegularProphylaxisDateChange?: (date: Date | undefined) => void;
  /** Called when the user edits the frequency from "Your Current Routine". */
  onRegularProphylaxisFrequencyChange?: (frequency: Frequency) => void;
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
  regularProphylaxisFrequency,
  onRegularProphylaxisVialsChange,
  onLastRegularProphylaxisDateChange,
  onRegularProphylaxisFrequencyChange,
}: RoutineProps) {
  const fromProfile: Routine = {
    vials: regularProphylaxisVials,
    frequency: regularProphylaxisFrequency,
    startDate: lastRegularProphylaxisDate,
  };
  const [routine, setRoutine] = useState(fromProfile);
  const [lastFromProfile, setLastFromProfile] = useState(fromProfile);

  if (
    lastFromProfile.vials !== fromProfile.vials ||
    frequencyKey(lastFromProfile.frequency) !== frequencyKey(fromProfile.frequency) ||
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
    setFrequency(frequency: Frequency) {
      setRoutine((current) => ({ ...current, frequency }));
      onRegularProphylaxisFrequencyChange?.(frequency);
    },
    setStartDate(startDate: Date | undefined) {
      setRoutine((current) => ({ ...current, startDate }));
      onLastRegularProphylaxisDateChange?.(startDate);
    },
  };
}
