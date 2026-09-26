import { useState } from "react";

import type { StockState } from "@/components/platelet/Platelet";
import { Card, CardTitle } from "@/components/ui/Card";
import type { OrderAdvice } from "@/lib/api";
import { FOCUS_RING } from "@/lib/theme";
import { fromKey, shortDate } from "@/lib/tracker-dates";
import type { SupplyRow } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";

import { Sheet } from "./Sheet";
import { QuestionIcon } from "./TrackerIcons";

type FactorSupplyCardProps = {
  vialsRemaining: number;
  /** The fold's reading of the shelf: low once under the buffer. Undefined while loading. */
  stockState: StockState | undefined;
  /** The vials the profile keeps at home. Null until it is set. */
  bufferVials: number | null;
  /** The day of the month the profile orders on. Null until it is set. */
  orderDayOfMonth: number | null;
  hasSchedule: boolean;
  order: OrderAdvice | null;
  isLoading: boolean;
  onAddFactor: () => void;
  onRemoveFactor: () => void;
  onShowHistory: () => void;
  className?: string;
};

function mediumDate(date: Date) {
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "long" });
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

/**
 * "Factor at home" — vials on hand and the order advice, exactly as the API
 * folded them from the ledger, the schedule, the buffer and the order day. The card counts
 * nothing itself; the "?" opens the fold's own working for the order.
 *
 * The advice is advice: the app places no orders and talks to no pharmacy.
 * It says how much to buy and by when, and the ledger deducts from whatever
 * refill you log when the delivery arrives.
 *
 * It lives inside the tracker at every size. On a phone it stacks; from `lg`
 * the figure and its sentence sit on the left, the order line and the
 * history link on the right.
 */
