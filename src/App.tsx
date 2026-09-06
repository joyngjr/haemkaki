import { Home } from "@/pages/Home";
import { ProfileProvider } from "@/state/ProfileProvider";

export default function App() {
  return (
    <ProfileProvider>
      <Home />
    </ProfileProvider>
  );
}
