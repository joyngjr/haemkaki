import type { ReactNode } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { useIsDesktop } from "@/lib/use-media-query";
import { Dashboard } from "@/pages/Dashboard";
import Home from "@/pages/Home";
import { Tracker } from "@/pages/Tracker";
import { FindMedicalHelp } from "@/pages/tips/FindMedicalHelp";
import { MedicalId } from "@/pages/tips/MedicalId";
import { Tips } from "@/pages/tips/Tips";
import { InjectionGuide } from "@/pages/tips/injection/InjectionGuide";
import { Intravenous } from "@/pages/tips/injection/Intravenous";
import { PortACath } from "@/pages/tips/injection/PortACath";
import { Subcutaneous } from "@/pages/tips/injection/Subcutaneous";
import { HomeDataProvider } from "@/state/HomeDataProvider";
import { ProfileProvider } from "@/state/ProfileProvider";

/**
 * A phone gets one screen per tab. From `lg` the three tabs are one page, so
 * the tracker and Resources routes become sections of it.
 */
function BySize({ phone, desktop }: { phone: ReactNode; desktop: ReactNode }) {
  return <>{useIsDesktop() ? desktop : phone}</>;
}

export default function App() {
  return (
    <ProfileProvider>
      {/* Above the router so Home state is shared by routed screens. */}
      <HomeDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<BySize phone={<Home />} desktop={<Dashboard />} />} />
              {/* Supply — factor at home and the inventory — lives inside the
                  tracker at every size, so it has no route of its own. */}
              <Route
                path="tracker"
                element={
                  <BySize phone={<Tracker />} desktop={<Navigate to="/#calendar" replace />} />
                }
              />

              {/* Tips and its subpages. The folders under src/pages mirror these.
                  The tab bar labels this section "Resources". The subpages stay
                  pages of their own at every size. */}
              <Route
                path="tips"
                element={
                  <BySize phone={<Tips />} desktop={<Navigate to="/#resources" replace />} />
                }
              />
              <Route path="tips/medical-id" element={<MedicalId />} />
              <Route path="tips/injection-guide" element={<InjectionGuide />} />
              <Route path="tips/injection-guide/intravenous" element={<Intravenous />} />
              <Route path="tips/injection-guide/subcutaneous" element={<Subcutaneous />} />
              <Route path="tips/injection-guide/port-a-cath" element={<PortACath />} />
              <Route path="tips/find-medical-help" element={<FindMedicalHelp />} />

              {/* Anything unrecognised lands back on the den. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HomeDataProvider>
    </ProfileProvider>
  );
}
