import { useState } from "react";

import type { StockState } from "@/components/platelet/Platelet";
import { Card, CardTitle } from "@/components/ui/Card";
import type { OrderAdvice } from "@/lib/api";
import { FOCUS_RING } from "@/lib/theme";
import { fromKey, shortDate } from "@/lib/tracker-dates";
import type { SupplyRow } from "@/lib/tracker-entries";
import { cn } from "@/lib/utils";

import { Sheet } from "./Sheet";
import { PencilIcon, QuestionIcon } from "./TrackerIcons";

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
  onShowHistory: () => void;
  /** Opens the stock count, for when the recorded figure is wrong. */
  onCorrect: () => void;
  className?: string;
};

function mediumDate(date: Date) {
  return date.toLocaleDateString("en-SG", { day: "numeric", month: "long" });
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

const monthName = (key: string) => fromKey(key).toLocaleDateString("en-SG", { month: "long" });

/**
 * The card's one line of advice. A regular order is next month's supply, so
 * it names the month and the 1st the delivery has to beat; an early one says
 * why it is early and how long it lasts.
 */
function orderSentence(order: OrderAdvice, orderDayOfMonth: number | null) {
  const byOn = mediumDate(fromKey(order.by_on));
  if (order.on_order_day) {
    return order.vials > 0
      ? `Order ${plural(order.vials, "vial")} by ${byOn} so they arrive before ${mediumDate(fromKey(order.covers_from))}. That covers ${monthName(order.covers_from)} and your bleed buffer.`
      : `You already have enough for ${monthName(order.covers_from)} and your bleed buffer, so no order is needed on ${byOn}.`;
  }
  return `Your stock is forecast to fall below your bleed buffer by ${byOn}${orderDayOfMonth ? ", before your next regular order" : ""}. Ordering ${plural(order.vials, "vial")} covers planned use through ${mediumDate(fromKey(order.covers_until))} and keeps your bleed buffer.`;
}

/**
 * "Factor at home" — vials on hand and the order advice, exactly as the API
 * folded them from the ledger, the schedule, the buffer and the order day. The card counts
 * nothing itself; the "?" opens the fold's own working for the order, and
 * the pencil beside it opens a stock count for when the figure is wrong.
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
  onShowHistory,
  onCorrect,
  className,
}: FactorSupplyCardProps) {
  const [showOrderHelp, setShowOrderHelp] = useState(false);
  const isOut = vialsRemaining <= 0;
  const isLow = Boolean(order?.due) || stockState === "low";

  return (
    <Card className={cn("lg:p-6", className)}>
      <div className="flex items-center justify-between">
        <CardTitle>Factor at home</CardTitle>
        <div className="flex">
          {!isLoading && (
            <button
              type="button"
              onClick={onCorrect}
              aria-label="Correct the vials at home"
              className={cn(
                "grid h-11 w-8 place-items-center rounded-full text-ink-faint hover:text-ink-muted",
                FOCUS_RING,
              )}
            >
              <PencilIcon className="h-[18px] w-[18px]" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowOrderHelp(true)}
            aria-label="How the recommended order is calculated"
            className={cn(
              "grid h-11 w-8 place-items-center rounded-full text-ink-faint hover:text-ink-muted",
              FOCUS_RING,
            )}
          >
            <QuestionIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
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
                ? orderSentence(order, orderDayOfMonth)
                : "Set a monthly order day to receive an order recommendation."}
          </p>
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
        {!order
          ? "Each order is next month’s supply: it should last from the 1st to the last day of the month, plus your bleed buffer."
          : order.on_order_day
            ? `Order on your order day so the delivery arrives before ${mediumDate(fromKey(order.covers_from))}. It should last from ${mediumDate(fromKey(order.covers_from))} to ${mediumDate(fromKey(order.covers_until))}: every planned dose that month, plus your bleed buffer.`
            : `Your stock runs low before your next regular order, so this order should last until ${mediumDate(fromKey(order.covers_until))}, plus your bleed buffer.`}
      </p>
      {order ? (
        <div className="mt-4 space-y-2">
          <HelpRow
            label={`Planned use ${shortDate(fromKey(order.covers_from))} – ${shortDate(fromKey(order.covers_until))}`}
            detail={plural(order.planned_doses, "dose")}
            value={plural(order.planned_vials, "vial")}
          />
          {order.bridge_doses > 0 ? (
            <HelpRow
              label={`+ Doses still to come before ${shortDate(fromKey(order.covers_from))}`}
              detail={plural(order.bridge_doses, "dose")}
              value={plural(order.bridge_vials, "vial")}
            />
          ) : null}
          <HelpRow
            label="+ Bleed buffer"
            detail="In case of a bleed"
            value={plural(order.buffer_vials, "vial")}
          />
          <HelpRow
            label={`− Projected stock after ${shortDate(fromKey(order.by_on))}`}
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
          ? `Your order day is day ${orderDayOfMonth} of each month; leave enough time for delivery before the 1st. `
          : "No regular monthly order day is recorded. "}
        {bufferVials !== null
          ? `If your recorded stock is forecast to dip into your ${plural(bufferVials, "vial")} bleed buffer before then, the app brings the order date forward.`
          : "No bleed buffer is recorded."}
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
