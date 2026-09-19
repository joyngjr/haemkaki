/** Glyphs on a post's action row. */
export function TrashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        d="M6 7h12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Filled red once the reader has liked the post. */
export function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={filled ? "#ef4444" : "none"}
      stroke={filled ? "#ef4444" : "currentColor"}
      strokeWidth="1.8"
    >
      <path d="M12 21s-7-4.5-9.5-9C0.8 8.5 2 5 5.2 4.3c2-0.4 3.8 0.6 4.8 2.2 1-1.6 2.8-2.6 4.8-2.2C18 5 19.2 8.5 21.5 12c-2.5 4.5-9.5 9-9.5 9z" />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5H4l3-3.5A8.38 8.38 0 0 1 4 8.5 8.38 8.38 0 0 1 12.5 3 8.5 8.5 0 0 1 21 11.5z" />
    </svg>
  );
}
