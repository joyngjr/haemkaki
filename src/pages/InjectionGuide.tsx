import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";

const injectionTypes = [
  {
    to: "/tips/injection-guide/intravenous",
    title: "Intravenous Injection",
    description:
      "Medication is injected directly into a vein, allowing clotting factor to enter the bloodstream quickly. Commonly used for factor replacement therapy.",
    buttonLabel: "View IV Guide",
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
        <path
          d="M18 6L6 18M14 4l6 6M4 20l3-1 1-3 8-8-3-3-8 8-1 3z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    to: "/tips/injection-guide/subcutaneous",
    title: "Subcutaneous Injection",
    description:
      "Medication is injected into the fatty tissue just beneath the skin, commonly around the abdomen or thigh. Some haemophilia treatments, such as emicizumab, are given this way.",
    buttonLabel: "View SC Guide",
    bg: "bg-green-50",
    iconBg: "bg-green-600",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
        <path
          d="M12 2v14M12 16l-3-3M12 16l3-3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="5" y="18" width="14" height="4" rx="2" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    to: "/tips/injection-guide/port-a-cath",
    title: "Port-a-Cath Injection",
    description:
      "Medication is given through an implanted port placed beneath the skin and connected to a vein. Ports may be used when regular access to a vein is difficult.",
    buttonLabel: "View Port Guide",
    bg: "bg-red-50",
    iconBg: "bg-red-400",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 text-white">
        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <path d="M12 17v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function InjectionGuide() {
  return (
    <div className="px-4 pt-8 pb-8">
      <Link
        to="/tips"
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
      <PageHeader
        title="Injection Guides"
        subtitle="Learn about the different ways haemophilia medication may be given."
      />

      {/* The 3 injection type cards */}
      <div className="mt-5 flex flex-col gap-4">
        {injectionTypes.map((type) => (
          <div
            key={type.to}
            className={`${type.bg} rounded-[28px] p-5 shadow-lg flex items-center gap-4`}
          >
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
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Disclaimer at the bottom */}
      <div className="mt-5 flex items-start gap-3 rounded-[20px] bg-gray-100 p-4">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-white">
          <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
            <path d="M12 16v-4M12 8h.01" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <p className="text-xs text-gray-600">
          Always follow the injection instructions provided by your haemophilia care team. This
          information is for educational purposes and does not replace professional medical advice.
        </p>
      </div>
    </div>
  );
}
