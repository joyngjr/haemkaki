export type InjectionStep = {
  /** One of the exports from ./StepIcons. */
  icon: React.ReactNode;
  text: string;
};

/** The tile the step glyph sits in. */
function StepIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
      {children}
    </div>
  );
}

/**
 * The numbered step list shared by every injection guide. Steps are numbered by
 * position, so reordering the array reorders the guide.
 */
export function InjectionSteps({ steps }: { steps: readonly InjectionStep[] }) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      {steps.map((step, index) => (
        <div key={index} className="flex items-center gap-4 rounded-[20px] bg-gray-50 p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
            {index + 1}
          </span>
          <p className="flex-1 text-sm text-gray-700">{step.text}</p>
          <StepIcon>{step.icon}</StepIcon>
        </div>
      ))}
    </div>
  );
}
