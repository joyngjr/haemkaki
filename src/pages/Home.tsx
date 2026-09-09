import { FactorScene } from "@/components/platelet/FactorScene";
import { BottomNav } from "@/components/BottomNav";

export function Home() {
  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="mx-auto max-w-md px-4 py-6">
        <FactorScene dose="covered" stock="wellStocked" size="md" className="w-full" />
      </main>
      <BottomNav active="home" />
    </div>
  );
}
