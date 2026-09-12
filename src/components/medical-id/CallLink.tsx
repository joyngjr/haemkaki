import { cn } from "@/lib/utils";

/** A full-width tel: button at the bottom of a SectionCard. */
export function CallLink({
  phone,
  label,
  className,
}: {
  phone: string;
  label: string;
  /** The background colour, which varies by how urgent the number is. */
  className?: string;
}) {
  return (
    <a
      href={`tel:${phone.replace(/\s/g, "")}`}
      className={cn(
        "mt-2 flex items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold text-white",
        className,
      )}
    >
      {label}
    </a>
  );
}
