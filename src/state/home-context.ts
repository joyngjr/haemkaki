import { createContext, useContext } from "react";

import type {
  AdministerDosePayload,
  HomeDashboardData,
  MoveDosePayload,
  SaveResult,
} from "@/lib/home-data";

export type HomeDataContextValue = {
  /** Null until a profile is active — Home shows an empty state, not a demo person. */
  data: HomeDashboardData | null;
  /** Injectable clock, so relative times are deterministic during a demo. */
  now: Date;
  /** True until the profile list resolves, so Home can hold the skeleton. */
  isLoading: boolean;
  /** Records a prophylaxis dose in the ledger, on the given Singapore day. */
  administerDose: (payload: AdministerDosePayload) => Promise<SaveResult>;
  /** Moves the next planned dose to another day — a calendar exception on the routine. */
  moveNextDose: (payload: MoveDosePayload) => Promise<SaveResult>;
  /** Re-read the folded status. Home calls it on mount so a dose logged on the tracker shows up. */
  refreshStatus: () => Promise<void>;
};

export const HomeDataContext = createContext<HomeDataContextValue | null>(null);

export function useHomeData(): HomeDataContextValue {
  const value = useContext(HomeDataContext);
  if (!value) throw new Error("useHomeData must be used inside <HomeDataProvider>");
  return value;
}
