import { useState } from "react";

import type { OrderAdvice } from "@/lib/api";
import type { SupplyRow } from "@/lib/tracker-entries";
import { fromKey, shortDate } from "@/lib/tracker-dates";

import { Sheet } from "./Sheet";
import { QuestionIcon, SearchIcon } from "./TrackerIcons";
import { AlarmedPlatelet } from "./TrackerMascots";

type FactorSupplyCardProps = {
  vialsRemaining: number;
  hasSchedule: boolean;
  /** The first planned dose the cupboard cannot supply; null when stocked for a year. */
  runsOutOn: Date | null;
  order: OrderAdvice | null;
  isLoading: boolean;
  onShowHistory: () => void;
};

function mediumDate(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/**
 * Vials on hand and the order advice, exactly as the API folded them from the
 * ledger and the schedule. The page counts nothing itself; the "?" opens the
 * fold's own working for the order.
 */
export function FactorSupplyCard({
  vialsRemaining,
  hasSchedule,
  runsOutOn,
  order,
  isLoading,
  onShowHistory,
}: FactorSupplyCardProps) {
  const [showOrderHelp, setShowOrderHelp] = useState(false);
  const isLow = Boolean(order?.due);
  return (
    <section className="mt-4 overflow-hidden rounded-2xl border border-[#eee5d5] bg-[#fffaf0] p-4 shadow-[0_12px_45px_rgba(36,45,80,0.06)] sm:mt-6 sm:rounded-3xl sm:p-7">
      <button onClick={onShowHistory} className="w-full text-left transition hover:opacity-80">
        <div className="flex items-center justify-between">
          <div className="ml-1 sm:ml-2">
            <h2 className="text-xl font-bold tracking-tight text-[#6b3817] sm:text-2xl">
              Factor Supply
            </h2>
            <p className="mt-2 text-sm text-[#806d51]">Vials remaining in your supply</p>
            <p className="mt-2 flex items-center gap-1 text-sm text-[#806d51]">
              <SearchIcon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              Tap to view your recent activity
            </p>
          </div>
          <span className="relative mr-1 sm:mr-2">
            {isLow && (
              <AlarmedPlatelet className="absolute -left-10 -top-9 h-11 w-14 shrink-0 sm:-top-10 sm:h-14 sm:w-[4.5rem]" />
            )}
            <span
              className={`text-3xl font-bold sm:text-4xl ${isLow ? "text-[#cd5952]" : "text-[#3b281c]"}`}
            >
              {isLoading ? "…" : vialsRemaining}
            </span>
          </span>
        </div>
      </button>
      <div className="relative mt-4 border-t border-[#eee5d5] pt-4">
        <button
          onClick={() => setShowOrderHelp(true)}
          aria-label="How is the recommended order worked out?"
          className="absolute -right-2 -top-1 grid h-11 w-11 place-items-center text-[#806d51] transition hover:text-[#443229]"
        >
          <QuestionIcon className="h-5 w-5" />
        </button>
        <h3 className="text-center text-base font-bold text-[#6b3817] sm:text-lg">
          Recommended order
        </h3>
        {!hasSchedule ? (
          <p className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-3 text-center text-sm text-[#806d51]">
            Set up your routine below to see when to order and how much.
          </p>
        ) : runsOutOn === null ? (
          <p className="mt-3 rounded-xl bg-[#f8f0e2] px-3 py-3 text-center text-sm text-[#806d51]">
            {isLoading
              ? "Working it out…"
              : "Your supply covers every planned dose for the coming year."}
          </p>
        ) : (
          <div className="ml-1 mt-3 space-y-2 sm:ml-2">
            <OrderRow label="Supply runs out" value={mediumDate(runsOutOn)} urgent={isLow} />
            <OrderRow
              label="Order by"
              urgent={isLow}
              value={order ? (order.due ? "ASAP" : mediumDate(fromKey(order.by_on))) : ""}
            />
            <OrderRow label="Number of vials" value={order ? String(order.vials) : ""} />
          </div>
        )}
      </div>
      {showOrderHelp && (
        <OrderHelpSheet
          order={order}
          runsOutOn={runsOutOn}
          hasSchedule={hasSchedule}
          onClose={() => setShowOrderHelp(false)}
        />
      )}
    </section>
  );
}

/** The working behind the recommended order, as the API reported it. */
function OrderHelpSheet({
  order,
  runsOutOn,
  hasSchedule,
  onClose,
}: {
  order: OrderAdvice | null;
  runsOutOn: Date | null;
  hasSchedule: boolean;
  onClose: () => void;
}) {
  const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
  return (
    <Sheet
      tier="action"
      eyebrow="Recommended order"
      title="How is this worked out?"
      onClose={onClose}
    >
      <p className="mt-3 text-sm text-[#806d51]">
        We count the doses planned from the day your supply runs out through the next 30 days plus
        your buffer, then subtract the vials you will still have on that day.
      </p>
      {order && runsOutOn ? (
        <div className="mt-4 space-y-2">
          <HelpRow
            label={`Planned doses, ${shortDate(runsOutOn)} – ${shortDate(fromKey(order.covers_until))}`}
            detail={plural(order.planned_doses, "dose")}
            value={plural(order.planned_vials, "vial")}
          />
          <HelpRow label="− Vials left by then" value={plural(order.leftover_vials, "vial")} />
          <HelpRow label="= Vials to order" value={plural(order.vials, "vial")} strong />
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-[#f8f0e2] px-3 py-3 text-sm text-[#806d51]">
          {hasSchedule
            ? "Your supply covers every planned dose for the coming year, so there is nothing to order yet."
            : "Set up your routine to see your number."}
        </p>
      )}
      <p className="mt-3 text-xs text-[#806d51]">
        {order
          ? `Your buffer is ${plural(order.buffer_days, "day")}, so the order-by date is that far ahead of the run-out date. `
          : ""}
        Planned doses come from your routine and any plans you've added.
      </p>
    </Sheet>
  );
}

function HelpRow({
  label,
  detail,
  value,
  strong,
}: {
  label: string;
  detail?: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 ${strong ? "bg-[#ecdcbf]" : "bg-[#f8f0e2]"}`}
    >
      <span className="min-w-0 text-sm text-[#806d51]">
        {label}
        {detail ? <span className="block text-xs">{detail}</span> : null}
      </span>
      <span className="shrink-0 text-sm font-bold text-[#443229]">{value}</span>
    </div>
  );
}

function OrderRow({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2.5">
      <span className="text-sm text-[#806d51]">{label}</span>
      <span className={`text-sm font-bold ${urgent ? "text-[#cd5952]" : "text-[#443229]"}`}>
        {value}
      </span>
    </div>
  );
}

export function SupplyHistorySheet({ rows, onClose }: { rows: SupplyRow[]; onClose: () => void }) {
  return (
    <Sheet tier="action" eyebrow="Factor Supply" title="Recent activity" onClose={onClose}>
      {rows.length ? (
        <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={`${row.dateKey}-${row.id}`}
              className="flex items-center justify-between rounded-xl bg-[#f8f0e2] px-3 py-2"
            >
              <div>
                <p className="text-xs font-bold text-[#443229]">
                  {mediumDate(fromKey(row.dateKey))}
                </p>
                <p className="text-sm text-[#806d51]">{row.detail}</p>
              </div>
              <span
                className={`text-sm font-bold ${row.amount > 0 ? "text-[#3b9c5c]" : "text-[#cd5952]"}`}
              >
                {row.amount > 0 ? `+${row.amount}` : row.amount}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-[#806d51]">No vial activity logged yet.</p>
      )}
    </Sheet>
  );
}
