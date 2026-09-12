/**
 * The title block on a single injection guide: eyebrow, name, and the blue rule
 * that separates it from the steps. Carries its own top margin because it always
 * follows a <BackLink />.
 */
export function InjectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mt-4 border-b-2 border-blue-600 pb-4">
      <p className="text-xs font-bold tracking-widest text-blue-600">INJECTION GUIDE</p>
      <h1 className="mt-1 text-2xl font-extrabold text-gray-900">{title}</h1>
      {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
    </div>
  );
}
