type NavItem = "home" | "tracker" | "tips";

export function BottomNav({ active }: { active: NavItem }) {
  const items = [
    { key: "home" as const, href: "/", label: "Home", icon: <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V10Z" /> },
    { key: "tracker" as const, href: "/tracker", label: "Tracker", icon: <><rect x="4" y="5" width="16" height="16" rx="2" /><path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01" /></> },
    { key: "tips" as const, href: "/tips", label: "Tips", icon: <path d="M9 18h6M10 22h4M8.5 15.5C7 14.4 6 12.6 6 10.5a6 6 0 1 1 12 0c0 2.1-1 3.9-2.5 5" /> },
  ];

  return <nav aria-label="Primary navigation" className="fixed inset-x-0 bottom-0 z-20 border-t border-[#eee5d5] bg-[#f8f0e2]/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(74,53,32,0.06)] backdrop-blur"><div className="mx-auto flex max-w-md items-end justify-around gap-2">{items.map((item) => <a key={item.key} href={item.href} aria-current={active === item.key ? "page" : undefined} className={`flex w-20 flex-col items-center gap-1.5 ${active === item.key ? "text-[#443229]" : "text-[#806d51] transition hover:text-[#443229]"}`}><svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{item.icon}</svg><span className="text-sm font-semibold">{item.label}</span></a>)}</div></nav>;
}
