import { type ReactNode, useEffect, useState } from "react";

import { BackLink } from "@/components/layout/BackLink";
import { OutlineButton } from "@/components/ui/Button";
import { Callout, NoteIcon } from "@/components/ui/Callout";
import { Card, CardTitle } from "@/components/ui/Card";
import { MCP_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http haemkakis ${MCP_URL}`;

/** A dev address: fine for Claude Code on this machine, unreachable from claude.ai. */
const IS_LOCAL = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(MCP_URL);

/** A value worth copying, with the button that copies it. */
function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  useEffect(() => {
    if (state === "idle") return;
    const timer = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(timer);
  }, [state]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      // No clipboard (an insecure origin, an old browser): the text is select-all.
      setState("failed");
    }
  }

  return (
    <div className="mt-3">
      <p className="text-[13px] text-ink-subtle">{label}</p>
      <code
        className={cn(
          "mt-1 block select-all break-all rounded-control bg-soft px-3 py-2.5 text-[14px] leading-relaxed",
          mono && "font-mono",
        )}
      >
        {value}
      </code>
      <OutlineButton onClick={copy} className="mt-2 w-full sm:w-auto" aria-live="polite">
        {state === "copied"
          ? "Copied"
          : state === "failed"
            ? "Long-press the text to copy"
            : `Copy ${label.toLowerCase()}`}
      </OutlineButton>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[13px] font-semibold text-slate-600"
        aria-hidden="true"
      >
        {n}
      </span>
      <span className="text-[14.5px] leading-snug">{children}</span>
    </li>
  );
}

/**
 * How to connect an assistant to this server's MCP endpoint and import a
 * spreadsheet through it. The app never parses a file itself: the assistant
 * reads it, previews what it would add, and writes only when the user says so.
 */
export function ImportTracker() {
  const { activeProfile, status } = useProfiles();
  const target = activeProfile
    ? `${activeProfile.name} (profile ${activeProfile.id})`
    : "your profile";
  const ask = activeProfile
    ? `Import this into HaemKakis for ${activeProfile.name}, profile ${activeProfile.id}. Preview first.`
    : "Import this into HaemKakis. Preview first.";

  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips" />
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.01em]">
        Import from another tracker
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        Bring the doses and refills you logged elsewhere into HaemKakis with an AI assistant. It
        reads your spreadsheet, shows you what it would add, and writes only when you say so.
      </p>

      <div className="mt-5 flex flex-col gap-4">
        <Card>
          <CardTitle>Your connector</CardTitle>
          <p className="mt-1.5 text-sm text-ink-muted">
            Give this address to the assistant so it can reach your tracker.
          </p>
          <CopyRow label="Address" value={MCP_URL} />
          {status === "loading" ? null : activeProfile ? (
            <CopyRow
              label="Profile"
              value={`${activeProfile.name} — profile id ${activeProfile.id}`}
              mono={false}
            />
          ) : (
            <Callout className="mt-3">Create a profile first. The import writes into it.</Callout>
          )}
          {IS_LOCAL ? (
            <Callout tone="muted" icon={<NoteIcon />} className="mt-3">
              This is a local address. Claude.ai cannot reach it; use Claude Code on this computer,
              or the deployed app&rsquo;s address.
            </Callout>
          ) : null}
        </Card>

        <Card>
          <CardTitle>In Claude</CardTitle>
          <p className="mt-1.5 text-sm text-ink-muted">claude.ai, or the Claude desktop app.</p>
          <ol className="mt-3 flex flex-col gap-2.5">
            <Step n={1}>
              Open <b>Customize</b> → <b>Connectors</b>, choose <b>Add custom connector</b>, paste
              the address above and name it HaemKakis. No sign-in is needed.
            </Step>
            <Step n={2}>
              In a new chat tap <b>+</b>, then <b>Connectors</b>, and switch HaemKakis on.
            </Step>
            <Step n={3}>
              Attach your spreadsheet or paste the rows, and say: <i>&ldquo;{ask}&rdquo;</i>
            </Step>
            <Step n={4}>
              Check the preview. The assistant writes only after you confirm, and can undo the
              import if something is off.
            </Step>
          </ol>
        </Card>

        <Card>
          <CardTitle>In Claude Code</CardTitle>
          <p className="mt-1.5 text-sm text-ink-muted">
            On the computer that runs it, add the server once:
          </p>
          <CopyRow label="Command" value={CLAUDE_CODE_COMMAND} />
          <p className="mt-3 text-sm text-ink-muted">
            Then ask it to import your file into {target}.
          </p>
        </Card>

        <Callout tone="muted" icon={<NoteIcon />}>
          Refills, doses, missed doses and treated bleeds come across. Amounts are counted in vials,
          so the assistant will ask how many IU a vial holds if your sheet is in IU. Imported
          entries appear the next time the Tracker opens. There is no sign-in: anyone with this
          address can read and change every profile here, so only connect assistants you trust.
        </Callout>
      </div>
    </div>
  );
}
