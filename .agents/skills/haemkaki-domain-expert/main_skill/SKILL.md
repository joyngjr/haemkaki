---
name: haemkaki-domain-expert
description: |
  Medical knowledge research assistant for the HaemKaki haemophilia factor-tracking app.
  Use this skill whenever a developer asks for medical information, clinical terminology,
  treatment protocols, or domain knowledge relevant to haemophilia care — whether the source
  is files already in the repository or external websites (scraped via Firecrawl).

  Trigger immediately when the developer says things like:
  - "research haemophilia X for me"
  - "what are the dosing guidelines for factor VIII?"
  - "summarise prophylaxis regimens from this URL"
  - "read the haemophilia docs in the repo and summarise"
  - "gather medical info about bleeding disorders / factor products / inhibitors"
  - "pull info from [URL]" for any haemophilia / coagulation / rare-bleeding-disorder topic
  - "give me a .csv / .md of haemophilia facts"

  DO NOT trigger for: general coding tasks, API schema changes, Tailwind styling, or
  deployment questions unrelated to medical content.
---

# HaemKaki Domain Expert

A research assistant that collects medical information from **repository files** and/or **the
web via Firecrawl**, then writes a complete, structured summary file for the developer to
review and validate before that knowledge is used in the codebase.

---

## 0 — Environment setup

The Firecrawl API key and other environment variables are stored in:

```
haemkaki/.env
```

Before making any Firecrawl calls, load the key:

```bash
# Read the key from .env (strip surrounding quotes if present)
export FIRECRAWL_API_KEY=$(grep '^FIRECRAWL_API_KEY=' haemkaki/.env | cut -d'=' -f2- | tr -d '"'"'"')
```

If the variable is already set in the shell environment, use it directly. If `.env` is missing
or the key is blank, stop and tell the developer.

For the full Firecrawl API reference, read:

```
haemkaki/.agents/skills/haemkaki-domain-expert/firecrawl_skill/SKILL.md
```

Read this file before making any API calls so you use the correct endpoint signatures,
response shapes, and error handling patterns.

---

## 1 — Understand the request

Before doing anything, confirm:

