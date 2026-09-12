import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";

import { BottomNav } from "@/components/nav/BottomNav";
import { ProfileSheet } from "@/components/profile/ProfileSheet";
import { QuickLogSheet } from "@/components/quick-log/QuickLogSheet";
import { useHomeData } from "@/state/home-context";

/**
 * The frame every page renders inside: the mobile column, the tab bar, and the
 * two sheets the tab bar opens.
 *
 * Quick Log and the profile switcher live here rather than on a page because
 * the bar is fixed to every route — pressing Kaki from the tracker has to open
 * the same sheet it opens from Home.
 *
 * `pb-28` keeps the last card on a page clear of the fixed BottomNav.
 */
export function AppLayout() {
  const { data, now, administerDose, logBleed } = useHomeData();
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const quickLogButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <div className="min-h-screen bg-sand-50">
      <main className="mx-auto max-w-md pb-28 sm:px-4">
        <Outlet />
      </main>

      <BottomNav
        onOpenQuickLog={() => setQuickLogOpen(true)}
        onOpenProfile={() => setProfileOpen(true)}
        quickLogButtonRef={quickLogButtonRef}
      />

      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        treatment={data.treatmentStatus}
        now={now}
        onAdministerDose={administerDose}
        onLogBleed={logBleed}
        returnFocusRef={quickLogButtonRef}
      />
      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
