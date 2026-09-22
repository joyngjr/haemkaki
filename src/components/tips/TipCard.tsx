import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { ChevronIcon } from "./TipIcons";

export type TipCardData = {
  to: string;
  title: string;
  description?: string;
  /** The icon tile's fill and tint, as a pair of complete Tailwind classes. */
  tile: string;
  icon: ReactNode;
};

/**
 * One guide. A full-width row on a phone — easy to run a thumb down — and a
 * tile in a grid from `lg`, where a list of four would look thin.
 */
export function TipCard({ card }: { card: TipCardData }) {
  return (
    <Link
      to={card.to}
      className={cn(
        "flex items-center gap-3.5 px-4 py-4 transition-colors hover:bg-soft",
        "border-b border-line last:border-0",
        "lg:flex-col lg:items-start lg:gap-0 lg:rounded-card lg:border lg:border-line lg:bg-card lg:p-6",
        FOCUS_RING,
      )}
    >
      <span
        className={cn(
          "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl lg:h-11 lg:w-11 lg:rounded-[13px]",
          card.tile,
        )}
      >
        {card.icon}
      </span>

      <span className="flex min-w-0 flex-grow flex-col gap-1 lg:mt-3.5 lg:gap-1.5">
        <span className="text-[15.5px] font-semibold lg:text-[16.5px]">{card.title}</span>
        {card.description ? (
          <span className="text-[13.5px] leading-snug text-ink-subtle lg:text-sm lg:leading-relaxed">
            {card.description}
          </span>
        ) : null}
      </span>

      <ChevronIcon className="h-[19px] w-[19px] shrink-0 text-sand-400 lg:hidden" />
    </Link>
  );
}
