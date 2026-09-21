import { useState } from "react";

import { type Frequency } from "@/lib/tracker-dates";
import {
  planChanges,
  planDates,
  planStatus,
  type PlanAhead,
  type PlanAheadDraft,
} from "@/lib/tracker-plans";

import { PlanAheadSheet } from "./PlanAheadSheet";
import { ChevronRightIcon, PlusIcon } from "./TrackerIcons";

const STATUS: Record<ReturnType<typeof planStatus>, { label: string; className: string }> = {
  active: { label: "Active now", className: "bg-[#8df5c0]/40 text-[#2f6b4c]" },
  upcoming: { label: "Upcoming", className: "bg-[#ffcc4d]/30 text-[#7a5a10]" },
  ended: { label: "Ended", className: "bg-[#eee5d5] text-[#806d51]" },
};

/**
 * "Plan Ahead": temporary changes to the usual routine over a date range. The
 * card is collapsed until opened, since most days there is nothing to plan.
 *
 * Every change is a write to `/users/{id}/plans` (`usePlans`); the sheet
 * closes once the write lands, and a refused one says why above the list.
 */
export function PlanAheadCard({
  plans,
  today,
  routineFrequency,
  routineVials,
  error,
  onAdd,
  onUpdate,
  onRemove,
}: {
  plans: PlanAhead[];
  today: Date;
  routineFrequency: Frequency | undefined;
  routineVials: number | undefined;
  /** Why the last write failed, if it did. */
  error: string | null;
  onAdd: (plan: PlanAheadDraft) => Promise<boolean>;
  onUpdate: (id: number, plan: PlanAheadDraft) => Promise<boolean>;
  onRemove: (id: number) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  /** The sheet is open when set: a plan to edit, or `"new"`. */
  const [editing, setEditing] = useState<PlanAhead | "new" | null>(null);
  const sorted = [...plans].sort((a, b) => (a.startKey < b.startKey ? -1 : 1));

  return (
    <>
      <section className="mt-4 overflow-hidden rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7">
        <button
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <div className="ml-1 min-w-0 sm:ml-2">
            <h2 className="text-xl font-bold tracking-tight text-[#6b3817] sm:text-2xl">
              Plan Ahead
            </h2>
            <p className="mt-1 text-sm text-[#a8977c]">
              Plan for temporary changes to your usual routine
            </p>
          </div>
          <ChevronRightIcon
            className={`h-5 w-5 shrink-0 text-[#806d51] transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>

        {open && (
          <div className="mt-4 space-y-2">
            {error && (
              <p
                role="status"
                className="rounded-xl border border-[#e7c3bf] bg-[#fdeceb] px-3 py-2 text-sm font-semibold text-[#9c3b34]"
              >
                {error}
              </p>
            )}
            {sorted.length === 0 && (
              <p className="rounded-xl bg-[#f8f0e2] px-3 py-3 text-center text-sm text-[#806d51]">
                No plans yet. Add one for travel, illness, or anything else that changes your
                routine.
              </p>
            )}
            {sorted.map((plan) => {
              const status = STATUS[planStatus(plan, today)];
              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[#f8f0e2] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#443229]">{planDates(plan)}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[#806d51]">{planChanges(plan)}</p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => setEditing(plan)}
                      aria-label={`Edit plan for ${planDates(plan)}`}
                      className="px-2 py-3 text-xs text-[#80633e] underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void onRemove(plan.id)}
                      aria-label={`Remove plan for ${planDates(plan)}`}
                      className="px-2 py-3 text-xs text-[#806d51] underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => setEditing("new")}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8c3a0] text-sm font-bold text-[#80633e] transition hover:bg-[#f4ead8]"
            >
              <PlusIcon className="h-4 w-4" />
              Add a plan
            </button>
          </div>
        )}
      </section>

      {editing && (
        <PlanAheadSheet
          today={today}
          plans={plans}
          initial={editing === "new" ? undefined : editing}
          routineFrequency={routineFrequency}
          routineVials={routineVials}
          onSave={async (plan) => {
            const ok = editing === "new" ? await onAdd(plan) : await onUpdate(editing.id, plan);
            if (ok) {
              setEditing(null);
              setOpen(true);
            }
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
