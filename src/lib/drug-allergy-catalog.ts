export type DrugAllergyOption = {
  name: string;
  category: string;
  aliases?: string[];
};

const groupedDrugs: { category: string; names: string[] }[] = [
  {
    category: "Penicillins",
    names: [
      "Penicillin",
      "Benzylpenicillin",
      "Phenoxymethylpenicillin",
      "Amoxicillin",
      "Amoxicillin–clavulanate",
      "Ampicillin",
      "Ampicillin–sulbactam",
      "Flucloxacillin",
      "Dicloxacillin",
      "Cloxacillin",
      "Oxacillin",
      "Nafcillin",
      "Piperacillin–tazobactam",
      "Ticarcillin–clavulanate",
    ],
  },
  {
    category: "Cephalosporins",
    names: [
      "Cephalosporin",
      "Cefalexin",
      "Cefadroxil",
      "Cefazolin",
      "Cefaclor",
      "Cefprozil",
      "Cefuroxime",
      "Cefixime",
      "Cefpodoxime",
      "Cefotaxime",
      "Ceftriaxone",
      "Ceftazidime",
      "Cefepime",
      "Ceftaroline",
    ],
  },
  {
    category: "Other beta-lactams",
    names: ["Carbapenem", "Imipenem–cilastatin", "Meropenem", "Ertapenem", "Doripenem", "Aztreonam"],
  },
  {
    category: "Sulfonamide antibiotics",
    names: [
      "Sulfamethoxazole–trimethoprim",
      "Sulfadiazine",
      "Sulfisoxazole",
      "Sulfacetamide",
      "Sulfasalazine",
    ],
  },
  {
    category: "Fluoroquinolones",
    names: ["Ciprofloxacin", "Levofloxacin", "Moxifloxacin", "Ofloxacin", "Norfloxacin", "Delafloxacin"],
  },
  {
    category: "Macrolides",
    names: ["Azithromycin", "Clarithromycin", "Erythromycin", "Roxithromycin", "Telithromycin"],
  },
  {
    category: "Other antibiotics",
    names: [
      "Vancomycin",
      "Teicoplanin",
      "Doxycycline",
      "Minocycline",
      "Tetracycline",
      "Tigecycline",
      "Neomycin",
      "Gentamicin",
      "Tobramycin",
      "Amikacin",
      "Kanamycin",
      "Streptomycin",
      "Framycetin",
      "Paromomycin",
      "Clindamycin",
      "Metronidazole",
      "Nitrofurantoin",
      "Linezolid",
      "Daptomycin",
      "Rifampicin",
      "Isoniazid",
      "Ethambutol",
      "Pyrazinamide",
      "Chloramphenicol",
      "Dapsone",
    ],
  },
  {
    category: "NSAIDs and analgesics",
    names: [
      "Aspirin",
      "Ibuprofen",
      "Naproxen",
      "Diclofenac",
      "Indometacin",
      "Ketorolac",
      "Ketoprofen",
      "Mefenamic acid",
      "Piroxicam",
      "Meloxicam",
      "Etoricoxib",
      "Celecoxib",
      "Paracetamol",
      "Morphine",
      "Codeine",
      "Oxycodone",
      "Hydromorphone",
      "Fentanyl",
      "Tramadol",
    ],
  },
  {
    category: "Anticonvulsants",
    names: [
      "Carbamazepine",
      "Oxcarbazepine",
      "Phenytoin",
      "Fosphenytoin",
      "Phenobarbital",
      "Primidone",
      "Lamotrigine",
      "Zonisamide",
    ],
  },
  {
    category: "Gout medicines",
    names: ["Allopurinol", "Febuxostat"],
  },
  {
    category: "Antiretrovirals",
    names: ["Abacavir", "Nevirapine", "Efavirenz", "Etravirine", "Raltegravir"],
  },
  {
    category: "Cancer medicines",
    names: [
      "Carboplatin",
      "Cisplatin",
      "Oxaliplatin",
      "Paclitaxel",
      "Docetaxel",
      "Cabazitaxel",
      "Asparaginase",
      "Pegaspargase",
      "Methotrexate",
      "Doxorubicin",
      "Etoposide",
      "Irinotecan",
    ],
  },
  {
    category: "Biologics",
    names: [
      "Rituximab",
      "Cetuximab",
      "Infliximab",
      "Tocilizumab",
      "Omalizumab",
      "Trastuzumab",
      "Bevacizumab",
      "Adalimumab",
      "Etanercept",
    ],
  },
  {
    category: "Anaesthetic and peri-operative medicines",
    names: [
      "Rocuronium",
      "Suxamethonium",
      "Atracurium",
      "Cisatracurium",
      "Vecuronium",
      "Pancuronium",
      "Mivacurium",
      "Propofol",
      "Thiopental",
      "Midazolam",
      "Sugammadex",
      "Protamine",
      "Lidocaine",
      "Bupivacaine",
      "Mepivacaine",
      "Prilocaine",
      "Ropivacaine",
      "Articaine",
      "Procaine",
      "Chloroprocaine",
      "Tetracaine",
      "Benzocaine",
    ],
  },
  {
    category: "Other medicines and medical agents",
    names: [
      "Chlorhexidine",
      "Iohexol",
      "Iopamidol",
      "Omeprazole",
      "Esomeprazole",
      "Lansoprazole",
      "Pantoprazole",
      "Rabeprazole",
      "Captopril",
      "Enalapril",
      "Lisinopril",
      "Perindopril",
      "Ramipril",
      "Insulin",
      "Heparin",
      "Enoxaparin",
      "Dalteparin",
      "Tinzaparin",
      "Clopidogrel",
      "Hydralazine",
      "Procainamide",
      "Propylthiouracil",
      "Bupropion",
      "Quinine",
    ],
  },
  {
    category: "Excipients",
    names: [
      "Polyethylene glycol",
      "Polysorbate 80",
      "Gelatin",
      "Carboxymethylcellulose",
      "Dextran",
      "Cremophor EL",
      "Mannitol",
      "Povidone",
      "Benzyl alcohol",
      "Parabens",
      "Metabisulfite",
    ],
  },
];

