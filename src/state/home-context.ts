import { createContext, useContext } from "react";

import type { Status } from "@/lib/api";
import type {
  AdministerDosePayload,
  HomeDashboardData,
  SaveResult,
  SetUpRoutinePayload,
} from "@/lib/home-data";

export type HomeDataContextValue = {
  /** Null until a profile is active — Home shows an empty state, not a demo person. */
  data: HomeDashboardData | null;
  /**
   * The active profile's fold as the API returned it, null until it lands.
   * The tracker reads this rather than fetching its own copy, so the status
   * card and the supply card can never show two different vial counts.
   */
  status: Status | null;
  /** Why the last status read failed, or null. Home stays quiet; the tracker shows it. */
  statusError: string | null;
  /** Injectable clock, so relative times are deterministic during a demo. */
  now: Date;
  /** True until the profile list resolves, so Home can hold the skeleton. */
  isLoading: boolean;
  /** Bumped after `administerDose` or `setUpRoutine` lands, so the tracker can re-read. */
  writeVersion: number;
  /** Records a prophylaxis dose in the ledger, on the given Singapore day. */
  administerDose: (payload: AdministerDosePayload) => Promise<SaveResult>;
  /** Starts the first routine, and stores the order buffer and day asked for with it. */
  setUpRoutine: (payload: SetUpRoutinePayload) => Promise<SaveResult>;
  /** Re-read the folded status. Home calls it on mount, and the tracker after each of its writes. */
  refreshStatus: () => Promise<void>;
};

export const HomeDataContext = createContext<HomeDataContextValue | null>(null);

export function useHomeData(): HomeDataContextValue {
  const value = useContext(HomeDataContext);
  if (!value) throw new Error("useHomeData must be used inside <HomeDataProvider>");
  return value;
}
