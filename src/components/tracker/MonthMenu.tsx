import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";

import { FOCUS_RING } from "@/lib/theme";
import { cn } from "@/lib/utils";

import { ChevronDownIcon } from "./TrackerIcons";

/**
 * The calendar's month title, opened as a scrolling list of months. It
 * replaces the previous back/forward arrows: entries are backdated months
 * later and planned months ahead, so jumping straight to a month beats
 * stepping there one click at a time.
 */
type MonthMenuProps = {
  month: Date;
  today: Date;
  onMonthChange: (month: Date) => void;
};

/** How far the list reaches either side of the month containing today. */
const MONTHS_BACK = 24;
const MONTHS_AHEAD = 12;

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-SG", { month: "long", year: "numeric" });

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function MonthMenu({ month, today, onMonthChange }: MonthMenuProps) {
  const listboxId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const options = useMemo(
    () =>
      Array.from(
        { length: MONTHS_BACK + MONTHS_AHEAD + 1 },
        (_, index) => new Date(today.getFullYear(), today.getMonth() - MONTHS_BACK + index, 1),
      ),
    [today],
  );
  const selectedIndex = options.findIndex((option) => sameMonth(option, month));
  const [activeIndex, setActiveIndex] = useState(selectedIndex < 0 ? MONTHS_BACK : selectedIndex);

  // Close on a click anywhere else, the way every other menu in the app does.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  // Open on the month being shown, scrolled to the middle so the months
  // either side of it are already in view.
  useLayoutEffect(() => {
    if (!open) return;
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>('[data-current="true"]');
    if (list && current) {
      list.scrollTop = current.offsetTop - list.clientHeight / 2 + current.offsetHeight / 2;
    }
  }, [open]);

  const openWith = (index: number) => {
    setActiveIndex(index);
    setOpen(true);
  };

  const select = (index: number) => {
    const next = options[index];
    if (next) onMonthChange(new Date(next.getFullYear(), next.getMonth(), 1));
    setOpen(false);
    triggerRef.current?.focus();
  };

  const move = (delta: number) => {
    const next = Math.min(options.length - 1, Math.max(0, activeIndex + delta));
    setActiveIndex(next);
    listRef.current
      ?.querySelector<HTMLElement>(`#${CSS.escape(`${listboxId}-option-${next}`)}`)
      ?.scrollIntoView({ block: "nearest" });
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          event.preventDefault();
          setOpen(false);
          triggerRef.current?.focus();
        } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault();
          if (!open) openWith(selectedIndex < 0 ? MONTHS_BACK : selectedIndex);
          else move(event.key === "ArrowDown" ? 1 : -1);
        } else if ((event.key === "Enter" || event.key === " ") && open) {
          event.preventDefault();
          select(activeIndex);
        }
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() =>
          open ? setOpen(false) : openWith(selectedIndex < 0 ? MONTHS_BACK : selectedIndex)
        }
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        className={cn(
          "flex items-center gap-1.5 rounded-xl py-1 pl-1 pr-2 text-[17px] font-semibold transition-colors",
          "-ml-1 hover:bg-soft lg:text-[19px]",
          FOCUS_RING,
        )}
      >
        {monthLabel(month)}
        <ChevronDownIcon
          className={cn(
            "h-[18px] w-[18px] text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label="Month"
          aria-activedescendant={`${listboxId}-option-${activeIndex}`}
          tabIndex={-1}
          className="absolute left-0 top-full z-30 mt-1.5 max-h-64 w-56 overflow-y-auto rounded-2xl border border-line bg-card py-1 shadow-xl"
        >
          {options.map((option, index) => {
            const isCurrent = sameMonth(option, month);
            return (
              <button
                key={`${option.getFullYear()}-${option.getMonth()}`}
                id={`${listboxId}-option-${index}`}
                type="button"
                role="option"
                aria-selected={isCurrent}
                data-current={isCurrent}
                onClick={() => select(index)}
                className={cn(
                  "flex w-full items-center justify-between px-4 py-2.5 text-left text-sm",
                  isCurrent ? "font-semibold text-slate-600" : "text-ink",
                  index === activeIndex && !isCurrent && "bg-soft",
                  isCurrent && "bg-slate-50",
                )}
              >
                {monthLabel(option)}
                {sameMonth(option, today) ? (
                  <span className="text-xs text-ink-faint">Current</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
