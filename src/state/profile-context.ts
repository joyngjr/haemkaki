import { createContext, useContext } from "react";

import type { Profile, ProfileDraft } from "@/lib/api";

export type ProfileStatus = "loading" | "ready" | "error";

export type ProfileContextValue = {
  profiles: Profile[];
  activeProfile: Profile | null;
  status: ProfileStatus;
  error: string | null;
  selectProfile: (id: number) => void;
  createProfile: (draft: ProfileDraft) => Promise<Profile>;
  updateProfile: (id: number, patch: Partial<ProfileDraft>) => Promise<Profile>;
  deleteProfile: (id: number) => Promise<void>;
  reload: () => Promise<void>;
};

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfiles(): ProfileContextValue {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("useProfiles must be used inside <ProfileProvider>");
  return value;
}
