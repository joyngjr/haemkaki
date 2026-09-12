import { cn } from "@/lib/utils";

/** The badge glyphs a Callout can carry. All three share a frame, so it lives here. */
function CalloutGlyph({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="white" strokeWidth="2">
      {children}
    </svg>
  );
}

/** Default: a bare "i". */
export function InfoIcon() {
  return <CalloutGlyph>{<path d="M12 16v-4M12 8h.01" strokeLinecap="round" />}</CalloutGlyph>;
}

/** An "i" in a ring, for an aside rather than a prerequisite. */
export function NoteIcon() {
  return (
    <CalloutGlyph>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
    </CalloutGlyph>
  );
}

/** An exclamation, for something that must happen rather than something helpful. */
export function WarningIcon() {
  return <CalloutGlyph>{<path d="M12 9v4M12 17h.01" strokeLinecap="round" />}</CalloutGlyph>;
}

const TONES = {
  /** Blue: advice the reader should act on before continuing. */
  info: { box: "bg-blue-50", badge: "bg-blue-600", text: "text-sm text-blue-900" },
  /** Grey: a disclaimer that should not compete with the content above it. */
  muted: { box: "bg-gray-100", badge: "bg-blue-500", text: "text-xs text-gray-600" },
} as const;

type CalloutProps = {
  children: React.ReactNode;
  /** Defaults to <InfoIcon />. */
  icon?: React.ReactNode;
  tone?: keyof typeof TONES;
  emphasis?: boolean;
  /** Top margin, which varies with what the callout follows. */
  className?: string;
};

/** An icon-and-text notice box. */
export function Callout({
  children,
  icon = <InfoIcon />,
  tone = "info",
  emphasis = false,
  className,
}: CalloutProps) {
  const styles = TONES[tone];
  return (
    <div className={cn("flex items-start gap-3 rounded-[20px] p-4", styles.box, className)}>
      <span
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white",
          styles.badge,
        )}
      >
        {icon}
      </span>
      <p className={cn(styles.text, emphasis && "font-semibold")}>{children}</p>
    </div>
  );
}
