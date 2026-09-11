import { Link } from "react-router-dom";

function StepIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
      {children}
    </div>
  );
}

function VialIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M9 3h6M10 3v4l-2 3v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9l-2-3V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M8 15h8" strokeLinecap="round" />
    </svg>
  );
}

function CleanVialIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M9 3h6M10 3v4l-2 3v9a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-9l-2-3V3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M4 5l3 3M4 8l3-3" strokeLinecap="round" />
    </svg>
  );
}

function FilterSyringeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M18 6l-3-3M15 6l3 3M4 20l3-1 1-3 8-8-3-3-8 8-1 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="18" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

function SyringeSwapIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 20l3-1 1-3 8-8-3-3-8 8-1 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 4l4 4" strokeLinecap="round" />
    </svg>
  );
}

function PinchSkinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 3c-1 3-1 5 0 7s1 4 0 7" strokeLinecap="round" />
      <path d="M8 6c1 3 1 4 0 6M16 6c-1 3-1 4 0 6" strokeLinecap="round" />
    </svg>
  );
}

function AngleSyringeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M18 6l-3-3M15 6l3 3M4 20l3-1 1-3 8-8-3-3-8 8-1 3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M2 21h20" strokeLinecap="round" />
    </svg>
  );
}

const steps = [
  {
    icon: <VialIcon />,
    text: "Allow the medication vial, pen, or pre-filled syringe to reach room temperature.",
  },
  {
    icon: <CleanVialIcon />,
    text: "Wash hands and clean the rubber vial stopper with an alcohol wipe.",
  },
  {
    icon: <FilterSyringeIcon />,
    text: "Use a specialized transfer needle with a filter attached to a syringe to withdraw the exact prescribed dose.",
  },
  {
    icon: <SyringeSwapIcon />,
    text: "Replace the transfer needle with a fresh subcutaneous injection needle before administering.",
  },
  { icon: <PinchSkinIcon />, text: "Gently pinch a fold of skin." },
  {
    icon: <AngleSyringeIcon />,
    text: "Push the needle fully into the skin at a 45-degree to 90-degree angle using a quick, firm motion.",
  },
];

export function SubcutaneousInjection() {
  return (
    <div className="px-4 pt-8 pb-8">
      <Link
        to="/tips/injection-guide"
        className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </Link>

      <div className="mt-4 border-b-2 border-blue-600 pb-4">
        <p className="text-xs font-bold tracking-widest text-blue-600">INJECTION GUIDE</p>
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900">General Subcutaneously</h1>
        <p className="text-sm text-gray-500">(Subcutaneous Injection)</p>
      </div>

      <div className="mt-4 flex items-start gap-3 rounded-[20px] bg-blue-50 p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-sm text-blue-900">Wash your hands thoroughly before you begin.</p>
      </div>

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

      <div className="mt-4 flex items-start gap-3 rounded-[20px] bg-blue-50 p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-sm text-blue-900">For pre-filled pens, no mixing is required.</p>
      </div>
    </div>
  );
}
