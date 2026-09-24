import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The raised surface everything sits on: white, one hairline border, 20px
 * corners. No shadows — the kit leans on whitespace instead.
 *
 * `padded` is the common case; pass `padded={false}` when a child needs to
 * bleed to the edge (the status scene, a list of full-width rows).
 */
export function Card({
  children,
  className,
  padded = true,
  as: Tag = "section",
  ...rest
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
  as?: "section" | "div" | "article";
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cn("rounded-card border border-line bg-card", padded && "p-4 sm:p-5", className)}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/** A section heading inside a card: 16px on mobile, 17px from `sm`. */
export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={cn("text-base font-semibold sm:text-[17px]", className)}>{children}</h2>;
}

/** The "Recent · See all" row that heads several cards. */
export function CardHeaderRow({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between gap-3", className)}>
      <CardTitle>{title}</CardTitle>
      {action}
    </div>
  );
}
