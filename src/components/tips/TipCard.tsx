import { Link } from "react-router-dom";

import { ChevronRight } from "@/components/ui/ChevronRight";

export type TipCardData = {
  to: string;
  title: string;
  description: string;
  /** Tailwind classes: card background, icon tile, and the arrow bubble. */
  bg: string;
  iconBg: string;
  arrowBg: string;
  /** One of the exports from ./TipIcons. */
  icon: React.ReactNode;
};

/** One tile in the 2x2 grid on the Tips index. */
export function TipCard({ card }: { card: TipCardData }) {
  return (
    <Link
      to={card.to}
      className={`${card.bg} rounded-[28px] p-5 shadow-lg flex flex-col justify-between min-h-[170px] transition-transform active:scale-95`}
    >
      <div className={`${card.iconBg} h-12 w-12 rounded-xl flex items-center justify-center`}>
        {card.icon}
      </div>
      <div>
        <h3 className="mt-3 font-bold text-gray-900">{card.title}</h3>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-sm text-gray-600">{card.description}</p>
          <span
            className={`${card.arrowBg} flex h-8 w-8 shrink-0 items-center justify-center rounded-full`}
          >
            <ChevronRight className="h-4 w-4 text-gray-700" />
          </span>
        </div>
      </div>
    </Link>
  );
}
