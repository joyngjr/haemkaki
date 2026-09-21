import { useRef, useState } from "react";
import {
  CalendarDays,
  Camera,
  Check,
  CircleCheck,
  CircleHelp,
  Copy,
  Droplet,
  Eye,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Image,
  LoaderCircle,
  MinusCircle,
  Package,
  Pencil,
  RefreshCw,
  Syringe,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { api, type ImportCandidate, type ImportRereadHint } from "@/lib/api";
import type { EntryMap } from "@/lib/tracker-entries";

type Stage = "choose" | "reading" | "summary" | "review" | "confirm" | "success";
type Candidate = ImportCandidate & { checked: boolean; skipped: boolean; duplicate: boolean };

const ACCEPTED = ".xlsx,.xls,.csv,.pdf,.docx,.jpg,.jpeg,.png";
const FIELD =
  "mt-1 min-h-11 w-full rounded-xl border border-[#d9cbb6] bg-white px-3 text-sm text-[#443229] outline-none focus:border-[#6b3817] focus:ring-2 focus:ring-[#8df5c0]";
const BUTTON =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-[#6b3817] focus-visible:ring-offset-2";

function csvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quote = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quote && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else quote = !quote;
    } else if (character === "," && !quote) {
      row.push(cell.trim());
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quote) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function key(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function value(row: Record<string, string>, ...names: string[]) {
  return (
    names
      .map(key)
      .map((name) => row[name])
      .find(Boolean) ?? ""
  );
}

function csvCandidates(file: File, text: string): Candidate[] {
  const rows = csvRows(text);
  const header = rows.shift();
  if (!header) return [];
  return rows.flatMap((cells, rowIndex) => {
    const row = Object.fromEntries(header.map((name, index) => [key(name), cells[index] ?? ""]));
    const date = value(row, "date", "occurred on", "infusion date", "treatment date");
    const event = value(row, "type", "event", "reason", "record type").toLowerCase();
    const location = value(row, "bleed location", "location", "where was the bleed");
    const isBleed = event.includes("bleed") || Boolean(location);
    const vialsText = value(row, "vials", "number of vials", "vial count");
    const vials = Number(vialsText);
    const dose = Number(value(row, "dose iu", "dose", "iu"));
    const validDate =
      /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00`));
    const validVials = Number.isFinite(vials) && vials > 0;
    const reason = event.includes("prophylaxis")
      ? "prophylaxis"
      : event.includes("follow")
        ? "follow-up"
        : "on-demand";
    return [
      {
        id: `${file.name}-${rowIndex + 2}`,
        kind: isBleed ? "bleed" : "infusion",
        occurred_on: validDate ? date : null,
        occurred_at: value(row, "time", "occurred at") || null,
        product: value(row, "product", "brand", "factor") || null,
        dose_iu: Number.isFinite(dose) && dose > 0 ? dose : null,
        vials: validVials ? vials : null,
        reason,
        bleed_location: location || null,
        notes: value(row, "notes", "note") || null,
        source: `${file.name} · row ${rowIndex + 2}`,
        // The current tracker can persist only factor-use events with a date and vial count.
        // Prophylaxis vials are derived from the server-side schedule in the
        // current Tracker API. Do not silently discard the source's quantity.
        state:
          !isBleed && reason !== "prophylaxis" && validDate && validVials
            ? "ready"
            : "needs_review",
        checked: false,
        skipped: false,
        duplicate: false,
      },
    ];
  });
}

function candidateFromServer(candidate: ImportCandidate): Candidate {
  return { ...candidate, checked: false, skipped: false, duplicate: false };
}

function IconRow({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-16 w-full items-center gap-3 rounded-2xl border border-[#e2d4c0] bg-[#fffaf0] p-3 text-left outline-none transition hover:bg-[#f4ead8] focus-visible:ring-2 focus-visible:ring-[#6b3817]"
    >
      <Icon className="h-5 w-5 shrink-0 text-[#6b3817]" />
      <span>
        <span className="block font-bold">{title}</span>
        <span className="text-xs text-[#806d51]">{description}</span>
      </span>
    </button>
  );
}

export function ImportRecordsFlow({
  profileId,
  entries,
  onClose,
  onPersisted,
}: {
  profileId?: number;
  entries: EntryMap;
  onClose: () => void;
  onPersisted: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [files, setFiles] = useState<File[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [rereading, setRereading] = useState<string | null>(null);
  const [hints, setHints] = useState<ImportRereadHint[]>([]);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(0);

  const ready = candidates.filter((candidate) => candidate.state === "ready" && !candidate.skipped);
  const needsHelp = candidates.filter(
    (candidate) => candidate.state === "needs_review" && !candidate.skipped,
  );
  const checked = candidates.filter(
    (candidate) => candidate.checked && !candidate.skipped && !candidate.duplicate,
  );

  function hasDuplicate(candidate: Candidate) {
    if (!candidate.occurred_on || !candidate.vials) return false;
    return (entries[candidate.occurred_on] ?? []).some(
      (entry) =>
        entry.kind !== "missed" &&
        entry.kind !== "makeup" &&
        entry.kind !== "prophylaxis" &&
        entry.vials === candidate.vials,
    );
  }

  async function process(nextFiles: File[]) {
    setFiles(nextFiles);
    setError(null);
    if (profileId === undefined) {
      setError("Choose a profile before importing records.");
      return;
    }
    setStage("reading");
    try {
      const csvFiles = nextFiles.filter((file) => file.name.toLowerCase().endsWith(".csv"));
      const otherFiles = nextFiles.filter((file) => !file.name.toLowerCase().endsWith(".csv"));
      const local = (
        await Promise.all(csvFiles.map(async (file) => csvCandidates(file, await file.text())))
      ).flat();
      const remote = otherFiles.length
        ? (await api.readImport(profileId, otherFiles)).candidates.map(candidateFromServer)
        : [];
      const found = [...local, ...remote].map((candidate) => ({
        ...candidate,
        duplicate: hasDuplicate(candidate),
      }));
      if (!found.length) throw new Error("We couldn't find treatment records in this file.");
      setCandidates(found);
      setStage("summary");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't read this file.");
      setStage("choose");
    }
  }

  function update(id: string, change: Partial<Candidate>) {
    setCandidates((current) =>
      current.map((candidate) => (candidate.id === id ? { ...candidate, ...change } : candidate)),
    );
  }

  async function reread() {
    if (!rereading) return;
    if (profileId === undefined) return;
    setError(null);
    try {
      const original = candidates.find((candidate) => candidate.id === rereading);
      if (!original) return;
      const sourceFile = files.find((file) => original.source.startsWith(file.name));
      if (sourceFile?.name.toLowerCase().endsWith(".csv")) {
        // CSV is interpreted deterministically in the browser; rereading means rerunning that same source.
        const fresh = csvCandidates(sourceFile, await sourceFile.text()).find(
          (candidate) => candidate.id === rereading,
        );
        if (fresh)
          update(rereading, {
            ...fresh,
            checked: false,
            skipped: false,
            duplicate: hasDuplicate(fresh),
          });
      } else if (sourceFile) {
        const result = await api.readImport(profileId, [sourceFile], hints, note);
        const fresh = result.candidates[0];
        if (fresh)
          update(rereading, { ...candidateFromServer(fresh), checked: false, skipped: false });
      }
      setRereading(null);
      setHints([]);
      setNote("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't read this file.");
    }
  }

  async function persist() {
    setError(null);
    if (profileId === undefined) {
      setError("Choose a profile before adding records to Tracker.");
      return;
    }
    const createdIds: number[] = [];
    try {
      for (const candidate of checked) {
        if (
          !candidate.occurred_on ||
          !candidate.vials ||
          candidate.kind !== "infusion" ||
          candidate.reason === "prophylaxis"
        ) {
          throw new Error(
            "This Tracker cannot safely store one or more checked records. Please skip them or use the server importer.",
          );
        }
      }
      for (const candidate of checked) {
        // The first loop established every field needed for these two drafts.
        if (!candidate.occurred_on || !candidate.vials) continue;
        const event = await api.createEvent(
          profileId,
          candidate.reason === "follow-up"
            ? { kind: "follow-up", occurred_on: candidate.occurred_on, vials: candidate.vials }
            : { kind: "on-demand", occurred_on: candidate.occurred_on, vials: candidate.vials },
        );
        createdIds.push(event.id);
      }
      setSaved(checked.length);
      onPersisted();
      setStage("success");
    } catch (cause) {
      // The API has no batch-create endpoint. Best-effort rollback prevents a
      // failed sequence from leaving a partially imported batch behind.
      await Promise.all(
        createdIds.map((id) => api.deleteEvent(profileId, id).catch(() => undefined)),
      );
      setError(
        cause instanceof Error ? cause.message : "We couldn't add these records. Please try again.",
      );
    }
  }

  const editor = candidates.find((candidate) => candidate.id === editing);
  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#f8f0e2] px-4 py-5 pb-28 text-[#443229]">
      <main className="mx-auto max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#806d51]">
            {stage === "choose"
              ? "1 of 4 · Choose records"
              : stage === "review"
                ? "3 of 4 · Fix anything wrong"
                : stage === "confirm"
                  ? "4 of 4 · Add to Tracker"
                  : "Import records"}
          </p>
          <button onClick={onClose} className={`${BUTTON} bg-transparent text-[#6b3817]`}>
            Close
          </button>
        </div>
        {error && (
          <p role="alert" className="mb-4 rounded-2xl bg-[#fff0dc] p-4 text-sm">
            <TriangleAlert className="mr-2 inline h-5 w-5" />
            {error}
          </p>
        )}
        {stage === "choose" && (
          <>
            <h2 className="text-3xl font-bold text-[#6b3817]">Import your records</h2>
            <p className="mt-2 text-sm leading-6 text-[#806d51]">
              Upload records you’ve already been keeping. You’ll check everything before anything is
              added.
            </p>
            <div className="mt-6 space-y-3">
              <IconRow
                icon={FileSpreadsheet}
                title="Spreadsheet"
                description="Excel or CSV"
                onClick={() => fileInput.current?.click()}
              />
              <IconRow
                icon={FileText}
                title="Document"
                description="PDF or Word"
                onClick={() => fileInput.current?.click()}
              />
              <IconRow
                icon={Image}
                title="Photo"
                description="JPG or PNG"
                onClick={() => fileInput.current?.click()}
              />
              <IconRow
                icon={Camera}
                title="Take a photo"
                description="Use your camera"
                onClick={() => {
                  if (fileInput.current) {
                    fileInput.current.capture = "environment";
                    fileInput.current.click();
                  }
                }}
              />
            </div>
            <p className="mt-5 text-xs leading-5 text-[#806d51]">
              HaemKakis uses an AI service to help read different record formats. You’ll check
              everything before anything is added to Tracker.
            </p>
            <input
              ref={fileInput}
              className="sr-only"
              type="file"
              accept={ACCEPTED}
              multiple
              onChange={(event) => {
                const selected = Array.from(event.target.files ?? []);
                if (selected.length) void process(selected);
                event.target.value = "";
              }}
            />
          </>
        )}
        {stage === "reading" && (
          <div className="pt-20 text-center">
            <LoaderCircle className="mx-auto h-10 w-10 animate-spin text-[#6b3817]" />
            <h2 className="mt-5 text-2xl font-bold">Reading your records...</h2>
            <p className="mt-2 text-sm text-[#806d51]">Finding treatment and bleed records.</p>
            <div className="mx-auto mt-8 max-w-xs space-y-3 text-left text-sm">
              <p>
                <Check className="mr-2 inline h-4 w-4 text-[#3c8d67]" />
                Reading files
              </p>
              <p>
                <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                Finding records
              </p>
              <p className="text-[#806d51]">○ Checking records</p>
            </div>
          </div>
        )}
        {stage === "summary" && (
          <>
            <h2 className="text-3xl font-bold text-[#6b3817]">Records found</h2>
            <div className="mt-6 space-y-3">
              <p className="rounded-2xl bg-[#e6f6e9] p-4">
                <CircleCheck className="mr-2 inline h-5 w-5 text-[#3c8d67]" />
                {ready.length} look ready
              </p>
              <p className="rounded-2xl bg-[#fff3d9] p-4">
                <CircleHelp className="mr-2 inline h-5 w-5 text-[#97720b]" />
                {needsHelp.length} need your help
              </p>
              <p className="rounded-2xl bg-[#f0ebe1] p-4">
                <Copy className="mr-2 inline h-5 w-5" />
                {candidates.filter((candidate) => candidate.duplicate).length} may already be in
                Tracker
              </p>
            </div>
            <p className="mt-5 text-sm text-[#806d51]">Nothing has been added yet.</p>
            <button
              onClick={() => setStage("review")}
              className={`${BUTTON} mt-6 w-full bg-[#6b3817] text-white`}
            >
              <Eye className="h-5 w-5" />
              Check records
            </button>
          </>
        )}
        {stage === "review" && (
          <>
            <h2 className="text-3xl font-bold text-[#6b3817]">Check records</h2>
            {ready.length > 0 && (
              <button
                onClick={() =>
                  setCandidates((current) =>
                    current.map((candidate) =>
                      candidate.state === "ready" && !candidate.duplicate
                        ? { ...candidate, checked: true }
                        : candidate,
                    ),
                  )
                }
                className={`${BUTTON} mt-4 w-full border border-[#3c8d67] text-[#276749]`}
              >
                <CircleCheck className="h-5 w-5" />
                Mark all as correct
              </button>
            )}
            <div className="mt-4 space-y-4">
              {candidates
                .filter((candidate) => !candidate.skipped)
                .map((candidate) => (
                  <article
                    key={candidate.id}
                    className="rounded-2xl border border-[#e2d4c0] bg-[#fffaf0] p-4"
                  >
                    <div className="flex gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#f4ead8]">
                        {candidate.kind === "infusion" ? (
                          <Syringe className="h-5 w-5" />
                        ) : (
                          <Droplet className="h-5 w-5" />
                        )}
                      </span>
                      <div>
                        <h3 className="font-bold">
                          {candidate.kind === "infusion" ? "Factor infusion" : "Bleed"}
                        </h3>
                        <p className="text-sm text-[#806d51]">
                          {candidate.occurred_on ?? "Date needs checking"}
                          {candidate.occurred_at ? ` · ${candidate.occurred_at}` : ""}
                        </p>
                        <p className="mt-1 text-sm">
                          {candidate.kind === "bleed"
                            ? (candidate.bleed_location ?? "Where was the bleed?")
                            : `${candidate.product ? `${candidate.product} · ` : ""}${candidate.dose_iu ? `${candidate.dose_iu.toLocaleString()} IU` : candidate.vials ? `${candidate.vials} vials` : "Dose needs checking"}`}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-[#806d51]">Source: {candidate.source}</p>
                    {candidate.duplicate && (
                      <div className="mt-3 rounded-xl bg-[#f0ebe1] p-3 text-sm">
                        <Copy className="mr-1 inline h-4 w-4" />
                        This may already be in Tracker{" "}
                        <button
                          onClick={() => update(candidate.id, { duplicate: false })}
                          className="ml-2 font-bold underline"
                        >
                          Add imported record too
                        </button>
                        <button
                          onClick={() => update(candidate.id, { skipped: true })}
                          className="ml-3 font-bold underline"
                        >
                          Keep existing
                        </button>
                      </div>
                    )}
                    <p className="mt-3 text-sm font-semibold">
                      {candidate.checked ? (
                        <>
                          <CircleCheck className="mr-1 inline h-4 w-4 text-[#3c8d67]" />
                          {candidate.state === "ready" ? "Checked" : "Edited by you"}
                        </>
                      ) : candidate.state === "ready" ? (
                        <>
                          <CircleCheck className="mr-1 inline h-4 w-4 text-[#3c8d67]" />
                          Looks ready
                        </>
                      ) : (
                        <>
                          <CircleHelp className="mr-1 inline h-4 w-4 text-[#97720b]" />
                          Please check this
                        </>
                      )}
                    </p>
                    <div className="mt-3 grid gap-2">
                      <button
                        onClick={() => update(candidate.id, { checked: true })}
                        className={`${BUTTON} border border-[#3c8d67] text-[#276749]`}
                      >
                        <CircleCheck className="h-5 w-5" />
                        Looks correct
                      </button>
                      <button
                        onClick={() => setEditing(candidate.id)}
                        className={`${BUTTON} border border-[#d9cbb6]`}
                      >
                        <Pencil className="h-5 w-5" />
                        Fix details
                      </button>
                      <button
                        onClick={() => setRereading(candidate.id)}
                        className={`${BUTTON} border border-[#d9cbb6]`}
                      >
                        <RefreshCw className="h-5 w-5" />
                        Read again
                      </button>
                    </div>
                  </article>
                ))}
            </div>
            <button
              disabled={needsHelp.some((candidate) => !candidate.checked)}
              onClick={() => setStage("confirm")}
              className={`${BUTTON} mt-6 w-full bg-[#6b3817] text-white disabled:cursor-not-allowed disabled:opacity-50`}
            >
              Review selected records
            </button>
          </>
        )}
        {stage === "confirm" && (
          <>
            <h2 className="text-3xl font-bold text-[#6b3817]">Ready to add</h2>
            <div className="mt-5 space-y-3 text-sm">
              <p>
                <CircleCheck className="mr-2 inline h-5 w-5 text-[#3c8d67]" />
                {checked.length} checked records
              </p>
              <p>
                <MinusCircle className="mr-2 inline h-5 w-5" />
                {candidates.filter((candidate) => candidate.skipped).length} skipped
              </p>
              <p>
                <CircleHelp className="mr-2 inline h-5 w-5 text-[#97720b]" />
                {needsHelp.filter((candidate) => !candidate.checked).length} still need review
              </p>
            </div>
            <p className="mt-5 text-sm text-[#806d51]">
              Please make sure these match your original records.
            </p>
            <button
              disabled={!checked.length || needsHelp.some((candidate) => !candidate.checked)}
              onClick={() => void persist()}
              className={`${BUTTON} mt-6 w-full bg-[#6b3817] text-white disabled:opacity-50`}
            >
              <FileCheck className="h-5 w-5" />
              Add {checked.length} records to Tracker
            </button>
            <button
              onClick={() => setStage("review")}
              className={`${BUTTON} mt-3 w-full border border-[#d9cbb6]`}
            >
              Go back and check
            </button>
          </>
        )}
        {stage === "success" && (
          <div className="pt-20 text-center">
            <CircleCheck className="mx-auto h-14 w-14 text-[#3c8d67]" />
            <h2 className="mt-5 text-3xl font-bold text-[#6b3817]">Records added</h2>
            <p className="mt-2 text-sm text-[#806d51]">
              {saved} {saved === 1 ? "record was" : "records were"} added to your Tracker.
            </p>
            <button onClick={onClose} className={`${BUTTON} mt-7 w-full bg-[#6b3817] text-white`}>
              <CalendarDays className="h-5 w-5" />
              View Tracker
            </button>
          </div>
        )}
        {editor && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#443229]/30 p-4 pt-12">
            <section className="mx-auto max-w-md rounded-3xl bg-[#fffaf0] p-5">
              <h2 className="text-2xl font-bold">Fix details</h2>
              <label className="mt-4 block text-sm font-semibold">
                Date
                <input
                  className={FIELD}
                  type="date"
                  value={editor.occurred_on ?? ""}
                  onChange={(event) =>
                    update(editor.id, { occurred_on: event.target.value || null })
                  }
                />
              </label>
              {editor.kind === "infusion" ? (
                <>
                  <label className="mt-4 block text-sm font-semibold">
                    Product
                    <input
                      className={FIELD}
                      value={editor.product ?? ""}
                      onChange={(event) =>
                        update(editor.id, { product: event.target.value || null })
                      }
                    />
                  </label>
                  <label className="mt-4 block text-sm font-semibold">
                    Number of vials
                    <input
                      className={FIELD}
                      type="number"
                      min="1"
                      value={editor.vials ?? ""}
                      onChange={(event) =>
                        update(editor.id, { vials: Number(event.target.value) || null })
                      }
                    />
                  </label>
                </>
              ) : (
                <label className="mt-4 block text-sm font-semibold">
                  Where was the bleed?
                  <input
                    className={FIELD}
                    value={editor.bleed_location ?? ""}
                    onChange={(event) =>
                      update(editor.id, { bleed_location: event.target.value || null })
                    }
                  />
                </label>
              )}
              <button
                onClick={() => {
                  const valid =
                    editor.kind === "infusion" &&
                    Boolean(editor.occurred_on && editor.vials && editor.vials > 0);
                  update(editor.id, { state: valid ? "ready" : "needs_review", checked: valid });
                  setEditing(null);
                }}
                className={`${BUTTON} mt-6 w-full bg-[#6b3817] text-white`}
              >
                Save changes
              </button>
            </section>
          </div>
        )}
        {rereading && (
          <div className="fixed inset-0 z-[110] overflow-y-auto bg-[#443229]/30 p-4 pt-12">
            <section className="mx-auto max-w-md rounded-3xl bg-[#fffaf0] p-5">
              <h2 className="text-2xl font-bold">Help us read this correctly</h2>
              <p className="mt-2 text-sm text-[#806d51]">What should we know?</p>
              {(
                [
                  ["day_month_year", "Dates are day / month / year"],
                  ["number_is_vials", "This number means number of vials"],
                  ["rows_are_infusions", "These rows are factor infusions"],
                  ["rows_are_bleeds", "These rows are bleeds"],
                ] as [ImportRereadHint, string][]
              ).map(([hint, label]) => (
                <label
                  key={hint}
                  className="mt-3 flex min-h-11 items-center gap-3 rounded-xl border border-[#d9cbb6] p-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={hints.includes(hint)}
                    onChange={() =>
                      setHints((current) =>
                        current.includes(hint)
                          ? current.filter((item) => item !== hint)
                          : [...current, hint],
                      )
                    }
                  />
                  {hint === "day_month_year" ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : hint === "number_is_vials" ? (
                    <Package className="h-4 w-4" />
                  ) : hint === "rows_are_infusions" ? (
                    <Syringe className="h-4 w-4" />
                  ) : (
                    <Droplet className="h-4 w-4" />
                  )}
                  {label}
                </label>
              ))}
              <label className="mt-4 block text-sm font-semibold">
                Something else
                <textarea
                  className={`${FIELD} min-h-20 py-2`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              <button
                onClick={() => void reread()}
                className={`${BUTTON} mt-5 w-full bg-[#6b3817] text-white`}
              >
                <RefreshCw className="h-5 w-5" />
                Read again
              </button>
              <button onClick={() => setRereading(null)} className={`${BUTTON} mt-2 w-full`}>
                Cancel
              </button>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
