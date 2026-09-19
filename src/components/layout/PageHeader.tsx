import { ProfileButton } from "@/components/profile/ProfileButton";

/**
 * Title block at the top of a page, with the profile switcher on the right.
 *
 * Home has its own header instead, but it carries the same `ProfileButton` —
 * the switcher has to be reachable from every top-level route, not just Home.
 */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-sand-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-sand-600">{subtitle}</p> : null}
      </div>
      <ProfileButton />
    </header>
  );
}