const aliases: Record<string, string[]> = {
  Benzylpenicillin: ["penicillin G"],
  Phenoxymethylpenicillin: ["penicillin V"],
  "Amoxicillin–clavulanate": ["co-amoxiclav", "Augmentin", "amoxicillin clavulanic acid"],
  "Sulfamethoxazole–trimethoprim": ["co-trimoxazole", "TMP-SMX", "Bactrim", "Septra", "sulfa"],
  Cefalexin: ["cephalexin"],
  Indometacin: ["indomethacin"],
  Paracetamol: ["acetaminophen", "Tylenol", "Panadol"],
  Rifampicin: ["rifampin"],
  Suxamethonium: ["succinylcholine"],
  Lidocaine: ["lignocaine"],
  "Polyethylene glycol": ["PEG", "macrogol"],
  Metabisulfite: ["sulfite"],
};

export const DRUG_ALLERGY_CATALOG: DrugAllergyOption[] = groupedDrugs.flatMap(
  ({ category, names }) =>
    names.map((name) => ({
      name,
      category,
      aliases: aliases[name],
    })),
);

function normalized(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[–—-]/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function drugAllergySuggestions(
  query: string,
  selected: readonly string[] = [],
  limit = 8,
): DrugAllergyOption[] {
  const search = normalized(query);
  if (!search) return [];

  const excluded = new Set(selected.map(normalized));
  return DRUG_ALLERGY_CATALOG.map((option) => {
    const name = normalized(option.name);
    const optionAliases = option.aliases?.map(normalized) ?? [];
    let score = Number.POSITIVE_INFINITY;
    if (name === search) score = 0;
    else if (name.startsWith(search)) score = 1;
    else if (optionAliases.some((alias) => alias.startsWith(search))) score = 2;
    else if (name.includes(search)) score = 3;
    else if (optionAliases.some((alias) => alias.includes(search))) score = 4;
    else if (normalized(option.category).includes(search)) score = 5;
    return { option, score };
  })
    .filter(({ option, score }) => Number.isFinite(score) && !excluded.has(normalized(option.name)))
    .sort((a, b) => a.score - b.score || a.option.name.localeCompare(b.option.name))
    .slice(0, limit)
    .map(({ option }) => option);
}

export function isKnownDrugAllergy(value: string) {
  const search = normalized(value);
  return DRUG_ALLERGY_CATALOG.some(
    (option) =>
      normalized(option.name) === search || option.aliases?.some((alias) => normalized(alias) === search),
  );
}
