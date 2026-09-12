import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { Home } from "@/pages/Home";
import { Tips } from "@/pages/Tips";
import { Tracker } from "@/pages/Tracker";
import { MedicalId } from "@/pages/MedicalId";
import { InjectionGuide } from "@/pages/InjectionGuide";
import { FindMedicalHelp } from "@/pages/FindMedicalHelp";
import { Community } from "@/pages/Community";
import { ProfileProvider } from "@/state/ProfileProvider";
import { IntravenousInjection } from "@/pages/IntravenousInjection";
import { SubcutaneousInjection } from "@/pages/SubcutaneousInjection";
import { PortACathInjection } from "@/pages/PortACathInjection";

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="tips" element={<Tips />} />
            <Route path="tips/medical-id" element={<MedicalId />} />
            <Route path="tips/injection-guide" element={<InjectionGuide />} />
            <Route path="tips/injection-guide/intravenous" element={<IntravenousInjection />} />
            <Route path="tips/injection-guide/subcutaneous" element={<SubcutaneousInjection />} />
            <Route path="tips/injection-guide/port-a-cath" element={<PortACathInjection />} />
            <Route path="tips/find-medical-help" element={<FindMedicalHelp />} />
            <Route path="tips/community" element={<Community />} />
            {/* Anything unrecognised lands back on the den. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}
