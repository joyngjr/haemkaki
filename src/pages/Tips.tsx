import { Link } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";

// Each tip card: a title, description, background color, and where it links to.
const tipCards = [
  {
    to: "/tips/medical-id",
    title: "My Medical ID",
    description: "Keep your important information ready.",
    bg: "bg-red-100",
    iconBg: "bg-red-500",
    arrowBg: "bg-red-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6 text-white">
        <rect x="3" y="5" width="18" height="14" rx="2" fill="currentColor" opacity="0.001" />
        <circle cx="9" cy="10" r="2" stroke="white" strokeWidth="1.5" />
        <path
          d="M6 16c0-1.7 1.3-3 3-3s3 1.3 3 3"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="13"
          y1="9"
          x2="18"
          y2="9"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <line
          x1="13"
          y1="13"
          x2="18"
          y2="13"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    to: "/tips/injection-guide",
    title: "Injection Guide",
    description: "Step-by-step routine and helpful tips.",
    bg: "bg-blue-100",
    iconBg: "bg-transparent",
    arrowBg: "bg-blue-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-blue-500">
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
    to: "/tips/find-medical-help",
    title: "Find Medical Help",
    description: "Locate nearby hospitals and treatment centres.",
    bg: "bg-green-100",
    iconBg: "bg-transparent",
    arrowBg: "bg-green-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-green-600">
        <path
          d="M12 22s7-7.5 7-12.5A7 7 0 0 0 5 9.5C5 14.5 12 22 12 22z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="12" cy="9.5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    to: "/tips/community",
    title: "Community",
    description: "Connect, ask and share with others.",
    bg: "bg-purple-100",
    iconBg: "bg-transparent",
    arrowBg: "bg-purple-200",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8 text-purple-600">
        <circle cx="9" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="17" cy="9" r="2" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4 19c0-2.8 2.2-5 5-5s5 2.2 5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M14 15c2.2 0 4 1.8 4 4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export function Tips() {
  return (
    <div className="px-4 pt-8">
      <PageHeader title="Tips" subtitle="Living well with haemophilia." />

      {/* 2x2 grid of cards, each one a link to its own page */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {tipCards.map((card) => (
          <Link
            key={card.to}
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
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-gray-700">
                    <path
                      d="M9 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