export function FactorSupplyCard({
  vialsRemaining,
  stockState,
  bufferVials,
  orderDayOfMonth,
  hasSchedule,
  order,
  isLoading,
  onAddFactor,
  onRemoveFactor,
  onShowHistory,
  className,
}: FactorSupplyCardProps) {
  const [showOrderHelp, setShowOrderHelp] = useState(false);
  const isOut = vialsRemaining <= 0;
  const isLow = Boolean(order?.due) || stockState === "low";

  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex items-center justify-between">
        <CardTitle>Factor at home</CardTitle>
        <button
          type="button"
          onClick={() => setShowOrderHelp(true)}
          aria-label="How the recommended order is calculated"
          className={cn(
            "-mr-1.5 grid h-11 w-11 place-items-center rounded-full text-ink-faint hover:text-ink-muted",
            FOCUS_RING,
          )}
        >
          <QuestionIcon className="h-[18px] w-[18px]" />
        </button>
      </div>

      <div className="lg:flex lg:items-start lg:gap-8">
        <div className="min-w-0 lg:flex-1">
          <div className="mt-1.5 flex items-baseline gap-2.5">
            <span
              className={cn(
                "font-mono text-[34px] font-semibold leading-none tracking-[-0.02em] sm:text-[40px]",
                isOut ? "text-brick-600" : isLow ? "text-ochre-700" : "text-ink",
              )}
            >
              {isLoading ? "…" : vialsRemaining}
            </span>
            <span className="text-[15px] text-ink-muted">vials recorded at home</span>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {!hasSchedule
              ? "Set up a routine to forecast when you may need to order more factor."
              : order
                ? order.on_order_day
                  ? `Your next regular order is ${mediumDate(fromKey(order.by_on))}. Ordering ${plural(order.vials, "vial")} covers planned use, predicted bleed treatment, and your chosen reserve.`
                  : `Your stock is forecast to fall below your reserve by ${mediumDate(fromKey(order.by_on))}${orderDayOfMonth ? ", before your next regular order" : ""}. Ordering ${plural(order.vials, "vial")} covers planned use through ${mediumDate(fromKey(order.covers_until))}, predicted bleed treatment, and your chosen reserve.`
                : "Set a monthly order day to receive an order recommendation."}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onAddFactor}
              className={cn(
                "min-h-11 rounded-xl bg-slate-600 px-3 text-sm font-semibold text-white hover:bg-slate-700",
                FOCUS_RING,
              )}
            >
              Add factor
            </button>
            <button
              type="button"
              onClick={onRemoveFactor}
              className={cn(
                "min-h-11 rounded-xl border border-sand-300 bg-card px-3 text-sm font-semibold text-ink-strong hover:bg-soft",
                FOCUS_RING,
              )}
            >
              Remove factor
            </button>
          </div>
        </div>

        <div className="lg:mt-1.5 lg:w-[380px] lg:shrink-0 xl:w-[400px]">
          {order ? (
            <div className="mt-4 grid grid-cols-2 gap-2 lg:mt-0">
              <OrderFigure
                label="Next order date"
                value={order.due ? "ASAP" : mediumDate(fromKey(order.by_on))}
                urgent={order.due}
              />
              <OrderFigure label="Recommended vials" value={String(order.vials)} />
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
            See recent factor activity
          </button>
        </div>
      </div>

      {showOrderHelp && (
        <OrderHelpSheet
          order={order}
          bufferVials={bufferVials}
          orderDayOfMonth={orderDayOfMonth}
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

/** A plain-language breakdown of the recommended order, as the API worked it out. */
function OrderHelpSheet({
  order,
  bufferVials,
  orderDayOfMonth,
  hasSchedule,
  onClose,
}: {
  order: OrderAdvice | null;
  bufferVials: number | null;
  orderDayOfMonth: number | null;
  hasSchedule: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      tier="action"
      eyebrow="Order calculation"
      title="How many vials should I order?"
      onClose={onClose}
    >
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        We project how many vials will remain immediately after your dose on the next order day. We
        then calculate the planned use until the following monthly order day and add predicted bleed
        treatment for the next 30 days.
      </p>
      {order ? (
        <div className="mt-4 space-y-2">
          <HelpRow
            label={`Planned use after ${shortDate(fromKey(order.by_on))} through ${shortDate(fromKey(order.covers_until))}`}
            detail={plural(order.planned_doses, "dose")}
            value={plural(order.planned_vials, "vial")}
          />
          <HelpRow
            label="+ Predicted bleed treatment in the next 30 days"
            detail="Exponentially weighted moving average"
            value={plural(order.bleed_vials, "vial")}
          />
          <HelpRow label="+ Reserve you want to keep" value={plural(order.buffer_vials, "vial")} />
          <HelpRow
            label="− Projected stock after your order-day dose"
            value={plural(order.leftover_vials, "vial")}
          />
          <HelpRow label="= Recommended order" value={plural(order.vials, "vial")} strong />
        </div>
      ) : (
        <p className="mt-4 rounded-xl bg-soft px-3.5 py-3 text-sm text-ink-muted">
          {hasSchedule
            ? "Choose a monthly order day to calculate a recommendation."
            : "Set up your routine before the app can calculate an order recommendation."}
        </p>
      )}
      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-subtle">
        {orderDayOfMonth
          ? `Your regular order day is day ${orderDayOfMonth} of each month. `
          : "No regular monthly order day is recorded. "}
        {bufferVials !== null
          ? `If your recorded stock is forecast to fall below ${plural(bufferVials, "vial")} before then, the app brings the order date forward.`
          : "No vial reserve is recorded."}
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-subtle">
        Bleed prediction uses six trailing 30-day periods and α = 0.29: EWMAₜ = 0.29 ×
        vialsₜ + 0.71 × EWMAₜ₋₁, starting from zero and rounding the final prediction up to
        a whole vial. Bleed vials include on-demand and follow-up doses.
      </p>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-subtle">
        This is a planning estimate, not a placed order. Record each delivery as a refill so the
        calculation continues from the correct stock balance.
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
    <Sheet tier="action" eyebrow="Factor at home" title="Recent factor activity" onClose={onClose}>
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
                {`${row.amount > 0 ? "+" : "−"}${Math.abs(row.amount)}`}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm text-ink-muted">No factor activity logged yet.</p>
      )}
    </Sheet>
  );
}
