import type { ReactNode } from "react";

import { GuideList, MedicalIdSummary } from "@/components/tips/ResourceSections";
import { scrollToSection, useScrollToHash } from "@/lib/scroll";
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

/** A card the page can scroll to, landing clear of the sticky top bar. */
function Anchor({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 rounded-card">
      {children}
    </div>
  );
}

/** One of the page's two headed parts: Tracker, then Resources. */
function PageSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mt-12 scroll-mt-24">
      <h2 id={`${id}-title`} className="text-[22px] font-semibold tracking-[-0.015em]">
        {title}
      </h2>
      {children}
    </section>
  );
}

/** A run of cards under a small-caps label — "Doses", "Supplies". */
function CardGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-4 [&+&]:mt-9">
      <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-subtle">
        {label}
      </h3>
      <div className="mt-3 flex flex-col gap-5">{children}</div>
    </div>
  );
}

/**
 * The web version: everything on one page, and no tabs. From `lg` this
 * replaces all three of the phone's tabs, in one column: the greeting and the
 * status card, then Tracker — the routine, the calendar, the recent entries
 * and the plans under "Doses"; factor at home and the other supplies under
 * "Supplies" — and Resources to close. `/tracker` and `/tips` redirect here,
 * scrolled to their part of it.
 *
 * The account switcher sits in the top bar (`AppLayout`), so the header here
 * is only the greeting.
 */
export function Dashboard() {
  const { data, now, isLoading, administerDose, setUpRoutine } = useHomeData();
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

  // Everything the status card would send you to is already on the page, and
  // setting a routine up opens on the card itself rather than on the tracker's
  // routine card below it.
  const actions: HomeActions = {
    onRecordDose: ({ takenOn }) => administerDose({ takenOn }),
    onRemindLater: () => undefined,
    onSetUpRoutine: setUpRoutine,
    onOpenSupply: () => scrollToSection("supply"),
  };

  return (
    <div className="pt-8">
      <HomeHeader user={data.user} now={now} />
      <div className="mt-7">
        <StatusCard data={data} actions={actions} now={now} />
      </div>

      <Tracker
        offersRoutineSetup={false}
        layout={(cards) => (
          <PageSection id="tracker" title="Tracker">
            {cards.errors ? <div className="mt-4">{cards.errors}</div> : null}
            <CardGroup label="Doses">
              {cards.routine}
              <Anchor id="calendar">{cards.calendar}</Anchor>
              <RecentEntries entries={data.recentEntries} />
              {cards.planAhead}
              {cards.device}
            </CardGroup>
            <CardGroup label="Supplies">
              <Anchor id="supply">{cards.supply}</Anchor>
              {cards.inventory}
            </CardGroup>
          </PageSection>
        )}
      />

      <PageSection id="resources" title="Resources">
        <div className="mt-4 flex flex-col gap-5">
          <MedicalIdSummary />
          <GuideList />
        </div>
      </PageSection>
    </div>
  );
}
