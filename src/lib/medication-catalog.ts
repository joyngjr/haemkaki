import type { DiagnosisType } from "@/lib/api";

export type MedicationKind = "prophylaxis" | "onDemand" | "other";

export type MedicationProduct = {
  name: string;
  aliases: string[];
  kinds: MedicationKind[];
  diagnoses?: DiagnosisType[];
  diagnosesByKind?: Partial<Record<MedicationKind, DiagnosisType[]>>;
  routes: string[];
  status?: string;
};

const A: DiagnosisType[] = ["haemophilia_a", "symptomatic_carrier_a"];
const B: DiagnosisType[] = ["haemophilia_b", "symptomatic_carrier_b"];
const A_OR_B: DiagnosisType[] = [...A, ...B];
const ACQUIRED: DiagnosisType[] = ["acquired_haemophilia"];
const FXI: DiagnosisType[] = ["factor_xi_deficiency"];

const FACTOR_ROUTES = ["Intravenous (IV)"];
const FACTOR_KINDS: MedicationKind[] = ["prophylaxis", "onDemand"];

/** The products stocked in our hospitals; anything else can still be typed. */
export const MEDICATIONS: MedicationProduct[] = [
  {
    name: "Advate",
    aliases: ["octocog alfa", "recombinant factor VIII", "FVIII concentrate"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Adynovate",
    aliases: ["rurioctocog alfa pegol", "PEGylated recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Xyntha",
    aliases: ["moroctocog alfa", "B-domain-deleted recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Haemoctin SDH",
    aliases: ["human coagulation factor VIII", "plasma-derived factor VIII", "pdFVIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "BeneFIX",
    aliases: ["nonacog alfa", "recombinant factor IX", "FIX concentrate"],
    kinds: FACTOR_KINDS,
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Idelvion",
    aliases: ["albutrepenonacog alfa", "recombinant FIX-albumin fusion"],
    kinds: FACTOR_KINDS,
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Hemlibra",
    aliases: ["emicizumab-kxwh", "emicizumab", "FVIII-mimetic bispecific antibody"],
    kinds: ["prophylaxis"],
    diagnoses: [...A, ...ACQUIRED],
    routes: ["Subcutaneous injection"],
  },
  {
    name: "NovoSeven RT",
    aliases: ["eptacog alfa activated", "recombinant activated factor VII", "rFVIIa"],
    kinds: ["prophylaxis", "onDemand"],
    diagnoses: [...A_OR_B, ...ACQUIRED, ...FXI],
    diagnosesByKind: {
      prophylaxis: A_OR_B,
      onDemand: [...A_OR_B, ...ACQUIRED, ...FXI],
    },
    routes: FACTOR_ROUTES,
  },
  {
    name: "FEIBA",
    aliases: [
      "activated prothrombin complex concentrate",
      "aPCC",
      "anti-inhibitor coagulant complex",
    ],
    kinds: ["prophylaxis", "onDemand"],
    diagnoses: [...A_OR_B, ...ACQUIRED],
    diagnosesByKind: {
      prophylaxis: A_OR_B,
      onDemand: [...A_OR_B, ...ACQUIRED],
    },
    routes: FACTOR_ROUTES,
  },
  {
    name: "Tranexamic acid",
    aliases: ["TXA", "Cyklokapron", "Lysteda"],
    kinds: ["onDemand", "other"],
    routes: ["Oral", "Intravenous (IV)", "Topical / oral rinse"],
  },
];

export const ALL_ROUTES = Array.from(new Set(MEDICATIONS.flatMap((item) => item.routes)));

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

function distance(left: string, right: string): number {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let i = 1; i <= left.length; i += 1) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= right.length; j += 1) {
      const saved = row[j];
      row[j] = Math.min(
        row[j] + 1,
        row[j - 1] + 1,
        previous + (left[i - 1] === right[j - 1] ? 0 : 1),
      );
      previous = saved;
    }
  }
  return row[right.length];
}

export function medicationSuggestions(
  query: string,
  kind: MedicationKind,
  diagnosis: DiagnosisType,
): MedicationProduct[] {
  const needle = normalize(query);
  const available = MEDICATIONS.filter((item) => {
    if (!item.kinds.includes(kind)) return false;
    const diagnoses = item.diagnosesByKind?.[kind] ?? item.diagnoses;
    return !diagnoses || diagnoses.includes(diagnosis);
  });

  if (!needle) return available;
  return available
    .map((item) => {
      const names = [item.name, ...item.aliases].map(normalize);
      const score = Math.min(
        ...names.map((name) =>
          name.includes(needle)
            ? Math.max(0, name.length - needle.length) / 10
            : distance(needle, name),
        ),
      );
      return { item, score };
    })
    .filter(({ score }) => score <= Math.max(3, Math.ceil(needle.length * 0.45)))
    .sort((a, b) => a.score - b.score)
    .map(({ item }) => item);
}

export function matchedMedication(name: string): MedicationProduct | null {
  const needle = normalize(name);
  return (
    MEDICATIONS.find((item) =>
      [item.name, ...item.aliases].some((candidate) => normalize(candidate) === needle),
    ) ?? null
  );
}
