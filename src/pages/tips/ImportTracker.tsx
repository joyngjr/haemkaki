import { type KeyboardEvent, type ReactNode, useEffect, useId, useState } from "react";

import { BackLink } from "@/components/layout/BackLink";
import { OutlineButton } from "@/components/ui/Button";
import { Callout, NoteIcon } from "@/components/ui/Callout";
import { Card, CardTitle } from "@/components/ui/Card";
import { MCP_URL } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useProfiles } from "@/state/profile-context";

const CLAUDE_CODE_COMMAND = `claude mcp add --transport http haemkaki ${MCP_URL}`;
const GEMINI_INSTALL_COMMAND = "npm install -g @google/gemini-cli";
const GEMINI_ADD_COMMAND = `gemini mcp add --transport http haemkaki ${MCP_URL}`;

/** A dev address: fine for Claude Code on this machine, unreachable from claude.ai or ChatGPT. */
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

const ASSISTANTS = [
  { id: "claude", label: "Claude" },
  { id: "chatgpt", label: "ChatGPT" },
  { id: "gemini", label: "Gemini" },
] as const;

type Assistant = (typeof ASSISTANTS)[number]["id"];

function ClaudeGuide({ ask, target }: { ask: string; target: string }) {
  return (
    <>
      <p className="text-sm text-ink-muted">claude.ai, or the Claude desktop app.</p>
      <ol className="mt-3 flex flex-col gap-2.5">
        <Step n={1}>
          Open <b>Customize</b> → <b>Connectors</b>, choose <b>Add custom connector</b>, paste the
          address above and name it HaemKaki. No sign-in is needed.
        </Step>
        <Step n={2}>
          In a new chat tap <b>+</b>, then <b>Connectors</b>, and switch HaemKaki on.
        </Step>
        <Step n={3}>
          Attach your file or paste your records, and say: <i>&ldquo;{ask}&rdquo;</i>
        </Step>
        <Step n={4}>
          Check the preview. The assistant writes only after you confirm, and can undo the import if
          something is off.
        </Step>
      </ol>
      <p className="mt-5 text-sm font-semibold">Using Claude Code instead?</p>
      <CopyRow label="Command" value={CLAUDE_CODE_COMMAND} />
      <p className="mt-3 text-sm text-ink-muted">Then ask it to import your file into {target}.</p>
    </>
  );
}

function ChatGptGuide({ ask }: { ask: string }) {
  return (
    <>
      <p className="text-sm text-ink-muted">chatgpt.com on a Plus, Pro, Business or Edu plan.</p>
      <ol className="mt-3 flex flex-col gap-2.5">
        <Step n={1}>
          Open <b>Settings</b> → <b>Apps &amp; Connectors</b> → <b>Advanced settings</b> and turn on{" "}
          <b>Developer mode</b>.
        </Step>
        <Step n={2}>
          Back in <b>Apps &amp; Connectors</b>, choose <b>Create</b>. Name it HaemKaki, paste the
          address above, set authentication to <b>No authentication</b>, and tick that you trust it.
        </Step>
        <Step n={3}>
          In a new chat tap <b>+</b>, then <b>Developer mode</b>, and switch HaemKaki on.
        </Step>
        <Step n={4}>
          Attach your file or paste your records, and say: <i>&ldquo;{ask}&rdquo;</i>
        </Step>
        <Step n={5}>
          Check the preview. ChatGPT asks you to approve each change before it writes, and can undo
          the import if something is off.
        </Step>
      </ol>
    </>
  );
}

