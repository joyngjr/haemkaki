import { Home } from "@/pages/Home";
import { Tracker } from "@/pages/Tracker";
import { Tips } from "@/pages/Tips";

export default function App() {
  if (window.location.pathname === "/tracker")
    return (
      <Tracker
        regularProphylaxisVials={3}
        lastRegularProphylaxisDate={new Date(2026, 8, 1)}
        regularProphylaxisIntervalDays={3}
      />
    );
  if (window.location.pathname === "/tips") return <Tips />;
  return <Home />;
}
