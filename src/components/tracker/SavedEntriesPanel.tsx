import { entryDetail, entryLabel, type TrackerEntry } from "@/lib/tracker-entries";

/**
 * The running list of what's logged on the selected date. Floats above the
 * calendar rather than inside the day sheet so it stays visible while a flow
 * is open.
 *
 * z-75 puts it above the day sheet's full-screen backdrop and below the sheets
 * that backdrop opens. It used to sit under the backdrop, which left Edit and
 * Delete permanently unclickable.
 */
export function SavedEntriesPanel({
  entries,
  onEdit,
  onDelete,
}: {
  entries: TrackerEntry[];
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (entry: TrackerEntry) => void;
}) {
  return (
    <section className="fixed bottom-24 left-3 right-3 z-[75] mx-auto max-w-md rounded-2xl border border-[#E7E5E0] bg-[#FFFFFF] p-4 shadow-xl sm:bottom-6 sm:left-auto sm:right-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#242A2F]">Saved entries</h3>
        <span className="text-xs text-[#5C646C]">{entries.length}</span>
      </div>
      {entries.length ? (
        <div className="mt-3 space-y-2">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-xl bg-[#F7F6F3] px-3 py-2"
            >
              <div>
                <p className="text-xs font-bold text-[#242A2F]">{entryLabel(entry)}</p>
                <p className="text-sm text-[#5C646C]">{entryDetail(entry)}</p>
              </div>
              <div className="flex gap-1">
                {/* A made-up dose is edited from the missed dose it belongs to. */}
                {entry.kind !== "makeup" && (
                  <button
                    onClick={() => onEdit(entry)}
                    className="rounded-lg px-2 py-1 text-xs font-semibold text-[#274A63] hover:bg-[#F7F6F3]"
                  >
                    Edit
                  </button>
                )}
                <button
                  onClick={() => onDelete(entry)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[#A63A2E] hover:bg-[#F7F6F3]"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#5C646C]">Nothing logged.</p>
      )}
    </section>
  );
}
