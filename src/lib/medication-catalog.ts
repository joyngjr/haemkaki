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

export const MEDICATIONS: MedicationProduct[] = [
  {
    name: "Advate",
    aliases: ["octocog alfa", "recombinant factor VIII", "FVIII concentrate"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Kovaltry",
    aliases: ["octocog alfa", "recombinant factor VIII", "FVIII concentrate"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Recombinate",
    aliases: ["octocog alfa", "recombinant factor VIII", "FVIII concentrate"],
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
    name: "NovoEight",
    aliases: ["turoctocog alfa", "recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Nuwiq",
    aliases: ["simoctocog alfa", "recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Afstyla",
    aliases: ["lonoctocog alfa", "single-chain recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Eloctate",
    aliases: ["efmoroctocog alfa", "Elocta", "recombinant FVIII-Fc"],
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
    name: "Jivi",
    aliases: ["damoctocog alfa pegol", "PEGylated recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Esperoct",
    aliases: ["turoctocog alfa pegol", "PEGylated recombinant factor VIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Altuviiio",
    aliases: ["efanesoctocog alfa", "FVIII Fc-VWF-XTEN fusion"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Hemofil M",
    aliases: ["human plasma-derived factor VIII", "pdFVIII"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Alphanate",
    aliases: ["human plasma-derived FVIII/VWF concentrate", "pdFVIII/VWF"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Humate-P",
    aliases: ["human plasma-derived FVIII/VWF concentrate", "pdFVIII/VWF"],
    kinds: FACTOR_KINDS,
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Koate-DVI",
    aliases: ["human plasma-derived FVIII/VWF concentrate", "pdFVIII/VWF"],
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
    name: "Rixubis",
    aliases: ["nonacog gamma", "recombinant factor IX", "FIX concentrate"],
    kinds: FACTOR_KINDS,
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Ixinity",
    aliases: ["trenonacog alfa", "recombinant factor IX", "FIX concentrate"],
    kinds: FACTOR_KINDS,
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Alprolix",
    aliases: ["eftrenonacog alfa", "recombinant FIX-Fc"],
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
    name: "Rebinyn",
    aliases: ["nonacog beta pegol", "glycoPEGylated recombinant factor IX"],
    kinds: FACTOR_KINDS,
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "AlphaNine SD",
    aliases: ["human plasma-derived factor IX", "pdFIX"],
    kinds: FACTOR_KINDS,
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Profilnine SD",
    aliases: ["factor IX complex", "human plasma-derived factor IX complex", "pdFIX complex"],
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
    name: "Alhemo",
    aliases: ["concizumab-mtci", "concizumab", "anti-TFPI antibody"],
    kinds: ["prophylaxis"],
    diagnoses: A_OR_B,
    routes: ["Subcutaneous injection"],
  },
  {
    name: "Hympavzi",
    aliases: ["marstacimab-hncq", "marstacimab", "anti-TFPI antibody"],
    kinds: ["prophylaxis"],
    diagnoses: A_OR_B,
    routes: ["Subcutaneous injection"],
  },
  {
    name: "Qfitlia",
    aliases: ["fitusiran", "fitusiran sodium", "antithrombin-lowering siRNA"],
    kinds: ["prophylaxis"],
    diagnoses: A_OR_B,
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
    name: "Sevenfact",
    aliases: ["eptacog beta activated", "recombinant activated factor VII", "rFVIIa"],
    kinds: ["onDemand"],
    diagnoses: A_OR_B,
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
    name: "Obizur",
    aliases: ["susoctocog alfa", "recombinant porcine-sequence factor VIII", "rpFVIII"],
    kinds: ["onDemand"],
    diagnoses: ACQUIRED,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Human factor VIII concentrate",
    aliases: ["human FVIII", "recombinant FVIII", "plasma-derived FVIII"],
    kinds: ["onDemand"],
    diagnoses: ACQUIRED,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Desmopressin",
    aliases: ["DDAVP", "Stimate", "Octim"],
    kinds: ["onDemand"],
    diagnoses: [...A, ...ACQUIRED],
    routes: ["Intravenous (IV)", "Subcutaneous injection", "Intranasal spray"],
  },
  {
    name: "Tranexamic acid",
    aliases: ["TXA", "Cyklokapron", "Lysteda"],
    kinds: ["onDemand", "other"],
    routes: ["Oral", "Intravenous (IV)", "Topical / oral rinse"],
  },
  {
    name: "Aminocaproic acid",
    aliases: ["epsilon-aminocaproic acid", "EACA", "Amicar"],
    kinds: ["onDemand", "other"],
    routes: ["Oral", "Intravenous (IV)"],
  },
  {
    name: "Factor XI concentrate",
    aliases: ["FXI concentrate", "factor 11 concentrate"],
    kinds: ["onDemand"],
    diagnoses: FXI,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Fresh frozen plasma",
    aliases: ["FFP", "Octaplas", "pathogen-reduced plasma", "pooled plasma"],
    kinds: ["onDemand"],
    diagnoses: FXI,
    routes: ["Intravenous transfusion"],
  },
  {
    name: "Fibrin sealant",
    aliases: ["fibrin glue", "topical fibrin sealant"],
    kinds: ["onDemand", "other"],
    diagnoses: FXI,
    routes: ["Topical / local"],
  },
  {
    name: "FVIII immune tolerance induction",
    aliases: ["FVIII ITI", "factor VIII immune tolerance therapy"],
    kinds: ["other"],
    diagnoses: A,
    routes: FACTOR_ROUTES,
  },
  {
    name: "FIX immune tolerance induction",
    aliases: ["FIX ITI", "factor IX immune tolerance therapy"],
    kinds: ["other"],
    diagnoses: B,
    routes: FACTOR_ROUTES,
  },
  {
    name: "Prednisone",
    aliases: ["corticosteroid"],
    kinds: ["other"],
    diagnoses: ACQUIRED,
    routes: ["Oral"],
  },
  {
    name: "Prednisolone",
    aliases: ["corticosteroid"],
    kinds: ["other"],
    diagnoses: ACQUIRED,
    routes: ["Oral"],
  },
  {
    name: "Rituximab",
    aliases: ["anti-CD20 monoclonal antibody"],
    kinds: ["other"],
    diagnoses: ACQUIRED,
    routes: ["Intravenous (IV)", "Subcutaneous injection"],
  },
  {
    name: "Cyclophosphamide",
    aliases: ["cytotoxic immunosuppressive therapy"],
    kinds: ["other"],
    diagnoses: ACQUIRED,
    routes: ["Oral", "Intravenous (IV)"],
  },
  {
    name: "Mycophenolate mofetil",
    aliases: ["MMF", "mycophenolate"],
    kinds: ["other"],
    diagnoses: ACQUIRED,
    routes: ["Oral", "Intravenous (IV)"],
  },
  {
    name: "Paracetamol / acetaminophen",
    aliases: ["paracetamol", "acetaminophen", "Panadol", "Tylenol"],
    kinds: ["other"],
    routes: ["Oral", "Intravenous (IV)", "Rectal"],
  },
  {
    name: "Celecoxib",
    aliases: ["Celebrex", "selective COX-2 inhibitor"],
    kinds: ["other"],
    routes: ["Oral"],
  },
  {
    name: "Opioid analgesic",
    aliases: ["opioid pain medicine", "strong pain relief"],
    kinds: ["other"],
    routes: ["Oral", "Intravenous (IV)", "Subcutaneous injection", "Transdermal", "Transmucosal"],
  },
  {
    name: "Iron replacement",
    aliases: ["oral iron", "intravenous iron", "elemental iron"],
    kinds: ["other"],
    routes: ["Oral", "Intravenous (IV)"],
  },
  {
    name: "Hormonal menstrual suppression",
    aliases: ["combined hormonal contraceptive", "progestin", "levonorgestrel"],
    kinds: ["other"],
    routes: ["Oral", "Transdermal", "Vaginal", "Implant", "Injection", "Intrauterine"],
  },
  {
    name: "Hemgenix",
    aliases: ["etranacogene dezaparvovec-drlb", "AAV5 FIX gene therapy"],
    kinds: ["other"],
    diagnoses: B,
    routes: ["Single intravenous infusion"],
  },
  {
    name: "Roctavian",
    aliases: ["valoctocogene roxaparvovec-rvox", "AAV5 FVIII gene therapy"],
    kinds: ["other"],
    diagnoses: A,
    routes: ["Single intravenous infusion"],
    status: "Withdrawn from the US market in early 2026",
  },
  {
    name: "Beqvez",
    aliases: ["fidanacogene elaparvovec-dzkt", "FIX gene therapy"],
    kinds: ["other"],
    diagnoses: B,
    routes: ["Single intravenous infusion"],
    status: "Withdrawn from the market in February 2025",
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
