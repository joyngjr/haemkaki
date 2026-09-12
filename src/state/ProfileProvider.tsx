import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, type Profile, type ProfileDraft } from "@/lib/api";
import { ProfileContext, type ProfileStatus } from "@/state/profile-context";

/** Which profile the device was last left on. Survives reloads, not devices. */
const ACTIVE_KEY = "hackitrx.activeProfileId";

function readStoredId(): number | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    const id = raw === null ? NaN : Number(raw);
    return Number.isInteger(id) ? id : null;
  } catch {
    // Private browsing can throw on access. A forgotten selection is harmless.
    return null;
  }
}

function storeId(id: number | null): void {
  try {
    if (id === null) window.localStorage.removeItem(ACTIVE_KEY);
    else window.localStorage.setItem(ACTIVE_KEY, String(id));
  } catch {
    /* not worth surfacing */
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<number | null>(readStoredId);
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
    storeId(id);
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

  // The stored id can point at a profile that was deleted elsewhere, so fall
  // back to the first one rather than showing an empty den to someone who has
  // profiles.
  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null,
    [profiles, activeId],
  );

  useEffect(() => {
    if (activeProfile && activeProfile.id !== activeId) storeId(activeProfile.id);
  }, [activeProfile, activeId]);

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
