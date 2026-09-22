import { ProfileButton } from "@/components/profile/ProfileButton";
import { cn } from "@/lib/utils";

/**
 * The title at the top of a page.
 *
 * The profile switcher sits on the right on a phone, where there is no other
 * way to reach it. From `lg` it lives in the top bar instead.
 */
export function PageHeader({ title, className }: { title: string; className?: string }) {
  return (
    <header className={cn("flex items-center justify-between gap-4", className)}>
      <h1 className="min-w-0 text-2xl font-semibold tracking-[-0.01em] lg:text-[28px] lg:tracking-[-0.015em]">
        {title}
      </h1>
      <ProfileButton className="lg:hidden" />
    </header>
  );
}
