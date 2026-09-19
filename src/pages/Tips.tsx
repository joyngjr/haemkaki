import { BottomNav } from "@/components/BottomNav";

export function Tips() {
  return (
    <div className="min-h-screen bg-[#f8f0e2] px-8 py-12 pb-28 text-[#443229] sm:px-16 sm:py-14">
      <main className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Tips</h1>
        <p className="mt-4 text-2xl leading-tight text-[#806d51] sm:text-3xl">Living well with haemophilia.</p>
      </main>
      <BottomNav active="tips" />
    </div>
  );
}
