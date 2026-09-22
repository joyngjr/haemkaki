import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import { AppWordmark } from "@/components/brand/AppMark";
import { BottomNav } from "@/components/nav/BottomNav";
import { ProfileButton } from "@/components/profile/ProfileButton";
import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";

/**
 * The frame every page renders inside, at both sizes.
 *
 * Phone and tablet: a single column capped at `max-w-md`, with the tab bar
 * fixed along the bottom — `pb-28` keeps the last card clear of it. Each
 * page's header carries the profile switcher.
 *
 * From `lg`: no tabs at all. Everything sits on one page (`Dashboard`), under
 * a slim top bar with the name on the left and the account switcher in the
 * top right corner.
 */
export function AppLayout() {
  const { pathname, hash } = useLocation();

  // A new page starts at the top, unless the link named a section to land on.
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname, hash]);

  return (
    <div className="min-h-screen bg-paper">
      <TopBar />
      <main className="mx-auto max-w-md pb-28 sm:px-4 lg:max-w-[1280px] lg:px-8 lg:pb-16">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

function TopBar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-line bg-card/95 backdrop-blur lg:block">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-8">
        <Link
          to="/"
          aria-label="HaemKakis, back to the top"
          onClick={() => {
            if (pathname === "/") window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={cn("-mx-2 rounded-xl px-2 py-1.5", FOCUS_RING)}
        >
          <AppWordmark />
        </Link>
        <ProfileButton variant="pill" />
      </div>
    </header>
  );
}
