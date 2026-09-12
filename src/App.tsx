import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { Home } from "@/pages/Home";
import { Tracker } from "@/pages/Tracker";
import { Community } from "@/pages/tips/Community";
import { FindMedicalHelp } from "@/pages/tips/FindMedicalHelp";
import { MedicalId } from "@/pages/tips/MedicalId";
import { Tips } from "@/pages/tips/Tips";
import { InjectionGuide } from "@/pages/tips/injection/InjectionGuide";
import { Intravenous } from "@/pages/tips/injection/Intravenous";
import { PortACath } from "@/pages/tips/injection/PortACath";
import { Subcutaneous } from "@/pages/tips/injection/Subcutaneous";
import { HomeDataProvider } from "@/state/HomeDataProvider";
import { ProfileProvider } from "@/state/ProfileProvider";

export default function App() {
  return (
    <ProfileProvider>
      {/* Above the router: the tab bar's Quick Log sheet writes to Home's data
          from whichever page is showing. */}
      <HomeDataProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="tracker" element={<Tracker />} />

              {/* Tips and its subpages. The folders under src/pages mirror these.
                  The tab bar labels this section "Resources". */}
              <Route path="tips" element={<Tips />} />
              <Route path="tips/medical-id" element={<MedicalId />} />
              <Route path="tips/injection-guide" element={<InjectionGuide />} />
              <Route path="tips/injection-guide/intravenous" element={<Intravenous />} />
              <Route path="tips/injection-guide/subcutaneous" element={<Subcutaneous />} />
              <Route path="tips/injection-guide/port-a-cath" element={<PortACath />} />
              <Route path="tips/find-medical-help" element={<FindMedicalHelp />} />
              <Route path="tips/community" element={<Community />} />

              {/* Anything unrecognised lands back on the den. */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </HomeDataProvider>
    </ProfileProvider>
  );
}
