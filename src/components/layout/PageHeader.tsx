/** Title block at the top of a page. Home has its own header instead. */
export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header>
      <h1 className="text-2xl font-bold tracking-tight text-sand-900">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-sand-600">{subtitle}</p> : null}
    </header>
  );
}
