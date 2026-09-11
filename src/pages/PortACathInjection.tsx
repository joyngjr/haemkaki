import { Link } from "react-router-dom";

function StepIcon({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50">
      {children}
    </div>
  );
}

function AngleNeedleIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M12 3v10" strokeLinecap="round" />
      <path d="M12 13l0 4" strokeLinecap="round" />
      <circle cx="12" cy="19" r="2" />
      <path d="M9 3h6" strokeLinecap="round" />
    </svg>
  );
}

function SalinePushIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 20l3-1 1-3 8-8-3-3-8 8-1 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 10v4" strokeLinecap="round" />
    </svg>
  );
}

function MedicationPushIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <rect
        x="9"
        y="3"
        width="6"
        height="10"
        rx="1.5"
        fill="currentColor"
        stroke="none"
        opacity="0.25"
      />
      <rect x="9" y="3" width="6" height="10" rx="1.5" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  );
}

function FlushIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-600"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
    >
      <path d="M4 20l3-1 1-3 8-8-3-3-8 8-1 3z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l0 6" strokeLinecap="round" />
      <path d="M17 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const steps = [
  {
    icon: <AngleNeedleIcon />,
    text: "Hold the non-coring needle at a 90-degree angle perpendicular to the skin. Push the needle firmly straight down through the skin and the rubber septum until the tip firmly hits the metal or titanium floor of the port reservoir.",
  },
  {
    icon: <SalinePushIcon />,
    text: 'Push 3 to 10 mL of normal saline into the line using a "push-and-pause" method to clear any resting blood from the catheter.',
  },
  {
    icon: <MedicationPushIcon />,
    text: "Disconnect the saline syringe, connect the syringe containing the mixed haemophilia medication, and slowly push the medication into the port.",
  },
  {
    icon: <FlushIcon />,
    text: "Once the medicine is delivered, flush the line again with a fresh syringe of normal saline to ensure all medication is pushed into the bloodstream.",
  },
];

export function PortACathInjection() {
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
        <h1 className="mt-1 text-2xl font-extrabold text-gray-900">Port-a-Cath</h1>
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

      <div className="mt-3 flex items-start gap-3 rounded-[20px] bg-blue-50 p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="white"
            strokeWidth="2"
          >
            <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-sm font-semibold text-blue-900">
          Must be done by a trained adult + important to maintain a sterile field.
        </p>
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
