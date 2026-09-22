import type { ReactNode } from "react";

import {
  BleedSteps,
  GuideList,
  MedicalIdSummary,
  WhoToCall,
} from "@/components/tips/ResourceSections";
import { scrollToSection, useScrollToHash } from "@/lib/scroll";
import { cn } from "@/lib/utils";
import {
  EmptyHome,
  HomeHeader,
  HomeSkeleton,
  RecentEntries,
  StatusCard,
  type HomeActions,
} from "@/pages/Home";
import { Tracker } from "@/pages/Tracker";
import { useHomeData } from "@/state/home-context";
import { useProfiles } from "@/state/profile-context";

/** The two columns every band of the page shares, so the cards line up down it. */
const COLUMNS =
  "grid grid-cols-[minmax(0,1fr)_320px] items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-6";

function Column({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-5 xl:gap-6">{children}</div>;
}

/** A card the page can scroll to, landing clear of the sticky top bar. */
function Anchor({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-card">
      {children}
    </div>
  );
}

/**
 * The web version: everything on one page, and no tabs. From `lg` this
 * replaces all three of the phone's tabs — the status card heads the
 * tracker's calendar, the supply and routine cards run down the right, and
 * Resources closes the page. `/tracker` and `/tips` redirect here, scrolled to
 * their part of it.
 *
 * The account switcher sits in the top bar (`AppLayout`), so the header here
 * is only the greeting.
 */
export function Dashboard() {
  const { data, now, isLoading, administerDose, moveNextDose } = useHomeData();
  const { error } = useProfiles();
  useScrollToHash(data !== null);

  if (isLoading) {
    return (
      <div className="pt-8">
        <HomeSkeleton />
      </div>
    );
  }
  if (!data) return <EmptyHome error={error} />;

  // Everything the status card would send you to is already on the page.
  const actions: HomeActions = {
    onRecordDose: ({ takenOn }) => administerDose({ takenOn }),
    onRescheduleDose: ({ movedTo }) => moveNextDose({ movedTo }),
    onRemindLater: () => undefined,
    onOpenTreatmentSetup: () => scrollToSection("routine"),
    onOpenSupply: () => scrollToSection("supply"),
  };

  return (
    <div className="pt-8">
      <HomeHeader user={data.user} now={now} />

      <Tracker
        layout={(cards) => (
          <>
            {cards.errors ? <div className="mt-5">{cards.errors}</div> : null}
            <div className={cn(COLUMNS, "mt-6")}>
              <Column>
                <StatusCard data={data} actions={actions} now={now} />
                <Anchor id="calendar">{cards.calendar}</Anchor>
                <RecentEntries entries={data.recentEntries} />
              </Column>
              <Column>
                <Anchor id="supply">{cards.supply}</Anchor>
                <Anchor id="routine">{cards.routine}</Anchor>
                {cards.planAhead}
                {cards.summary}
                {cards.inventory}
              </Column>
            </div>
          </>
        )}
      />

      <section id="resources" aria-labelledby="resources-title" className="mt-12 scroll-mt-24">
        <h2 id="resources-title" className="text-xl font-semibold">
          Resources
        </h2>
        <div className={cn(COLUMNS, "mt-4")}>
          <Column>
            <MedicalIdSummary />
            <GuideList />
          </Column>
          <Column>
            <BleedSteps />
            <WhoToCall />
          </Column>
        </div>
      </section>
    </div>
  );
}
