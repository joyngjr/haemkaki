import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, type Profile, type ProfileDraft } from "@/lib/api";
import { ProfileContext, type ProfileStatus } from "@/state/profile-context";

const LEGACY_PROFILE_PREFIX = "hackitrx.profileDetails.";
const LEGACY_ACTIVE_KEY = "hackitrx.activeProfileId";

function clearLegacyProfileStorage(): void {
  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index);
      if (key?.startsWith(LEGACY_PROFILE_PREFIX)) window.localStorage.removeItem(key);
    }
    window.localStorage.removeItem(LEGACY_ACTIVE_KEY);
  } catch {
    // Storage can be unavailable in private browsing. Nothing is written here.
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [status, setStatus] = useState<ProfileStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const applyLoaded = useCallback((loaded: Profile[]) => {
    setProfiles(loaded);
    setError(null);
    setStatus("ready");
  }, []);

  const applyFailure = useCallback((cause: unknown) => {
    setError(cause instanceof Error ? cause.message : "Could not reach the API");
    setStatus("error");
  }, []);

  const reload = useCallback(
    () => api.listProfiles().then(applyLoaded, applyFailure),
    [applyLoaded, applyFailure],
  );

  useEffect(() => {
    clearLegacyProfileStorage();
  }, []);

  useEffect(() => {
    let cancelled = false;
    api.listProfiles().then(
      (loaded) => {
        if (!cancelled) applyLoaded(loaded);
      },
      (cause: unknown) => {
        if (!cancelled) applyFailure(cause);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [applyLoaded, applyFailure]);

  const selectProfile = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  const createProfile = useCallback(
    async (draft: ProfileDraft) => {
      const created = await api.createProfile(draft);
      setProfiles((current) => [...current, created]);
      selectProfile(created.id);
      return created;
    },
    [selectProfile],
  );

  const updateProfile = useCallback(async (id: number, patch: Partial<ProfileDraft>) => {
    const updated = await api.updateProfile(id, patch);
    setProfiles((current) => current.map((p) => (p.id === updated.id ? updated : p)));
    return updated;
  }, []);

  // Selection is session-only; profiles themselves always come from the API.
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null,
    [profiles, activeId],
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      status,
      error,
      selectProfile,
      createProfile,
      updateProfile,
      reload,
    }),
    [profiles, activeProfile, status, error, selectProfile, createProfile, updateProfile, reload],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
