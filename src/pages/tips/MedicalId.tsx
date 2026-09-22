import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import html2canvas from "html2canvas";
import { useProfiles } from "@/state/profile-context";
import type { FactorType } from "@/lib/api";

type Lang = "en" | "zh" | "ms" | "ta";

const LANG_LABELS: Record<Lang, string> = {
  en: "English",
  zh: "中文",
  ms: "Bahasa Melayu",
  ta: "தமிழ்",
};

function haemophiliaLabel(factorType: FactorType, lang: Lang): string {
  const table: Record<Lang, [string, string]> = {
    en: ["Haemophilia A", "Haemophilia B"],
    zh: ["甲型血友病", "乙型血友病"],
    ms: ["Hemofilia A", "Hemofilia B"],
    ta: ["ஏ வகை ஹீமோபிலியா", "பி வகை ஹீமோபிலியா"],
  };
  return factorType === "VIII" ? table[lang][0] : table[lang][1];
}

function medicationText(factorType: FactorType, lang: Lang): string {
  if (lang === "zh") return `按需注射凝血因子${factorType}（重组），氨甲环酸（按需使用）`;
  if (lang === "ms")
    return `Faktor ${factorType} mengikut keperluan (rekombinan), Asid Traneksamik (mengikut keperluan)`;
  if (lang === "ta")
    return `தேவைக்கேற்ப காரணி ${factorType} (மறுசேர்க்கை), டிரானெக்ஸாமிக் அமிலம் (தேவைக்கேற்ப)`;
  return `On-demand factor ${factorType} (recombinant), Tranexamic acid (as needed)`;
}

function bannerText(label: string, lang: Lang): string {
  if (lang === "zh") return `此患者患有${label}。请确保给予适当治疗，并避免不必要的手术或注射。`;
  if (lang === "ms")
    return `Pesakit ini mempunyai ${label}. Sila pastikan rawatan yang sesuai diberikan dan elakkan prosedur atau suntikan yang tidak perlu.`;
  if (lang === "ta")
    return `இந்த நோயாளிக்கு ${label} உள்ளது. பொருத்தமான சிகிச்சை அளிக்கப்படுவதை உறுதிசெய்து, தேவையற்ற செயல்முறைகள் அல்லது ஊசிகளைத் தவிர்க்கவும்.`;
  return `This patient has ${label}. Please ensure appropriate treatment and avoid unnecessary procedures or injections.`;
}

const T: Record<Lang, Record<string, string>> = {
  en: {
    back: "Back",
    medicalId: "MEDICAL ID",
    bleedingDisorder: "BLEEDING DISORDER",
    handleWithCare: "HANDLE WITH CARE",
    patientDetails: "PATIENT DETAILS",
    name: "Name",
    bloodType: "Blood Type",
    dob: "DOB",
    medicalInformation: "MEDICAL INFORMATION",
    haemophiliaType: "Haemophilia Type",
    severity: "Severity",
    severe: "Severe",
    currentMedication: "Current Medication",
    otherAllergies: "OTHER ALLERGIES / CONDITIONS",
    allergyLine1: "Allergic to penicillin (rash)",
    allergyLine2: "Mild asthma (uses inhaler as needed)",
    emergencyContact: "EMERGENCY CONTACT",
    relationship: "Relationship",
    mother: "Mother",
    phone: "Phone",
    callEmergency: "Call Emergency Contact",
    primaryDoctor: "PRIMARY DOCTOR (ORGANISATION)",
    organisation: "Organisation",
    callDoctor: "Call Doctor",
    language: "Language",
    download: "Download",
  },
  zh: {
    back: "返回",
    medicalId: "医疗身份证",
    bleedingDisorder: "出血性疾病",
    handleWithCare: "请小心处理",
    patientDetails: "患者详情",
    name: "姓名",
    bloodType: "血型",
    dob: "出生日期",
    medicalInformation: "医疗信息",
    haemophiliaType: "血友病类型",
    severity: "严重程度",
    severe: "重度",
    currentMedication: "目前用药",
    otherAllergies: "其他过敏 / 病症",
    allergyLine1: "对青霉素过敏（皮疹）",
    allergyLine2: "轻度哮喘（按需使用吸入器）",
    emergencyContact: "紧急联系人",
    relationship: "关系",
    mother: "母亲",
    phone: "电话",
    callEmergency: "拨打紧急联系人电话",
    primaryDoctor: "主治医生（机构）",
    organisation: "机构",
    callDoctor: "拨打医生电话",
    language: "语言",
    download: "下载",
  },
  ms: {
    back: "Kembali",
    medicalId: "ID PERUBATAN",
    bleedingDisorder: "GANGGUAN PENDARAHAN",
    handleWithCare: "KENDALIKAN DENGAN BERHATI-HATI",
    patientDetails: "BUTIRAN PESAKIT",
    name: "Nama",
    bloodType: "Jenis Darah",
    dob: "Tarikh Lahir",
    medicalInformation: "MAKLUMAT PERUBATAN",
    haemophiliaType: "Jenis Hemofilia",
    severity: "Tahap Keterukan",
    severe: "Teruk",
    currentMedication: "Ubat Semasa",
    otherAllergies: "ALAHAN / KEADAAN LAIN",
    allergyLine1: "Alah kepada penisilin (ruam)",
    allergyLine2: "Asma ringan (menggunakan penyedut mengikut keperluan)",
    emergencyContact: "KENALAN KECEMASAN",
    relationship: "Hubungan",
    mother: "Ibu",
    phone: "Telefon",
    callEmergency: "Hubungi Kenalan Kecemasan",
    primaryDoctor: "DOKTOR UTAMA (ORGANISASI)",
    organisation: "Organisasi",
    callDoctor: "Hubungi Doktor",
    language: "Bahasa",
    download: "Muat Turun",
  },
  ta: {
    back: "பின்செல்",
    medicalId: "மருத்துவ அடையாள அட்டை",
    bleedingDisorder: "இரத்தப்போக்கு கோளாறு",
    handleWithCare: "கவனமாக கையாளவும்",
    patientDetails: "நோயாளர் விவரங்கள்",
    name: "பெயர்",
    bloodType: "இரத்த வகை",
    dob: "பிறந்த தேதி",
    medicalInformation: "மருத்துவ தகவல்",
    haemophiliaType: "ஹீமோபிலியா வகை",
    severity: "தீவிரம்",
    severe: "கடுமையான",
    currentMedication: "தற்போதைய மருந்து",
    otherAllergies: "பிற ஒவ்வாமைகள் / நிலைமைகள்",
    allergyLine1: "பென்சிலினுக்கு ஒவ்வாமை (சொறி)",
    allergyLine2: "லேசான ஆஸ்துமா (தேவைக்கேற்ப இன்ஹேலர் பயன்படுத்துகிறார்)",
    emergencyContact: "அவசர தொடர்பு",
    relationship: "உறவு",
    mother: "தாய்",
    phone: "தொலைபேசி",
    callEmergency: "அவசர தொடர்பை அழைக்கவும்",
    primaryDoctor: "முதன்மை மருத்துவர் (நிறுவனம்)",
    organisation: "நிறுவனம்",
    callDoctor: "மருத்துவரை அழைக்கவும்",
    language: "மொழி",
    download: "பதிவிறக்கம்",
  },
};

