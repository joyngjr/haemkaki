import { useCallback, useSyncExternalStore } from "react";

/**
 * Tailwind's `lg`. Below it the app is three tabs with a bar along the
 * bottom; from it, everything sits on one page (`pages/Dashboard.tsx`).
 */
const DESKTOP_QUERY = "(min-width: 1024px)";

/** Whether a media query matches right now, re-rendering when that changes. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
