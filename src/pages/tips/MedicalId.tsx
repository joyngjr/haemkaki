import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import { CallLink } from "@/components/tips/medical-id/CallLink";
import { Field, SectionCard } from "@/components/tips/medical-id/SectionCard";
import {
  CapsuleIcon,
  PersonIcon,
  PhoneIcon,
  PlusIcon,
  StethoscopeIcon,
} from "@/components/tips/medical-id/SectionIcons";
import type { ClinicalProfile, Profile } from "@/lib/api";
import { useProfiles } from "@/state/profile-context";

type Lang = "en" | "zh" | "ms" | "ta";

const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
  ta: "தமிழ்",
};

// ---- Diagnosis (medically accurate: reflects the actual recorded diagnosis,
// not just a blind factor_type -> A/B guess, which mislabels e.g. an FXI patient) ----

const DIAGNOSIS_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    haemophilia_a: "Haemophilia A",
    haemophilia_b: "Haemophilia B",
    factor_xi_deficiency: "Factor XI Deficiency",
    acquired_haemophilia: "Acquired Haemophilia",
    symptomatic_carrier_a: "Symptomatic Carrier (A)",
    symptomatic_carrier_b: "Symptomatic Carrier (B)",
    other_or_unknown: "Bleeding Disorder",
  },
  zh: {
    haemophilia_a: "甲型血友病",
    haemophilia_b: "乙型血友病",
    factor_xi_deficiency: "第十一因子缺乏症",
    acquired_haemophilia: "获得性血友病",
    symptomatic_carrier_a: "甲型症状性携带者",
    symptomatic_carrier_b: "乙型症状性携带者",
    other_or_unknown: "出血性疾病",
  },
  ms: {
    haemophilia_a: "Hemofilia A",
    haemophilia_b: "Hemofilia B",
    factor_xi_deficiency: "Kekurangan Faktor XI",
    acquired_haemophilia: "Hemofilia Diperoleh",
    symptomatic_carrier_a: "Pembawa Simptomatik (A)",
    symptomatic_carrier_b: "Pembawa Simptomatik (B)",
    other_or_unknown: "Gangguan Pendarahan",
  },
  ta: {
    haemophilia_a: "ஏ வகை ஹீமோபிலியா",
    haemophilia_b: "பி வகை ஹீமோபிலியா",
    factor_xi_deficiency: "காரணி XI குறைபாடு",
    acquired_haemophilia: "பெறப்பட்ட ஹீமோபிலியா",
    symptomatic_carrier_a: "அறிகுறி கொண்ட கேரியர் (A)",
    symptomatic_carrier_b: "அறிகுறி கொண்ட கேரியர் (B)",
    other_or_unknown: "இரத்தப்போக்கு கோளாறு",
  },
};

function diagnosisKey(profile: Profile): string {
  const diagnosis = profile.clinical_profile?.diagnosis;
  if (diagnosis) return diagnosis;
  if (profile.factor_type === "VIII") return "haemophilia_a";
  if (profile.factor_type === "IX") return "haemophilia_b";
  return "other_or_unknown";
}

function diagnosisLabel(profile: Profile, lang: Lang): string {
  const key = diagnosisKey(profile);
  return DIAGNOSIS_LABELS[lang][key] ?? DIAGNOSIS_LABELS[lang].other_or_unknown;
}

// ---- Severity: recorded in a different field depending on the diagnosis ----

const SEVERITY_LABELS: Record<Lang, Record<string, string>> = {
  en: {
    severe: "Severe",
    moderate: "Moderate",
    mild: "Mild",
    not_known: "Not known",
    severe_deficiency: "Severe deficiency",
    partial_deficiency: "Partial deficiency",
    life_threatening_or_major: "Life-threatening / major bleeding",
    moderate_or_non_life_threatening: "Moderate / non-life-threatening",
    unknown: "Unknown",
  },
  zh: {
    severe: "重度",
    moderate: "中度",
    mild: "轻度",
    not_known: "未知",
    severe_deficiency: "重度缺乏",
    partial_deficiency: "部分缺乏",
    life_threatening_or_major: "危及生命 / 大出血",
    moderate_or_non_life_threatening: "中度 / 非危及生命",
    unknown: "未知",
  },
  ms: {
    severe: "Teruk",
    moderate: "Sederhana",
    mild: "Ringan",
    not_known: "Tidak diketahui",
    severe_deficiency: "Kekurangan Teruk",
    partial_deficiency: "Kekurangan Separa",
    life_threatening_or_major: "Mengancam nyawa / pendarahan major",
    moderate_or_non_life_threatening: "Sederhana / tidak mengancam nyawa",
    unknown: "Tidak diketahui",
  },
  ta: {
    severe: "கடுமையான",
    moderate: "மிதமான",
    mild: "லேசான",
    not_known: "தெரியவில்லை",
    severe_deficiency: "கடுமையான குறைபாடு",
    partial_deficiency: "பகுதி குறைபாடு",
    life_threatening_or_major: "உயிருக்கு ஆபத்தான / பெரிய இரத்தப்போக்கு",
    moderate_or_non_life_threatening: "மிதமான / உயிருக்கு ஆபத்தில்லாத",
    unknown: "தெரியவில்லை",
  },
};

