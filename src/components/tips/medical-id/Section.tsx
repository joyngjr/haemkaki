/**
 * One labelled block of Medical ID fields.
 *
 * Every section lives inside the single card the page renders, so the block
 * draws its own top rule instead of floating as a card of its own — a
 * responder reads one document, not six.
 */
export function Section({
  icon,
  iconBg,
  title,
  titleColor = "text-blue-700",
  children,
}: {
  /** One of the exports from ./SectionIcons. */
  icon: React.ReactNode;
  /** A raw colour rather than a Tailwind class, so it can be any hex. */
  iconBg: string;
  title: string;
  titleColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 px-4 py-4 md:px-6">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: iconBg }}
        >
          {icon}
        </span>
        <h3 className={"text-xs font-bold tracking-wide " + titleColor}>{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** One label-over-value pair inside a Section. */
export function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}