function GeminiGuide({ ask }: { ask: string }) {
  return (
    <>
      <p className="text-sm text-ink-muted">
        Gemini CLI on a computer, free with a Google account.
      </p>
      <ol className="mt-3 flex flex-col gap-2.5">
        <Step n={1}>Install it once, if you have not:</Step>
      </ol>
      <CopyRow label="Install" value={GEMINI_INSTALL_COMMAND} />
      <ol start={2} className="mt-4 flex flex-col gap-2.5">
        <Step n={2}>Add HaemKaki:</Step>
      </ol>
      <CopyRow label="Command" value={GEMINI_ADD_COMMAND} />
      <ol start={3} className="mt-4 flex flex-col gap-2.5">
        <Step n={3}>
          Run <code className="font-mono">gemini</code> in the folder with your file, and say:{" "}
          <i>&ldquo;{ask}&rdquo;</i> Name the file with <code className="font-mono">@</code>, like{" "}
          <code className="font-mono">@doses.csv</code>.
        </Step>
        <Step n={4}>
          Check the preview. Gemini asks before each change it writes, and can undo the import if
          something is off.
        </Step>
      </ol>
    </>
  );
}

/**
 * One guide at a time: a user connects one assistant, so the others are noise.
 * A WAI-ARIA tablist, with arrow keys moving between tabs.
 */
function AssistantGuides({ ask, target }: { ask: string; target: string }) {
  const [active, setActive] = useState<Assistant>("claude");
  const baseId = useId();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = ASSISTANTS.findIndex((a) => a.id === active);
    const next = ASSISTANTS[(index + step + ASSISTANTS.length) % ASSISTANTS.length].id;
    setActive(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  }

  return (
    <Card>
      <CardTitle>Connect your assistant</CardTitle>
      <div
        role="tablist"
        aria-label="Assistant"
        onKeyDown={onKeyDown}
        className="mt-3 flex gap-1 rounded-control bg-soft p-1"
      >
        {ASSISTANTS.map(({ id, label }) => {
          const selected = id === active;
          return (
            <button
              key={id}
              id={`${baseId}-tab-${id}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(id)}
              className={cn(
                "min-h-11 flex-1 rounded-control px-3 text-sm transition",
                selected ? "bg-white font-semibold text-ink shadow-sm" : "text-ink-muted",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="mt-4"
      >
        {active === "claude" ? (
          <ClaudeGuide ask={ask} target={target} />
        ) : active === "chatgpt" ? (
          <ChatGptGuide ask={ask} />
        ) : (
          <GeminiGuide ask={ask} />
        )}
      </div>
    </Card>
  );
}

/**
 * How to connect an assistant to this server's MCP endpoint and import
 * existing records through it. The app never parses a file itself: the assistant
 * reads it, previews what it would add, and writes only when the user says so.
 */
export function ImportTracker() {
  const { activeProfile, status } = useProfiles();
  const target = activeProfile
    ? `${activeProfile.name} (profile ${activeProfile.id})`
    : "your profile";
  const ask = activeProfile
    ? `Import this into HaemKaki for ${activeProfile.name}, profile ${activeProfile.id}. Preview first.`
    : "Import this into HaemKaki. Preview first.";

  return (
    <div className="px-4 pt-8 pb-8">
      <BackLink to="/tips" />
      <h1 className="mt-4 text-2xl font-semibold tracking-[-0.01em]">
        Import from another tracker
      </h1>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        Bring the doses and refills you logged elsewhere into HaemKaki with an AI assistant. It
        reads whatever records you already have, such as a spreadsheet, another app&rsquo;s export,
        typed notes or a photo of your logbook. It shows you what it would add, and writes only when
        you say so.
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
              This is a local address. Claude.ai and ChatGPT cannot reach it; use Claude Code or
              Gemini CLI on this computer, or the deployed app&rsquo;s address.
            </Callout>
          ) : null}
        </Card>

        <AssistantGuides ask={ask} target={target} />

        <Callout tone="muted" icon={<NoteIcon />}>
          Refills, doses and treated bleeds come across. A dose you took late comes across as the
          day you took it. Amounts are counted in vials, so the assistant will ask how many IU a
          vial holds if your records are in IU. Imported entries appear the next time the Tracker
          opens. There is no sign-in: anyone with this address can read and change every profile
          here, so only connect assistants you trust.
        </Callout>
      </div>
    </div>
  );
}
