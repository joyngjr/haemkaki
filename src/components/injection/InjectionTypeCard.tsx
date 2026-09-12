import { Link } from "react-router-dom";

import { ChevronRight } from "@/components/ui/ChevronRight";

export type InjectionType = {
  to: string;
  title: string;
  description: string;
  buttonLabel: string;
  /** Tailwind classes: the card background and the icon tile behind `icon`. */
  bg: string;
  iconBg: string;
  /** One of the exports from ./InjectionTypeIcons. */
  icon: React.ReactNode;
};

/** One coloured card on the injection guide index. */
export function InjectionTypeCard({ type }: { type: InjectionType }) {
  return (
    <div className={`${type.bg} rounded-[28px] p-5 shadow-lg flex items-center gap-4`}>
      <div
        className={`${type.iconBg} flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl`}
      >
        {type.icon}
      </div>
      <div className="flex-1">
        <h3 className="font-bold text-gray-900">{type.title}</h3>
        <p className="mt-1 text-sm text-gray-600">{type.description}</p>
        <Link
          to={type.to}
          className="mt-3 inline-flex items-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow transition-transform active:scale-95"
        >
          {type.buttonLabel}
          <ChevronRight />
        </Link>
      </div>
    </div>
  );
}
