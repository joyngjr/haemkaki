import { Link } from "react-router-dom";

/**
 * The "Back" link that sits above the header on every page below a tab root.
 *
 * `to` is an explicit destination rather than history.back() so the arrow always
 * walks one level up the route tree, even when the page was opened from a deep
 * link or reached sideways.
 */
export function BackLink({ to }: { to: string }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500">
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
  );
}
