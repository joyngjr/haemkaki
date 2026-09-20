import { useState } from "react";

import type { SupplyRow } from "@/lib/tracker-entries";
import { fromKey } from "@/lib/tracker-dates";

import { Sheet } from "./Sheet";
import { QuestionIcon, SearchIcon } from "./TrackerIcons";
import { AlarmedPlatelet } from "./TrackerMascots";

/** The working behind the recommended order, shown in its "?" explainer. */
export type OrderBreakdown = {
  /** Vials to order, never below zero. */
  vials: number;
  /** The month the order covers, e.g. "October". */
  monthLabel: string;
  plannedDoses: number;
  /** Vials those doses use, after any plan's dosage. */
  plannedVials: number;
  minimumBuffer: number;
  currentSupply: number;
};

type FactorSupplyCardProps = {
  vialsRemaining: number;
  /** True once the supply reaches the buffer set during profile creation. */
  isLow: boolean;
  nextOrderDate: Date;
  /** The supply is already low and the scheduled order date hasn't arrived. */
  isOrderNeededAsap: boolean;
  isNextOrderDateSoon: boolean;
  /** Undefined while the routine or the minimum buffer is still unset. */
  order: OrderBreakdown | undefined;
  onShowHistory: () => void;
};

export function FactorSupplyCard({
  vialsRemaining,
  isLow,
  nextOrderDate,
  isOrderNeededAsap,
  isNextOrderDateSoon,
  order,
  onShowHistory,
}: FactorSupplyCardProps) {
  const [showOrderHelp, setShowOrderHelp] = useState(false);
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
              {vialsRemaining}
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
        <div className="ml-1 mt-3 space-y-2 sm:ml-2">
          <OrderRow
            label="Next order date"
            urgent={isOrderNeededAsap || isNextOrderDateSoon}
            value={
              isOrderNeededAsap
                ? "ASAP"
                : nextOrderDate.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
            }
          />
          <OrderRow label="Number of vials" value={order ? String(order.vials) : ""} />
        </div>
      </div>
      {showOrderHelp && <OrderHelpSheet order={order} onClose={() => setShowOrderHelp(false)} />}
    </section>
  );
}

function OrderHelpSheet({
  order,
  onClose,
}: {
  order: OrderBreakdown | undefined;
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
        We add up the number of vials you will need for your planned doses next month and your
        minimum buffer, then subtract any excess you might already have in your supply.
      </p>
      <div className="mt-4 space-y-2">
        <HelpRow
          label={order ? `${order.monthLabel}'s planned doses` : "Next month's planned doses"}
          detail={order ? plural(order.plannedDoses, "dose") : undefined}
          value={order ? plural(order.plannedVials, "vial") : "vials"}
        />
        <HelpRow
          label="+ Minimum buffer"
          value={order ? plural(order.minimumBuffer, "vial") : "vials"}
        />
        <HelpRow
          label="− Current supply"
          value={order ? plural(order.currentSupply, "vial") : "vials"}
        />
        <HelpRow label="= Vials to order" value={order ? plural(order.vials, "vial") : ""} strong />
      </div>
      <p className="mt-3 text-xs text-[#806d51]">
        {order
          ? "Planned doses come from your routine and any plans you've added. If your supply already covers it, the number is 0."
          : "Set your dosage, frequency, start date and minimum buffer to see your number."}
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
                  {fromKey(row.dateKey).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
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
