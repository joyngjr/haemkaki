import { Outlet } from "react-router-dom";

import { BottomNav } from "@/components/nav/BottomNav";

/**
 * The frame every page renders inside: the mobile column, the tab bar, and the
 * three routed tabs.
 *
 * `pb-28` keeps the last card on a page clear of the fixed BottomNav.
 */
export function AppLayout() {
  return (
    <div className="min-h-screen bg-sand-50">
      <main className="mx-auto max-w-md pb-28 sm:px-4">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  );
}
