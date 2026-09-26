import { jsPDF } from "jspdf";

import type { Profile } from "@/lib/api";
import {
  bloodTypeLabel,
  diagnosisLabel,
  drugAllergiesLabel,
  drugAllergyNote,
  formatDob,
  medicationSummary,
  severityOf,
} from "@/lib/medical-id";
import { doseWordsFor, type Language, type Translate } from "@/lib/medical-id-translation";

/**
 * The Medical ID as a one-page A4 PDF, drawn as text rather than as a
 * screenshot of the card: a responder may be reading this printed out, so it
 * has to stay sharp and selectable at any size.
 *
 * The section order matches the card on screen, and every value comes from the
 * same helpers and the same translation, so the two can never disagree.
 */

type RGB = [number, number, number];
type Row = { label: string; value: string };
type Section = { title: string; rows: Row[]; accent?: RGB };
type TextStyle = { size: number; bold?: boolean; color: RGB; charSpace?: number };

const BLUE: RGB = [37, 99, 235];
const RED: RGB = [220, 38, 38];
const GREY: RGB = [148, 163, 184];
const INK: RGB = [17, 24, 39];
const LINE: RGB = [226, 232, 240];

const MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4 portrait, in points.
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function sectionsFor(profile: Profile, t: Translate, language: Language): Section[] {
  const clinical = profile.clinical_profile ?? null;
  const contact = clinical?.emergency_contact ?? null;
  const doctor = clinical?.primary_doctor ?? null;
  const notRecorded = t("Not recorded");
  // As on the card, a machine-translated allergy note keeps its original.
  const allergyNote = drugAllergyNote(clinical);
  const allergyTranslated = allergyNote !== null && t(allergyNote) !== allergyNote;

  const sections: Section[] = [
    {
      title: t("Patient Details"),
      rows: [
        { label: t("Name"), value: profile.name },
        { label: t("Blood Type"), value: t(bloodTypeLabel(clinical)) },
        {
          label: t("Date of Birth"),
          value: t(formatDob(clinical?.date_of_birth, language.locale)),
        },
      ],
    },
    {
      title: t("Medical Information"),
      rows: [
        { label: t("Diagnosis"), value: t(diagnosisLabel(profile)) },
        { label: t("Severity"), value: t(severityOf(clinical)) },
        {
          label: t("Current Medication"),
          value: t(medicationSummary(clinical, doseWordsFor(language.code))),
        },
      ],
    },
    {
      title: t("Drug Allergies"),
      rows: [
        { label: t("Allergies"), value: t(drugAllergiesLabel(clinical)) },
        ...(allergyTranslated ? [{ label: t("Original (English)"), value: allergyNote }] : []),
      ],
    },
    {
      title: t("Emergency Contact"),
      accent: RED,
      rows: contact
        ? [
            { label: t("Name"), value: contact.name },
            ...(contact.relationship
              ? [{ label: t("Relationship"), value: t(contact.relationship) }]
              : []),
            { label: t("Phone"), value: contact.phone },
          ]
        : [{ label: t("Contact"), value: notRecorded }],
    },
    {
      title: t("Primary Doctor (Organisation)"),
      rows: doctor
        ? [
            { label: t("Name"), value: doctor.name },
            ...(doctor.organisation
              ? [{ label: t("Organisation"), value: doctor.organisation }]
              : []),
            ...(doctor.phone ? [{ label: t("Phone"), value: doctor.phone }] : []),
          ]
        : [{ label: t("Doctor"), value: notRecorded }],
    },
  ];

  return sections;
}

/** A filename a phone's Files app can tell apart from the next person's, and the next language's. */
function fileNameFor(profile: Profile, language: Language): string {
  const slug = profile.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const suffix = language.code === "en" ? "" : `-${language.code}`;
  return `medical-id-${slug || "profile"}${suffix}.pdf`;
}

// jsPDF's built-in Helvetica covers WinAnsi — Latin-1 plus a few typographic
// marks — and nothing else. English and Malay fit; Chinese, Thai, Hindi and
// the rest would print as blanks or mojibake.
const WIN_ANSI = /^[\x20-\x7e\xa0-\xff•–—‘’“”…€]*$/;

// Text outside WinAnsi is drawn by the browser, which has the fonts and does
// the shaping (Thai vowel marks, Devanagari conjuncts) that jsPDF cannot, and
// placed as an image. This many canvas pixels per point keeps it sharp printed.
const RASTER_SCALE = 4;
const RASTER_FONT = 'system-ui, -apple-system, "Segoe UI", "Noto Sans", sans-serif';
// Room above and below the baseline, as a share of the font size: Thai stacks
// tone marks over vowels, and descenders need the bottom.
const RASTER_ASCENT = 1.25;
const RASTER_DESCENT = 0.45;

let measuringContext: CanvasRenderingContext2D | null = null;

function canvasFont(style: TextStyle): string {
  return `${style.bold ? 700 : 400} ${style.size * RASTER_SCALE}px ${RASTER_FONT}`;
}

/** Width in points, as the browser will draw it. */
function rasterWidth(text: string, style: TextStyle): number {
  measuringContext ??= document.createElement("canvas").getContext("2d");
  if (!measuringContext) return text.length * style.size;
  measuringContext.font = canvasFont(style);
  return measuringContext.measureText(text).width / RASTER_SCALE;
}

