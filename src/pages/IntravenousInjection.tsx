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

function TwoVialsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path
        d="M5 4h3M6 4v3l-1 2v7a1.5 1.5 0 0 0 1.5 1.5h1A1.5 1.5 0 0 0 9 16V9L8 7V4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M16 4h3M17 4v3l-1 2v7a1.5 1.5 0 0 0 1.5 1.5h1a1.5 1.5 0 0 0 1.5-1.5V9l-1-2V4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M9 10h7" strokeLinecap="round" />
    </svg>
  );
}

function SyringeIcon() {
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
    </svg>
  );
}

function SwabIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <circle cx="8" cy="8" r="3" />
      <path d="M10.5 10.5 18 18" strokeLinecap="round" />
      <path d="M15 19l3-3 1 1-3 3z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const steps = [
  { icon: <VialIcon />, text: "Let the clotting factor vial warm to room temperature." },
  {
    icon: <TwoVialsIcon />,
    text: "Mix the factor powder with sterile water using a transfer needle or device.",
  },
  { icon: <SyringeIcon />, text: "Draw the solution into a syringe." },
  {
    icon: <SwabIcon />,
    text: "Use an alcohol swipe to clean the injection site and inject into vein.",
  },
];

export function IntravenousInjection() {
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
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900">General Intravenously</h1>
        <p className="text-sm text-gray-500">(IV Injection)</p>
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
    </div>
  );
}
