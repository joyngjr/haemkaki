import { jsPDF } from "jspdf";

import type { Profile } from "@/lib/api";
import {
  bloodTypeLabel,
  diagnosisLabel,
  drugAllergiesLabel,
  formatDob,
  medicationSummary,
  severityOf,
} from "@/lib/medical-id";

/**
 * The Medical ID as a one-page A4 PDF, drawn as text rather than as a
 * screenshot of the card: a responder may be reading this printed out, so it
 * has to stay sharp and selectable at any size.
 *
 * The section order matches the card on screen, and every value comes from the
 * same helpers, so the two can never disagree.
 */

type Row = { label: string; value: string };
type Section = { title: string; rows: Row[]; accent?: [number, number, number] };

const BLUE: [number, number, number] = [37, 99, 235];
const RED: [number, number, number] = [220, 38, 38];
const GREY: [number, number, number] = [148, 163, 184];
const INK: [number, number, number] = [17, 24, 39];
const LINE: [number, number, number] = [226, 232, 240];

const MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4 portrait, in points.
const PAGE_HEIGHT = 841.89;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function sectionsFor(profile: Profile): Section[] {
  const clinical = profile.clinical_profile ?? null;
  const contact = clinical?.emergency_contact ?? null;
  const doctor = clinical?.primary_doctor ?? null;

  const sections: Section[] = [
    {
      title: "PATIENT DETAILS",
      rows: [
        { label: "Name", value: profile.name },
        { label: "Blood Type", value: bloodTypeLabel(clinical) },
        { label: "DOB", value: formatDob(clinical?.date_of_birth) },
      ],
    },
    {
      title: "MEDICAL INFORMATION",
      rows: [
        { label: "Diagnosis", value: diagnosisLabel(profile) },
        { label: "Severity", value: severityOf(clinical) },
        { label: "Current Medication", value: medicationSummary(clinical) },
      ],
    },
    {
      title: "DRUG ALLERGIES",
      rows: [{ label: "Allergies", value: drugAllergiesLabel(clinical) }],
    },
    {
      title: "EMERGENCY CONTACT",
      accent: RED,
      rows: contact
        ? [
            { label: "Name", value: contact.name },
            ...(contact.relationship
              ? [{ label: "Relationship", value: contact.relationship }]
              : []),
            { label: "Phone", value: contact.phone },
          ]
        : [{ label: "Contact", value: "Not recorded" }],
    },
    {
      title: "PRIMARY DOCTOR (ORGANISATION)",
      rows: doctor
        ? [
            { label: "Name", value: doctor.name },
            ...(doctor.organisation ? [{ label: "Organisation", value: doctor.organisation }] : []),
            ...(doctor.phone ? [{ label: "Phone", value: doctor.phone }] : []),
          ]
        : [{ label: "Doctor", value: "Not recorded" }],
    },
  ];

  return sections;
}

/** A filename a phone's Files app can tell apart from the next person's. */
function fileNameFor(profile: Profile): string {
  const slug = profile.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `medical-id-${slug || "profile"}.pdf`;
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

export function downloadMedicalIdPdf(profile: Profile): void {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const label = diagnosisLabel(profile);
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLUE);
  doc.text("MEDICAL ID", MARGIN, y, { charSpace: 1.5 });

  y += 30;
  doc.setFontSize(28);
  doc.setTextColor(...RED);
  doc.text(label, MARGIN, y);

  y += 18;
  doc.setFontSize(9);
  doc.setTextColor(...GREY);
  doc.text("BLEEDING DISORDER  •  HANDLE WITH CARE", MARGIN, y, { charSpace: 0.8 });

  y += 22;

  for (const section of sectionsFor(profile)) {
    y = breakIfNeeded(doc, y, 90);

    doc.setDrawColor(...LINE);
    doc.setLineWidth(1);
    doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
    y += 22;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...(section.accent ?? BLUE));
    doc.text(section.title, MARGIN, y, { charSpace: 0.8 });
    y += 18;

    for (const row of section.rows) {
      y = breakIfNeeded(doc, y, 40);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...GREY);
      doc.text(row.label, MARGIN, y);
      y += 13;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...INK);
      // Long values (a medication list, an allergy note) wrap rather than run
      // off the page.
      const lines = doc.splitTextToSize(row.value, CONTENT_WIDTH) as string[];
      for (const line of lines) {
        doc.text(line, MARGIN, y);
        y += 14;
      }
      y += 6;
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(
    `Generated ${new Intl.DateTimeFormat("en-SG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date())}`,
    MARGIN,
    y + 6,
  );

  doc.save(fileNameFor(profile));
}
