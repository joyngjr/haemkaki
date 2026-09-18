import { Home } from "@/pages/Home";
import { Tracker } from "@/pages/Tracker";
import { Tips } from "@/pages/Tips";

export default function App() {
  if (window.location.pathname === "/tracker") return <Tracker minimumFactorSupplyVials={10} />;
  if (window.location.pathname === "/tips") return <Tips />;
  return <Home />;
}