1. **What topic?** (e.g. "factor VIII prophylaxis dosing", "half-life of extended-release
   factor products", "inhibitor development in haemophilia A")
2. **Which sources?**
   - _Repo files_ — search `haemkaki/.agents/skills/haemkaki-domain-expert/references/` for existing medical documents.
   - _Web_ — use Firecrawl to find and scrape authoritative sources autonomously.
   - _Both_ — combine both (default when neither is specified).
3. **Output format**: `.md` (default) or `.csv` — take this from the developer's prompt.
   If not specified, use `.md`.
4. **Scope / depth** — quick overview vs. deep comprehensive reference.

If the topic is unclear, ask one targeted clarifying question before proceeding. Otherwise,
proceed autonomously.

---

## 2 — Source 1: Repository files

Scan `haemkaki/.agents/skills/haemkaki-domain-expert/references/` for existing medical documentation:

```bash
# Find all markdown and text files under references/
find haemkaki/.agents/skills/haemkaki-domain-expert/references -type f \( -name "*.md" -o -name "*.txt" -o -name "*.csv" \)
```

Then grep for topic keywords (e.g. `factor VIII`, `prophylaxis`, `haemophilia`, `inhibitor`,
`FVIII`, `FIX`, `vials`, `IU/kg`) across those files.

Read every matching file **in full** — do not cherry-pick sentences. Extract complete sections
so nothing clinical is lost or distorted.

---

## 3 — Source 2: Web via Firecrawl

Read `haemkaki/.agents/skills/haemkaki-domain-expert/firecrawl_skill/SKILL.md` for the full API reference before calling any
endpoint. The sections below are a working summary.

### 3a — Searching for sources (no URL provided)

When the developer has not given URLs, search autonomously. Prefer authoritative sources
in this order:

1. **Clinical guidelines**: WFH (World Federation of Hemophilia), ISTH, UKHCDO, NHF
2. **Product prescribing information**: EMA, FDA drug labels
3. **Peer-reviewed journals**: PubMed-indexed content
4. **Patient organisations**: WFH, Haemophilia Society

```bash
curl -s -X POST https://api.firecrawl.dev/v1/search \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "<specific medical topic query>",
    "limit": 5,
    "scrapeOptions": { "formats": ["markdown"], "onlyMainContent": true }
  }'
```

The response has a `data` array; each item contains `url`, `title`, and `markdown`. Scrape
the top 3–5 most relevant results. Do not wait for the developer to confirm the URLs —
proceed autonomously and include all source URLs in the output document.

### 3b — Scraping a known URL

When the developer provides a specific URL:

```bash
curl -s -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<URL>",
    "formats": ["markdown"],
    "onlyMainContent": true
  }'
```

The response has a `data.markdown` field. Read it in full.

### 3c — Multi-page crawl (optional)

Only use when the developer explicitly asks for a whole site or a multi-chapter document:

```bash
# Start crawl
curl -s -X POST https://api.firecrawl.dev/v1/crawl \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "<root URL>",
    "limit": 10,
    "scrapeOptions": { "formats": ["markdown"], "onlyMainContent": true }
  }'

# Poll until complete (status field = "completed")
# GET https://api.firecrawl.dev/v1/crawl/{id}
```

### Source attribution rule (mandatory)

Every fact, figure, or claim taken from a web source **must** be tagged with its origin URL.
In `.md` output use inline citation markers like `[WFH 2020]` with a full reference list at
the end. In `.csv` output include a dedicated `source_url` column on every row. No fact may
appear without its source.

---

## 4 — Synthesise the summary

Write a **comprehensive, structured summary file** to:

```
haemkaki/.agents/skills/haemkaki-domain-expert/medical_info_summary/<kebab-case-topic>.<md|csv>
```

Create the folder if it does not exist.

---

### 4a — Markdown output format (`.md`)

Use this template exactly:

```markdown
# Medical Summary: <Topic>

> **Status:** Pending developer review
> **Generated:** <ISO 8601 date>
> **Sources consulted:**
>
> - [Repo] `haemkaki/.agents/skills/haemkaki-domain-expert/<source-folder>/<path>`
> - [Web] <URL> — <site name / document title> [<citation key>]

---

## Overview

One short paragraph: what this topic is and why it matters to HaemKaki.

---

## Key Definitions

- **<Term>**: <definition> [<citation key if from web>]

---

## Clinical Facts

Exhaustive bullet list — one fact per bullet, nothing omitted for brevity.

- Quantitative values (doses, half-lives, frequencies, thresholds) with units [source]
- Ranges and patient-population variations (paediatric vs adult, severity) [source]
- Named clinical entities, drug INN and brand names [source]
- Staging / classification systems with criteria [source]
- Monitoring parameters and target levels [source]
- ⚠️ CONFLICT: Source A says X; Source B says Y — developer must resolve

---

## Treatment Protocols / Guidelines

### <Guideline name, issuing body, year>

- **Population**: <who this applies to>
- **Regimen**: <dose in IU/kg, frequency, route> [source]
- **Targets**: trough / peak levels [source]
- **Adjustments**: inhibitors, surgery, break-through bleeds [source]

---

## Terminology Relevant to HaemKaki

- **<app enum or field name>**: clinical meaning [source if web]

---

## Full References

1. [<citation key>] <Author/Organisation>. _<Title>_. <Year>. <URL>
2. …

---

> **Developer action required:** Review every bullet for clinical accuracy before this
> information influences any code, copy, or user-facing content in the app.
```

---

### 4b — CSV output format (`.csv`)

When the developer requests `.csv`, write a flat table where each row is one clinical fact.
Required columns:

| column          | content                                                                            |
| --------------- | ---------------------------------------------------------------------------------- |
| `category`      | e.g. `definition`, `dosing`, `half_life`, `monitoring`, `guideline`, `terminology` |
| `topic`         | sub-topic label, e.g. `"Factor VIII prophylaxis"`                                  |
| `fact`          | the verbatim or closely paraphrased clinical statement                             |
| `units`         | unit of measure if applicable, else blank                                          |
| `population`    | patient group the fact applies to, e.g. `"adults"`, `"paediatric"`, `"all"`        |
| `source_url`    | full URL of the web page, or `repo:<relative path>` for repo files                 |
| `source_label`  | short human-readable label, e.g. `"WFH 2020 Guidelines"`                           |
| `conflict_note` | leave blank unless this fact conflicts with another row; if so, note the conflict  |

Every row must have a non-empty `source_url`. No row may be left without attribution.

---

## 5 — Quality rules

- **Complete**: Include every fact found; do not omit anything for brevity.
- **Verbatim for numbers**: If a guideline says "20–40 IU/kg every 48 hours", reproduce that
  exactly — no rounding or generalisation.
- **Flag conflicts**: When two sources disagree, include both and mark with ⚠️ in `.md` or
  `conflict_note` in `.csv`.
- **No editorial opinion**: Present what sources say. Do not recommend one treatment over
  another.
- **Mandatory attribution**: Every web-sourced fact carries its URL. No exceptions.

---

## 6 — Tell the developer

After writing the file, report:

1. Full path of the summary file.
2. Number of sources read (repo files + web pages).
3. Any scrape failures or gaps (topics sources didn't cover).
4. Count of ⚠️ conflicts found.
5. Prompt the developer to review for clinical accuracy.

Example:

> "Summary written to `haemkaki/.agents/skills/haemkaki-domain-expert/medical_info_summary/factor-viii-prophylaxis.md`.
> Read 1 repo file and scraped 4 web sources (WFH 2020, UKHCDO 2023, 2 FDA labels).
> Found 1 ⚠️ conflict in trough target levels — see the _Treatment Protocols_ section.
> Please confirm accuracy before using this in the app."

---

## Reference: HaemKaki data model ↔ clinical concepts

| App field / enum value       | Clinical meaning                                                          |
| ---------------------------- | ------------------------------------------------------------------------- |
| `DoseState = "covered"`      | Factor level in prophylaxis target range (typically ≥1–3 IU/dL trough)    |
| `DoseState = "low"`          | Level declining, approaching trough — infusion due soon                   |
| `DoseState = "veryLow"`      | At or below trough — patient may be at bleeding risk                      |
| `StockState = "wellStocked"` | ≥2 weeks' supply of vials at home                                         |
| `StockState = "moderate"`    | ~1 week's supply remaining                                                |
| `StockState = "low"`         | <3 days' supply — reorder urgently                                        |
| `FactorType = "VIII"`        | Haemophilia A (FVIII deficiency)                                          |
| `FactorType = "IX"`          | Haemophilia B (FIX deficiency)                                            |
| `days_cover`                 | Estimated days until next infusion needed, given current stock & schedule |
| `vials_on_hand`              | Number of factor concentrate vials physically at home                     |

When you encounter clinical information that clarifies or extends any of these mappings,
add it to the _Terminology Relevant to HaemKaki_ section of your summary.
