/**
 * Quick Log — the sheet behind the Kaki button in the middle of the tab bar.
 *
 * Rendered by `AppLayout`, so it opens over whichever page is showing. It
 * writes through `HomeDataProvider`; the tracker's own ledger is separate and
 * a dose recorded here does not yet appear on the tracker calendar.
 *
 * The sheet is local rather than the tracker's `@/components/tracker/Sheet`
 * because that one is built around the tracker's day flows.
 */

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Droplet, Syringe, X } from "lucide-react";

import { GhostRow, INPUT_CLASS, OutlineButton, PrimaryButton, Field } from "@/components/ui/form";
import { formatDateTime } from "@/lib/home-format";
import type {
  AdministerDosePayload,
  HomeActions,
  LogBleedPayload,
  TreatmentStatus,
} from "@/lib/home-data";
import { INK, INK_MUTED, STATUS_TONE_CLASSES } from "@/lib/theme";
import { cn } from "@/lib/utils";

function BottomSheet({
  open,
  onClose,
  title,
  description,
  returnFocusRef,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  returnFocusRef?: RefObject<HTMLButtonElement>;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("button, input, textarea")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    // Captured now: by cleanup time the ref may already point somewhere else.
    const returnTo = returnFocusRef?.current;
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      returnTo?.focus();
    };
  }, [open, onClose, returnFocusRef]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-sand-900/40" aria-hidden="true" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] border border-sand-200 bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={cn("text-lg font-bold", INK)}>{title}</h2>
            <p className={cn("mt-1 text-sm", INK_MUTED)}>{description}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-sand-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

type QuickLogFlow = "menu" | "dose" | "bleed";
type SaveState = "idle" | "submitting" | "success" | "failure";

function toLocalInputValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function QuickLogSheet({
  open,
  onOpenChange,
  treatment,
  now,
  onAdministerDose,
  onLogBleed,
  returnFocusRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  treatment: TreatmentStatus | null;
  now: Date;
  onAdministerDose: HomeActions["onAdministerDose"];
  onLogBleed: HomeActions["onLogBleed"];
  returnFocusRef?: RefObject<HTMLButtonElement>;
}) {
  const [flow, setFlow] = useState<QuickLogFlow>("menu");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [failureMessage, setFailureMessage] = useState("");
  const [doseTime, setDoseTime] = useState(toLocalInputValue(now));
  const [bleedTime, setBleedTime] = useState(toLocalInputValue(now));
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  // Reset on open rather than on close: the same state has to be cleared, but
  // doing it during render means no cascading second render, and the closing
  // sheet keeps its content while it is still on screen.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setFlow("menu");
      setSaveState("idle");
      setFailureMessage("");
      setDoseTime(toLocalInputValue(now));
      setBleedTime(toLocalInputValue(now));
      setLocation("");
      setNote("");
    }
  }

  const close = () => onOpenChange(false);

  const submitDose = async () => {
    if (!treatment?.medicationName || saveState === "submitting") return;
    setSaveState("submitting");
    const payload: AdministerDosePayload = {
      medicationName: treatment.medicationName,
      administeredAt: new Date(doseTime).toISOString(),
    };
    if (treatment.prescribedDose) payload.dose = treatment.prescribedDose;
    const result = await onAdministerDose(payload);
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(
        result.message ?? "We couldn't save this entry. Your record has not been updated.",
      );
      setSaveState("failure");
    }
  };

  const submitBleed = async () => {
    if (saveState === "submitting") return;
    setSaveState("submitting");
    const payload: LogBleedPayload = {
      occurredAt: new Date(bleedTime).toISOString(),
      bodyLocation: location.trim(),
    };
    if (note.trim()) payload.note = note.trim();
    const result = await onLogBleed(payload);
    if (result.ok) setSaveState("success");
    else {
      setFailureMessage(
        result.message ?? "We couldn't save this entry. Your record has not been updated.",
      );
      setSaveState("failure");
    }
  };

  const title = flow === "menu" ? "Quick log" : flow === "dose" ? "Record dose" : "Record a bleed";

  return (
    <BottomSheet
      open={open}
      onClose={close}
      title={title}
      description={
        flow === "menu" ? "Choose what you want to record." : "Review the details before saving."
      }
      {...(returnFocusRef ? { returnFocusRef } : {})}
    >
      {saveState === "success" ? (
        <div className="py-8" role="status">
          <p className={cn("text-lg font-bold", INK)}>
            {flow === "dose" ? "Dose recorded" : "Bleed recorded"}
          </p>
          <PrimaryButton className="mt-5 w-full" onClick={close}>
            Done
          </PrimaryButton>
        </div>
      ) : flow === "menu" ? (
        <div className="mt-5 divide-y divide-sand-200">
          <GhostRow className="min-h-16 rounded-none px-1 py-4" onClick={() => setFlow("dose")}>
            <Syringe className="h-5 w-5 text-sand-700" aria-hidden="true" />
            <span>
              <span className={cn("block font-semibold", INK)}>Administer dose now</span>
              <span className={cn("block whitespace-normal text-sm font-normal", INK_MUTED)}>
                Record your prophylactic dose.
              </span>
            </span>
          </GhostRow>
          <GhostRow className="min-h-16 rounded-none px-1 py-4" onClick={() => setFlow("bleed")}>
            <Droplet
              className={cn("h-5 w-5", STATUS_TONE_CLASSES.caution.soft.split(" ")[1])}
              aria-hidden="true"
            />
            <span>
              <span className={cn("block font-semibold", INK)}>Had a bleed</span>
              <span className={cn("block whitespace-normal text-sm font-normal", INK_MUTED)}>
                Record a bleed event.
              </span>
            </span>
          </GhostRow>
        </div>
      ) : flow === "dose" ? (
        <div className="mt-5 space-y-5">
          {treatment?.medicationName ? (
            <div>
              <p className={cn("font-semibold", INK)}>{treatment.medicationName}</p>
              {treatment.prescribedDose ? (
                <p className={cn("text-sm", INK_MUTED)}>{treatment.prescribedDose}</p>
              ) : null}
            </div>
          ) : (
            <p className={cn("text-sm", INK_MUTED)}>
              Medication information is unavailable. Check your treatment information before
              recording a dose.
            </p>
          )}
          <Field id="dose-time" label="Taken">
            <input
              id="dose-time"
              type="datetime-local"
              value={doseTime}
              onChange={(event) => setDoseTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <p className={cn("text-xs", INK_MUTED)}>{formatDateTime(new Date(doseTime), now)}</p>
          {saveState === "failure" ? (
            <p role="alert" className={cn("text-sm font-medium", INK)}>
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={() => setFlow("menu")}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={!treatment?.medicationName || saveState === "submitting"}
              onClick={submitDose}
            >
              {saveState === "submitting"
                ? "Saving…"
                : saveState === "failure"
                  ? "Try again"
                  : "Confirm dose"}
            </PrimaryButton>
          </div>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          <Field id="bleed-time" label="Date and time">
            <input
              id="bleed-time"
              type="datetime-local"
              value={bleedTime}
              onChange={(event) => setBleedTime(event.target.value)}
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bleed-location" label="Body location">
            <input
              id="bleed-location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Enter the location"
              className={INPUT_CLASS}
            />
          </Field>
          <Field id="bleed-note" label="Note (optional)">
            <textarea
              id="bleed-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              className={cn(INPUT_CLASS, "min-h-24")}
            />
          </Field>
          {saveState === "failure" ? (
            <p role="alert" className={cn("text-sm font-medium", INK)}>
              {failureMessage}
            </p>
          ) : null}
          <div className="flex gap-3">
            <OutlineButton className="flex-1" onClick={() => setFlow("menu")}>
              Cancel
            </OutlineButton>
            <PrimaryButton
              className="flex-1"
              disabled={!location.trim() || saveState === "submitting"}
              onClick={submitBleed}
            >
              {saveState === "submitting"
                ? "Saving…"
                : saveState === "failure"
                  ? "Try again"
                  : "Confirm bleed"}
            </PrimaryButton>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}
