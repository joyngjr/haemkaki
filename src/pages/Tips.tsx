import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Template page. Replace the placeholder <section> with the real tips; the
 * header and page padding can stay as they are.
 */
export function Tips() {
  return (
    <div className="px-4 pt-8">
      <PageHeader title="Tips" subtitle="Living well with haemophilia." />

      <section className="mt-5 rounded-[28px] bg-sand-100 p-5 shadow-lg">
        <p className="text-sm text-sand-600">Tips are on the way.</p>
      </section>
    </div>
  );
}