function severityLabel(
  clinical: ClinicalProfile | null | undefined,
  lang: Lang,
  notRecorded: string,
): string {
  const recorded =
    clinical?.congenital_severity ??
    clinical?.factor_xi_deficiency_level ??
    clinical?.acquired_bleeding_severity;
  if (!recorded) return notRecorded;
  return SEVERITY_LABELS[lang][recorded] ?? recorded;
}

function formatDob(iso: string | null | undefined, notRecorded: string): string {
  if (!iso) return notRecorded;
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return notRecorded;
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function bloodTypeLabel(
  clinical: ClinicalProfile | null | undefined,
  notRecorded: string,
  notKnown: string,
): string {
  const recorded = clinical?.blood_type;
  if (!recorded) return notRecorded;
  return recorded === "unknown" ? notKnown : recorded;
}

/** Real medication names/doses on file — never translated, since these are exact drug names. */
function medicationSummary(
  clinical: ClinicalProfile | null | undefined,
  notRecorded: string,
): string {
  const named = [clinical?.prophylactic_medication, clinical?.on_demand_medication]
    .filter((medication) => medication?.name)
    .map((medication) =>
      medication!.dose && medication!.unit
        ? `${medication!.name} (${medication!.dose} ${medication!.unit})`
        : medication!.name,
    );
  return named.length ? named.join(", ") : notRecorded;
}

const T: Record<Lang, Record<string, string>> = {
  en: {
    back: "Back",
    medicalId: "MEDICAL ID",
    bleedingDisorder: "BLEEDING DISORDER",
    handleWithCare: "HANDLE WITH CARE",
    bannerIntro: "This patient has",
    bannerDetail:
      "Please ensure appropriate treatment and avoid unnecessary procedures or injections.",
    patientDetails: "PATIENT DETAILS",
    name: "Name",
    bloodType: "Blood Type",
    dob: "DOB",
    medicalInformation: "MEDICAL INFORMATION",
    diagnosisLabel: "Diagnosis",
    severity: "Severity",
    currentMedication: "Current Medication",
    drugAllergies: "DRUG ALLERGIES",
    noneRecorded: "None recorded",
    yesDetailsNotRecorded: "Yes — details not recorded",
    emergencyContact: "EMERGENCY CONTACT",
    relationship: "Relationship",
    phone: "Phone",
    callEmergency: "Call Emergency Contact",
    primaryDoctor: "PRIMARY DOCTOR (ORGANISATION)",
    organisation: "Organisation",
    callDoctor: "Call Doctor",
    notRecorded: "Not recorded",
    notKnown: "Not known",
    notRecordedNote: "Not recorded. Add one under Emergency when editing this profile.",
    language: "Language",
    download: "Download",
  },
  zh: {
    back: "返回",
    medicalId: "医疗身份证",
    bleedingDisorder: "出血性疾病",
    handleWithCare: "请小心处理",
    bannerIntro: "此患者患有",
    bannerDetail: "请确保给予适当治疗，并避免不必要的手术或注射。",
    patientDetails: "患者详情",
    name: "姓名",
    bloodType: "血型",
    dob: "出生日期",
    medicalInformation: "医疗信息",
    diagnosisLabel: "诊断",
    severity: "严重程度",
    currentMedication: "目前用药",
    drugAllergies: "药物过敏",
    noneRecorded: "无记录",
    yesDetailsNotRecorded: "有过敏 — 详情未记录",
    emergencyContact: "紧急联系人",
    relationship: "关系",
    phone: "电话",
    callEmergency: "拨打紧急联系人电话",
    primaryDoctor: "主治医生（机构）",
    organisation: "机构",
    callDoctor: "拨打医生电话",
    notRecorded: "未记录",
    notKnown: "未知",
    notRecordedNote: "未记录。编辑此档案时可在「紧急」部分添加。",
    language: "语言",
    download: "下载",
  },
  ms: {
    back: "Kembali",
    medicalId: "ID PERUBATAN",
    bleedingDisorder: "GANGGUAN PENDARAHAN",
    handleWithCare: "KENDALIKAN DENGAN BERHATI-HATI",
    bannerIntro: "Pesakit ini mempunyai",
    bannerDetail:
      "Sila pastikan rawatan yang sesuai diberikan dan elakkan prosedur atau suntikan yang tidak perlu.",
    patientDetails: "BUTIRAN PESAKIT",
    name: "Nama",
    bloodType: "Jenis Darah",
    dob: "Tarikh Lahir",
    medicalInformation: "MAKLUMAT PERUBATAN",
    diagnosisLabel: "Diagnosis",
    severity: "Tahap Keterukan",
    currentMedication: "Ubat Semasa",
    drugAllergies: "ALAHAN UBAT",
    noneRecorded: "Tiada direkodkan",
    yesDetailsNotRecorded: "Ya — butiran tidak direkodkan",
    emergencyContact: "KENALAN KECEMASAN",
    relationship: "Hubungan",
    phone: "Telefon",
    callEmergency: "Hubungi Kenalan Kecemasan",
    primaryDoctor: "DOKTOR UTAMA (ORGANISASI)",
    organisation: "Organisasi",
    callDoctor: "Hubungi Doktor",
    notRecorded: "Tidak direkodkan",
    notKnown: "Tidak diketahui",
    notRecordedNote: "Tidak direkodkan. Tambah satu di bawah Kecemasan semasa mengedit profil ini.",
    language: "Bahasa",
    download: "Muat Turun",
  },
  ta: {
    back: "பின்செல்",
    medicalId: "மருத்துவ அடையாள அட்டை",
    bleedingDisorder: "இரத்தப்போக்கு கோளாறு",
    handleWithCare: "கவனமாக கையாளவும்",
    bannerIntro: "இந்த நோயாளிக்கு",
    bannerDetail:
      "பொருத்தமான சிகிச்சை அளிக்கப்படுவதை உறுதிசெய்து, தேவையற்ற செயல்முறைகள் அல்லது ஊசிகளைத் தவிர்க்கவும்.",
    patientDetails: "நோயாளர் விவரங்கள்",
    name: "பெயர்",
    bloodType: "இரத்த வகை",
    dob: "பிறந்த தேதி",
    medicalInformation: "மருத்துவ தகவல்",
    diagnosisLabel: "நோய் கண்டறிதல்",
    severity: "தீவிரம்",
    currentMedication: "தற்போதைய மருந்து",
    drugAllergies: "மருந்து ஒவ்வாமைகள்",
    noneRecorded: "பதிவு இல்லை",
    yesDetailsNotRecorded: "ஆம் — விவரங்கள் பதிவு செய்யப்படவில்லை",
    emergencyContact: "அவசர தொடர்பு",
    relationship: "உறவு",
    phone: "தொலைபேசி",
    callEmergency: "அவசர தொடர்பை அழைக்கவும்",
    primaryDoctor: "முதன்மை மருத்துவர் (நிறுவனம்)",
    organisation: "நிறுவனம்",
    callDoctor: "மருத்துவரை அழைக்கவும்",
    notRecorded: "பதிவு செய்யப்படவில்லை",
    notKnown: "தெரியவில்லை",
    notRecordedNote:
      "பதிவு செய்யப்படவில்லை. இந்த சுயவிவரத்தைத் திருத்தும்போது அவசரநிலை பிரிவின் கீழ் ஒன்றைச் சேர்க்கவும்.",
    language: "மொழி",
    download: "பதிவிறக்கம்",
  },
};

export function MedicalId() {
  const { activeProfile, status } = useProfiles();
  const [lang, setLang] = useState<Lang>("en");
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = T[lang];

  async function handleDownload() {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#f9fafb", scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setDownloading(false);
          return;
        }
        const file = new File([blob], "medical-id.png", { type: "image/png" });
        const nav = navigator as Navigator & {
          canShare?: (data: { files: File[] }) => boolean;
          share?: (data: { files: File[]; title?: string }) => Promise<void>;
        };
        if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
          try {
            await nav.share({ files: [file], title: "Medical ID" });
            setDownloading(false);
            return;
          } catch {
            // user cancelled the share sheet, or it's unsupported here; fall through to download
          }
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "medical-id.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setDownloading(false);
      });
    } catch {
      setDownloading(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="px-4 pt-8">
        <p className="text-sm text-gray-400">Loading medical ID...</p>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="px-4 pt-8">
        <Link
          to="/tips"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </Link>
        <p className="mt-4 text-sm text-gray-400">
          No profile selected yet. Create a profile to see a Medical ID.
        </p>
      </div>
    );
  }

  const label = diagnosisLabel(activeProfile, lang);
  const clinical = activeProfile.clinical_profile;
  const contact = clinical?.emergency_contact ?? null;
  const doctor = clinical?.primary_doctor ?? null;

  return (
    <div className="px-4 pt-8 pb-8">
      <div className="flex items-center justify-between">
        <Link
          to="/tips"
          className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.back}
        </Link>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangMenuOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" />
              </svg>
              {LANG_LABELS[lang]}
            </button>
            {langMenuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-black/5">
                {(Object.keys(LANG_LABELS) as Lang[]).map((code) => (
                  <button
                    key={code}
                    onClick={() => {
                      setLang(code);
                      setLangMenuOpen(false);
                    }}
                    className={
                      "block w-full px-4 py-2.5 text-left text-sm " +
                      (lang === code ? "bg-blue-50 font-semibold text-blue-700" : "text-gray-700")
                    }
                  >
                    {LANG_LABELS[code]}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            aria-label={t.download}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 disabled:opacity-50"
          >
            {downloading ? (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 animate-spin"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
              >
                <path
                  d="M12 3v12m0 0-4-4m4 4 4-4M5 21h14"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Everything inside this ref is what gets captured for the download */}
      <div ref={cardRef} className="bg-gray-50">
        <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold tracking-widest text-blue-700">{t.medicalId}</p>
          <h1 className="mt-1 text-4xl font-extrabold text-red-600">{label}</h1>
          <p className="mt-1 text-xs font-bold tracking-wide text-gray-500">
            {t.bleedingDisorder} &nbsp;&#8226;&nbsp; {t.handleWithCare}
          </p>
        </div>

        {/* The line a responder should read first, so it sits above the details. */}
        <div className="mt-4 rounded-[20px] bg-blue-50 p-4">
          <p className="text-sm font-bold text-blue-900">
            {t.bannerIntro} {label}.
          </p>
          <p className="mt-1 text-sm text-blue-800">{t.bannerDetail}</p>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          <SectionCard title={t.patientDetails} iconBg="#1e3a8a" icon={<PersonIcon />}>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.name} value={activeProfile.name} />
              <Field
                label={t.bloodType}
                value={bloodTypeLabel(clinical, t.notRecorded, t.notKnown)}
              />
            </div>
            <Field label={t.dob} value={formatDob(clinical?.date_of_birth, t.notRecorded)} />
          </SectionCard>

          <SectionCard title={t.medicalInformation} iconBg="#2563eb" icon={<CapsuleIcon />}>
            <Field label={t.diagnosisLabel} value={label} />
            <Field label={t.severity} value={severityLabel(clinical, lang, t.notRecorded)} />
            <Field label={t.currentMedication} value={medicationSummary(clinical, t.notRecorded)} />
          </SectionCard>

          <SectionCard title={t.drugAllergies} iconBg="#2563eb" icon={<PlusIcon />}>
            <p className="text-sm text-gray-800">
              {clinical?.has_drug_allergies
                ? (clinical.drug_allergy_details ?? t.yesDetailsNotRecorded)
                : t.noneRecorded}
            </p>
          </SectionCard>

          {/* Both contacts come from the profile's Emergency step. A card that shows
              "Not recorded" is honest; one that shows a placeholder stranger's number
              in an emergency is not. */}
          <SectionCard
            title={t.emergencyContact}
            titleColor="text-red-600"
            iconBg="#fecaca"
            icon={<PhoneIcon />}
          >
            {contact ? (
              <>
                <Field label={t.name} value={contact.name} />
                {contact.relationship ? (
                  <Field label={t.relationship} value={contact.relationship} />
                ) : null}
                <Field label={t.phone} value={contact.phone} />
                <CallLink phone={contact.phone} label={t.callEmergency} className="bg-red-600" />
              </>
            ) : (
              <p className="text-sm text-gray-800">{t.notRecordedNote}</p>
            )}
          </SectionCard>

          <SectionCard title={t.primaryDoctor} iconBg="#2563eb" icon={<StethoscopeIcon />}>
            {doctor ? (
              <>
                <Field label={t.name} value={doctor.name} />
                {doctor.organisation ? (
                  <Field label={t.organisation} value={doctor.organisation} />
                ) : null}
                {doctor.phone ? (
                  <>
                    <Field label={t.phone} value={doctor.phone} />
                    <CallLink phone={doctor.phone} label={t.callDoctor} className="bg-blue-600" />
                  </>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-gray-800">{t.notRecordedNote}</p>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
