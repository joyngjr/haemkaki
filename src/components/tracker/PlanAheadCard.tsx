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
  active: { label: "Active now", className: "bg-[#2C7A70]/40 text-[#2f6b4c]" },
  upcoming: { label: "Upcoming", className: "bg-[#B9832C]/30 text-[#7a5a10]" },
  ended: { label: "Ended", className: "bg-[#E7E5E0] text-[#5C646C]" },
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
      <section className="overflow-hidden rounded-card border border-line bg-card p-4 sm:p-5 lg:p-6">
        <button
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          className="flex w-full items-center justify-between gap-2 text-left"
        >
          <h2 className="ml-1 min-w-0 text-base font-semibold sm:ml-2 sm:text-[17px]">
            Plan Ahead
          </h2>
          <ChevronRightIcon
            className={`h-5 w-5 shrink-0 text-[#5C646C] transition-transform ${open ? "rotate-90" : ""}`}
          />
        </button>

        {open && (
          <div className="mt-4 space-y-2">
            {error && (
              <p
                role="status"
                className="rounded-xl border border-[#EBD3CE] bg-[#FBF1EF] px-3 py-2 text-sm font-semibold text-[#A63A2E]"
              >
                {error}
              </p>
            )}
            {sorted.length === 0 && (
              <p className="rounded-xl bg-[#F7F6F3] px-3 py-3 text-center text-sm text-[#5C646C]">
                No plans yet.
              </p>
            )}
            {sorted.map((plan) => {
              const status = STATUS[planStatus(plan, today)];
              return (
                <div
                  key={plan.id}
                  className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F6F3] px-3 py-2"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-[#242A2F]">{planDates(plan)}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <p className="mt-0.5 text-sm text-[#5C646C]">{planChanges(plan)}</p>
                  </div>
                  <div className="flex shrink-0 items-center">
                    <button
                      onClick={() => setEditing(plan)}
                      aria-label={`Edit plan for ${planDates(plan)}`}
                      className="px-2 py-3 text-xs text-[#274A63] underline"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => void onRemove(plan.id)}
                      aria-label={`Remove plan for ${planDates(plan)}`}
                      className="px-2 py-3 text-xs text-[#5C646C] underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              onClick={() => setEditing("new")}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D9D6CF] text-sm font-bold text-[#274A63] transition hover:bg-[#F7F6F3]"
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
