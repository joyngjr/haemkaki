import { useState } from "react";

import { Card, CardTitle } from "@/components/ui/Card";
import type { OrderAdvice } from "@/lib/api";
import { FOCUS_RING } from "@/lib/theme";
import { fromKey, getSingaporeTodayKey, shortDate, toKey } from "@/lib/tracker-dates";
import type { SupplyRow } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";

import { Sheet } from "./Sheet";
import { QuestionIcon } from "./TrackerIcons";

type FactorSupplyCardProps = {
  vialsRemaining: number;
  hasSchedule: boolean;
  /** The first planned dose the cupboard cannot supply; null when stocked for a year. */
  runsOutOn: Date | null;
  order: OrderAdvice | null;
  isLoading: boolean;
  onShowHistory: () => void;
  className?: string;
};

function mediumDate(date: Date) {
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "long" });
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * "Factor at home" — vials on hand and the order advice, exactly as the API
 * folded them from the ledger and the schedule. The card counts nothing
 * itself; the "?" opens the fold's own working for the order.
 *
 * The advice is advice: the app places no orders and talks to no pharmacy.
 * It says how many vials to buy and by when, and the ledger deducts from
 * whatever refill you log when the delivery arrives.
 *
 * It lives inside the tracker at every size.
 */
export function FactorSupplyCard({
  vialsRemaining,
  hasSchedule,
  runsOutOn,
  order,
  isLoading,
  onShowHistory,
  className,
}: FactorSupplyCardProps) {
  const [showOrderHelp, setShowOrderHelp] = useState(false);
  const isOut = vialsRemaining <= 0;
  // The run-out date can still be ahead of you with nothing in the cupboard —
  // the next dose is simply the one that cannot be supplied.
  const hasRunOut = runsOutOn !== null && toKey(runsOutOn) <= getSingaporeTodayKey();
  const isLow = Boolean(order?.due) || (vialsRemaining > 0 && vialsRemaining <= 3);

  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex items-center justify-between">
        <CardTitle>Factor at home</CardTitle>
        <button
          type="button"
          onClick={() => setShowOrderHelp(true)}
          aria-label="How the refill suggestion is worked out"
          className={cn(
            "-mr-1.5 grid h-11 w-11 place-items-center rounded-full text-ink-faint hover:text-ink-muted",
            FOCUS_RING,
          )}
        >
          <QuestionIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="mt-1.5 flex items-baseline gap-2.5">
        <span
          className={cn(
            "font-mono text-[34px] font-semibold leading-none tracking-[-0.02em] sm:text-[40px]",
            isOut ? "text-brick-600" : isLow ? "text-ochre-700" : "text-ink",
          )}
        >
          {isLoading ? "…" : vialsRemaining}
        </span>
        <span className="text-[15px] text-ink-muted">vials left</span>
      </div>

      {/* Without a routine there is nothing to forecast, so the card says nothing. */}
      {hasSchedule ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          {runsOutOn === null ? (
            "Your supply covers every planned dose for the coming year."
          ) : (
            <>
              Your supply {hasRunOut ? "ran out on" : "runs out on"}{" "}
              <strong className="font-semibold text-ink">{mediumDate(runsOutOn)}</strong>.
              {order
                ? ` ${plural(order.vials, "vial")} covers you to ${mediumDate(fromKey(order.covers_until))}.`
                : ""}
            </>
          )}
        </p>
      ) : null}

      {order ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <OrderFigure
            label="Order by"
            value={order.due ? "ASAP" : mediumDate(fromKey(order.by_on))}
            urgent={order.due}
          />
          <OrderFigure label="Vials to order" value={String(order.vials)} />
        </div>
      ) : null}

      <button
        type="button"
        onClick={onShowHistory}
        className={cn(
          "mt-3 min-h-11 text-sm font-medium text-teal-700 hover:text-teal-800",
          FOCUS_RING,
        )}
      >
        See recent vial activity
      </button>

      {showOrderHelp && (
        <OrderHelpSheet
          order={order}
          runsOutOn={runsOutOn}
          hasSchedule={hasSchedule}
          onClose={() => setShowOrderHelp(false)}
        />
      )}
    </Card>
  );
}

/** One half of the order line: what to buy, or the day to buy it by. */
function OrderFigure({ label, value, urgent }: { label: string; value: string; urgent?: boolean }) {
  return (
    <div className={cn("rounded-xl px-3.5 py-2.5", urgent ? "bg-brick-50" : "bg-soft")}>
      <span className="block text-[12.5px] text-ink-subtle">{label}</span>
      <span
        className={cn(
          "mt-0.5 block font-mono text-[15px] font-semibold",
          urgent ? "text-brick-600" : "text-ink",
        )}
      >
        {value}
      </span>
    </div>
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
  return (
    <Sheet
      tier="action"
      eyebrow="Recommended order"
      title="How is this worked out?"
      onClose={onClose}
    >
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
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
        <p className="mt-4 rounded-xl bg-soft px-3.5 py-3 text-sm text-ink-muted">
          {hasSchedule
            ? "Your supply covers every planned dose for the coming year, so there is nothing to order yet."
            : "Set up your routine to see your number."}
        </p>
      )}
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-subtle">
        {order
          ? `Your buffer is ${plural(order.buffer_days, "day")}, so the order-by date is that far ahead of the run-out date. `
          : ""}
        Planned doses come from your routine and any plans you've added.
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-subtle">
        This is a suggestion, not an order — the app cannot place one. Buy through your centre as
        you normally would, and record what arrives as a refill on the tracker; the vial count here
        is that record less every dose logged against it.
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
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5",
        strong ? "bg-rail" : "bg-soft",
      )}
    >
      <span className="min-w-0 text-sm text-ink-muted">
        {label}
        {detail ? <span className="block text-[12.5px]">{detail}</span> : null}
      </span>
      <span className="shrink-0 font-mono text-sm font-semibold text-ink">{value}</span>
    </div>
  );
}

export function SupplyHistorySheet({ rows, onClose }: { rows: SupplyRow[]; onClose: () => void }) {
  return (
    <Sheet tier="action" eyebrow="Factor at home" title="Recent vial activity" onClose={onClose}>
      {rows.length ? (
        <div className="mt-5 max-h-[60vh] space-y-2 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={`${row.dateKey}-${row.id}`}
              className="flex items-center justify-between gap-3 rounded-xl bg-soft px-3.5 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-ink">
                  {mediumDate(fromKey(row.dateKey))}
                </p>
                <p className="text-sm text-ink-muted">{row.detail}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 font-mono text-sm font-semibold",
                  row.amount > 0 ? "text-moss-700" : "text-brick-600",
                )}
              >
                {row.amount > 0 ? `+${row.amount}` : row.amount}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-ink-muted">No vial activity logged yet.</p>
      )}
    </Sheet>
  );
}