function setPdfFont(doc: jsPDF, style: TextStyle) {
  doc.setFont("helvetica", style.bold ? "bold" : "normal");
  doc.setFontSize(style.size);
  doc.setTextColor(...style.color);
}

/** One line of text with its baseline at `y`, whatever script it is in. */
function drawText(doc: jsPDF, text: string, x: number, y: number, style: TextStyle) {
  if (WIN_ANSI.test(text)) {
    setPdfFont(doc, style);
    doc.text(text, x, y, style.charSpace ? { charSpace: style.charSpace } : undefined);
    return;
  }

  const width = Math.ceil(rasterWidth(text, style)) + 2;
  const height = style.size * (RASTER_ASCENT + RASTER_DESCENT);
  const canvas = document.createElement("canvas");
  canvas.width = width * RASTER_SCALE;
  canvas.height = Math.ceil(height * RASTER_SCALE);
  const context = canvas.getContext("2d");
  if (!context) return;
  context.font = canvasFont(style);
  context.fillStyle = `rgb(${style.color.join(",")})`;
  context.textBaseline = "alphabetic";
  context.fillText(text, 0, style.size * RASTER_ASCENT * RASTER_SCALE);
  doc.addImage(
    canvas,
    "PNG",
    x,
    y - style.size * RASTER_ASCENT,
    width,
    height,
    undefined,
    // Uncompressed, a page of text images runs to megabytes.
    "FAST",
  );
}

/**
 * `text` broken into lines no wider than `width`. Chinese, Japanese and Thai
 * have no spaces between words, so the browser's word segmenter finds the
 * break points rather than a split on spaces.
 */
function wrapText(
  doc: jsPDF,
  text: string,
  style: TextStyle,
  width: number,
  locale: string,
): string[] {
  if (WIN_ANSI.test(text)) {
    setPdfFont(doc, style);
    return doc.splitTextToSize(text, width) as string[];
  }

  const segments =
    typeof Intl.Segmenter === "function"
      ? Array.from(
          new Intl.Segmenter(locale, { granularity: "word" }).segment(text),
          (part) => part.segment,
        )
      : text.split(/(\s+)/);

  const lines: string[] = [];
  let line = "";
  for (const segment of segments) {
    const next = line + segment;
    if (line.trim() && rasterWidth(next, style) > width) {
      lines.push(line.trimEnd());
      line = segment.trimStart();
    } else {
      line = next;
    }
  }
  if (line.trim()) lines.push(line.trimEnd());
  return lines.length ? lines : [""];
}

/**
 * Start a new page when the next block would not fit.
 *
 * A fully filled ID is one page, but a long allergy note or a second
 * medication can push past the bottom, and a value half off the page is worse
 * than a second sheet.
 */
function breakIfNeeded(doc: jsPDF, y: number, needed: number): number {
  if (y + needed <= PAGE_HEIGHT - MARGIN) return y;
  doc.addPage();
  return MARGIN;
}

export function downloadMedicalIdPdf(
  profile: Profile,
  { t, language }: { t: Translate; language: Language },
): void {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const { locale } = language;
  const upper = (text: string) => text.toLocaleUpperCase(locale);
  let y = MARGIN;

  drawText(doc, upper(t("Medical ID")), MARGIN, y, {
    size: 9,
    bold: true,
    color: BLUE,
    charSpace: 1.5,
  });

  y += 30;
  const headline: TextStyle = { size: 28, bold: true, color: RED };
  for (const line of wrapText(doc, t(diagnosisLabel(profile)), headline, CONTENT_WIDTH, locale)) {
    drawText(doc, line, MARGIN, y, headline);
    y += 32;
  }

  y -= 14;
  drawText(doc, upper(`${t("Bleeding Disorder")}  •  ${t("Handle with Care")}`), MARGIN, y, {
    size: 9,
    bold: true,
    color: GREY,
    charSpace: 0.8,
  });

  y += 22;

  for (const section of sectionsFor(profile, t, language)) {
    y = breakIfNeeded(doc, y, 90);

    doc.setDrawColor(...LINE);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 22;

    drawText(doc, upper(section.title), MARGIN, y, {
      size: 9,
      bold: true,
      color: section.accent ?? BLUE,
      charSpace: 0.8,
    });
    y += 18;

    for (const row of section.rows) {
      y = breakIfNeeded(doc, y, 40);

      drawText(doc, row.label, MARGIN, y, { size: 8.5, color: GREY });
      y += 13;

      // Long values (a medication list, an allergy note) wrap rather than run
      // off the page.
      const value: TextStyle = { size: 11, bold: true, color: INK };
      for (const line of wrapText(doc, row.value, value, CONTENT_WIDTH, locale)) {
        drawText(doc, line, MARGIN, y, value);
        y += 14;
      }
      y += 6;
    }
  }

  const footer: TextStyle = { size: 8, color: GREY };
  const generated = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
  y = breakIfNeeded(doc, y + 6, 24);
  drawText(doc, `${t("Generated on")} ${generated}`, MARGIN, y, footer);
  // A responder should know the wording is a machine's, not a clinician's.
  if (language.code !== "en") {
    drawText(doc, t("Machine-translated from English"), MARGIN, y + 12, footer);
  }

  doc.save(fileNameFor(profile, language));
}
