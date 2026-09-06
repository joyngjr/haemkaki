import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { Home } from "@/pages/Home";
import { Tips } from "@/pages/Tips";
import { Tracker } from "@/pages/Tracker";
import { ProfileProvider } from "@/state/ProfileProvider";

export default function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Home />} />
            <Route path="tracker" element={<Tracker />} />
            <Route path="tips" element={<Tips />} />
            {/* Anything unrecognised lands back on the den. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}