function SectionCard({
  icon,
  iconBg,
  title,
  titleColor = "text-blue-700",
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  titleColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: iconBg }}
        >
          {icon}
        </span>
        <h3 className={"text-xs font-bold tracking-wide " + titleColor}>{title}</h3>
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="text-sm font-semibold text-gray-900">{value}</p>
    </div>
  );
}

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

  const label = haemophiliaLabel(activeProfile.factor_type, lang);

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
        {/* Header */}
        <div className="mt-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
          <p className="text-xs font-bold tracking-widest text-blue-700">{t.medicalId}</p>
          <h1 className="mt-1 text-4xl font-extrabold text-red-600">{label}</h1>
          <p className="mt-1 text-xs font-bold tracking-wide text-gray-500">
            {t.bleedingDisorder} &nbsp;&#8226;&nbsp; {t.handleWithCare}
          </p>
        </div>

        {/* Blue banner */}
        <div className="mt-4 rounded-[20px] bg-blue-50 p-4">
          <p className="text-sm text-blue-900">{bannerText(label, lang)}</p>
        </div>

        <div className="mt-4 flex flex-col gap-4">
          {/* Patient Details */}
          <SectionCard
            title={t.patientDetails}
            iconBg="#1e3a8a"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21c0-4 3.5-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label={t.name} value={activeProfile.name} />
              <Field label={t.bloodType} value="O+" />
            </div>
            <Field label={t.dob} value="12 Mar 2005" />
          </SectionCard>

          {/* Medical Information */}
          <SectionCard
            title={t.medicalInformation}
            iconBg="#2563eb"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="9" y="3" width="6" height="18" rx="3" strokeLinecap="round" />
              </svg>
            }
          >
            <Field label={t.haemophiliaType} value={label} />
            <Field label={t.severity} value={t.severe} />
            <Field
              label={t.currentMedication}
              value={medicationText(activeProfile.factor_type, lang)}
            />
          </SectionCard>

          {/* Allergies */}
          <SectionCard
            title={t.otherAllergies}
            iconBg="#2563eb"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
            }
          >
            <p className="text-sm text-gray-800">{t.allergyLine1}</p>
            <p className="mt-1 text-sm text-gray-800">{t.allergyLine2}</p>
          </SectionCard>

          {/* Emergency Contact */}
          <SectionCard
            title={t.emergencyContact}
            titleColor="text-red-600"
            iconBg="#fecaca"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="#dc2626"
                strokeWidth="2"
              >
                <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.7a2 2 0 0 1-.4 2.1L8 9.9a16 16 0 0 0 6 6l1.4-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.5 2.7.6a2 2 0 0 1 1.8 2.1z" />
              </svg>
            }
          >
            <Field label={t.name} value="Tan Mei Ling (Mother)" />
            <Field label={t.relationship} value={t.mother} />
            <Field label={t.phone} value="+65 9123 4567" />
            <a
              href="tel:+6591234567"
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-semibold text-white"
            >
              {t.callEmergency}
            </a>
          </SectionCard>

          {/* Primary Doctor */}
          <SectionCard
            title={t.primaryDoctor}
            iconBg="#2563eb"
            icon={
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 3v6a3 3 0 0 0 6 0V3M6 12v3a6 6 0 0 0 12 0v-3" strokeLinecap="round" />
              </svg>
            }
          >
            <Field label={t.name} value="Dr. Lim Wei Hong" />
            <Field label={t.organisation} value="National University Hospital (NUH)" />
            <Field label={t.phone} value="+65 6772 2222" />
            <a
              href="tel:+6567722222"
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-blue-600 py-2.5 text-sm font-semibold text-white"
            >
              {t.callDoctor}
            </a>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
