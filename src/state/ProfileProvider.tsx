import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, type Profile, type ProfileDraft } from "@/lib/api";
import { ProfileContext, type ProfileStatus } from "@/state/profile-context";

/** Which household member the app is showing. The profiles themselves always come from the API. */
const ACTIVE_KEY = "haemkaki.activeProfileId";

function readActiveId(): number | null {
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    const id = raw === null ? Number.NaN : Number(raw);
    return Number.isInteger(id) ? id : null;
  } catch {
    return null;
  }
}

function writeActiveId(id: number | null): void {
  try {
    if (id === null) window.localStorage.removeItem(ACTIVE_KEY);
    else window.localStorage.setItem(ACTIVE_KEY, String(id));
  } catch {
    // Selection then lasts for the session only, which is what it was before.
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeId, setActiveId] = useState<number | null>(readActiveId);
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
    writeActiveId(id);
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

  const deleteProfile = useCallback(async (id: number) => {
    await api.deleteProfile(id);
    setProfiles((current) => current.filter((profile) => profile.id !== id));
    setActiveId((current) => {
      if (current !== id) return current;
      writeActiveId(null);
      return null;
    });
  }, []);

  // The remembered id may belong to a profile deleted from another device;
  // the first profile is the fallback, as it always was.
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
      deleteProfile,
      reload,
    }),
    [
      profiles,
      activeProfile,
      status,
      error,
      selectProfile,
      createProfile,
      updateProfile,
      deleteProfile,
      reload,
    ],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
