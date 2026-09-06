import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Template page. Replace the placeholder <section> with the real tracker; the
 * header and page padding can stay as they are.
 */
export function Tracker() {
  return (
    <div className="px-4 pt-8">
      <PageHeader title="Tracker" subtitle="Log doses and bleeds as they happen." />

      <section className="mt-5 rounded-[28px] bg-sand-100 p-5 shadow-lg">
        <p className="text-sm text-sand-600">Nothing logged yet.</p>
      </section>
    </div>
  );
}
