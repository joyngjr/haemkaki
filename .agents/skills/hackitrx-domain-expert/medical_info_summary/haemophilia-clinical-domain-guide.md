# Medical Summary: Comprehensive Clinical Domain Guide to Haemophilia Management

> **Status:** Domain expert review updated 12 September 2026<br>
> **Issuing Skill:** `hackitrx-domain-expert`  
> **Target Audience:** HackitRx Development Team & Clinical Reviewers  
> **Primary Source:** _WFH Guidelines for the Management of Hemophilia, 3rd edition_ (Srivastava A, Santagostino E, Dougall A, et al. _Haemophilia_. 2020;26(Suppl 6):1–158. DOI: 10.1111/hae.14046) [`WFH_guidelines.md`]  
> **Secondary / External Sources:** International Society on Thrombosis and Haemostasis (ISTH), Medical and Scientific Advisory Council (MASAC) of the National Bleeding Disorders Foundation (NBDF), United Kingdom Haemophilia Centre Doctors' Organisation (UKHCDO), European Medicines Agency (EMA), and US FDA Prescribing Information.

---

## Executive Overview for HackitRx

In these guidelines, **haemophilia** means congenital factor VIII deficiency (haemophilia A) or factor IX deficiency (haemophilia B). Factor XI deficiency and acquired haemophilia A are important differential bleeding disorders covered separately in this guide; they must not inherit haemophilia A/B severity, pharmacokinetic, or treatment rules. In the context of **HackitRx**—a treatment-tracking and patient empowerment application—precise domain logic is essential. Factor replacement, non-factor prophylaxis, bypassing agents, gene therapy, acute bleed triage, and product-specific treatment plans require separate data models rather than one generic factor-decay model.

> **Clinical-use boundary:** This guide is a clinical-domain reference for product design, not a prescribing protocol. Individual treatment must follow the person's haemophilia treatment centre (HTC) plan, locally approved product information, age and indication restrictions, measured pharmacokinetics where relevant, and current jurisdictional guidance. Numerical WFH target levels in this document describe reported global practice patterns and are not universal dose mandates.

---

## 1. Types of Haemophilia

Coagulation disorders bearing the name "haemophilia" are classified based on the specific clotting factor affected and the genetic or immunological etiology:

### 1.1 Haemophilia A (Classic Haemophilia)

- **Deficiency:** Coagulation Factor VIII (FVIII).
- **Genetics & Inheritance:** X-linked recessive disorder caused by pathogenic variants in the _F8_ gene located on the long arm of the X chromosome ($Xq28$).
- **Epidemiology:** Represents **80%–85%** of all congenital haemophilia cases.
  - Estimated global prevalence: 17.1 cases per 100,000 males across all severities (6.0 per 100,000 males for severe).
  - Estimated birth prevalence: 24.6 cases per 100,000 live male births (9.5 per 100,000 for severe).
  - Spontaneous mutations: Approximately 30% of newly diagnosed cases occur without a prior family history due to _de novo_ spontaneous variants.
- **Sources:** [WFH Guidelines 2020, Chapter 2: Comprehensive Care of Hemophilia, p. 21–22; Chapter 4: Genetic Assessment, p. 55–60].

### 1.2 Haemophilia B (Christmas Disease)

- **Deficiency:** Coagulation Factor IX (FIX).
- **Genetics & Inheritance:** X-linked recessive disorder caused by mutations in the _F9_ gene located on the X chromosome ($Xq27$).
- **Epidemiology:** Accounts for **15%–20%** of all congenital haemophilia cases.
  - Estimated global prevalence: 3.8 cases per 100,000 males across all severities (1.1 per 100,000 males for severe).
  - Estimated birth prevalence: 5.0 cases per 100,000 live male births (1.5 per 100,000 for severe).
- **Sources:** [WFH Guidelines 2020, Chapter 2: Comprehensive Care of Hemophilia, p. 21–22; Chapter 4: Genetic Assessment, p. 55–60].

### 1.3 Factor XI Deficiency (Historically “Haemophilia C” / Rosenthal Syndrome)

- **Deficiency:** Coagulation Factor XI (FXI).
- **Genetics & Inheritance:** Usually an autosomal disorder caused by pathogenic variants in the _F11_ gene on chromosome $4q35$. It affects **males and females** and is distinct from X-linked haemophilia A and B.
- **Epidemiology:** Rare in the general global population (~1 in 100,000), but has a high frequency among individuals of Ashkenazi Jewish ancestry (carrier rate ~8%–9%, disease prevalence ~0.1%–0.2%).
- **Clinical Distinction:** Spontaneous joint and muscle bleeding is usually absent or rare. Bleeding is predominantly injury-related or surgical, especially in tissues with high local fibrinolytic activity (oral cavity, nose, tonsils, urinary and genital tracts). FXI activity correlates poorly with bleeding: personal bleeding history and the procedure site are essential risk variables.
- **Sources:** [WFH Monograph: _Treatment of Hemophilia No. 16—Factor XI Deficiency and Its Management_](https://www1.wfh.org/publications/files/pdf-1141.pdf); Orphanet ORPHA:397; ISTH rare bleeding disorder literature.

### 1.4 Acquired Haemophilia (Primarily Acquired Haemophilia A [AHA])

- **Etiology:** Non-congenital, autoimmune bleeding disorder caused by the development of autoantibodies (inhibitors) against endogenous clotting factors (most frequently against Factor VIII; rare cases against FIX or FXI).
- **Demographics:** Rare, affecting both sexes and all ages, with incidence peaks in older adults and during pregnancy or the postpartum period. About half of cases are associated with another condition—commonly autoimmune disease, malignancy, or pregnancy—while the remainder are idiopathic.
- **Clinical Manifestations:** Unlike congenital severe haemophilia where >80% of bleeds are hemarthroses, acquired haemophilia typically presents with extensive, life-threatening subcutaneous, deep muscle, mucosal, retroperitoneal, and gastrointestinal haemorrhages, while hemarthroses are distinctly uncommon.
- **Sources:** [Tiede A, et al. International recommendations on acquired haemophilia A, _Haematologica_ 2020](https://haematologica.org/article/view/9931); Kruse-Jarres R, et al. _Haemophilia_ 2017.

### 1.5 Women and Girls with Haemophilia and Haemophilia Carriers

- **Pathophysiology:** Female carriers possess one mutated _F8_ or _F9_ allele. Due to skewed X-chromosome inactivation (extreme lyonization), Turner syndrome (45,X), or compound heterozygosity, baseline factor levels may drop below 40 IU/dL (<40%).
- **ISTH Nomenclature:** Women and girls with FVIII or FIX levels **<40 IU/dL** are described as having mild, moderate, or severe haemophilia according to the same laboratory thresholds used for males. Those with levels **≥40 IU/dL** who carry a pathogenic variant are described as **symptomatic carriers** or **asymptomatic carriers** according to bleeding phenotype. A normal-range factor level does not exclude clinically important bleeding.
- **Care Implication:** Record factor level, genetic status, menstrual and obstetric bleeding history, and phenotype separately; do not reduce clinical status to a binary “carrier” flag.
- **Sources:** [WFH Guidelines 2020, Chapters 2 and 9]; [ISTH SSC nomenclature for women and girls with haemophilia, 2021](https://pmc.ncbi.nlm.nih.gov/articles/PMC8361713/).

---

## 2. Severity Classification and Bleeding-Risk Assessment

The clinical severity of congenital haemophilia is defined by the residual circulating clotting factor activity in plasma measured via one-stage clotting or chromogenic substrate assays.

### 2.1 Congenital Haemophilia A & B Severity (WFH Standardized Classification)

Derived directly from WFH Table 2-1:

| Severity Level     | Clotting Factor Level (FVIII or FIX)                      | Clinical Bleeding Profile                                                                                                                                                                                        |
| :----------------- | :-------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severe**         | **<1 IU/dL** (<0.01 IU/mL) or **<1% of normal**           | Frequent spontaneous bleeding episodes, predominantly into joints (hemarthrosis) and deep muscles, in the complete absence of identifiable trauma or hemostatic challenge. Early onset (typically before age 2). |
| **Moderate**       | **1–5 IU/dL** (0.01–0.05 IU/mL) or **1%–5% of normal**    | Occasional spontaneous bleeding; prolonged and severe bleeding with minor trauma, injury, or minor surgical/dental procedures. May develop a severe bleeding phenotype if joint damage occurs.                   |
| **Mild**           | **5–40 IU/dL** (0.05–0.40 IU/mL) or **5%–<40% of normal** | Rare spontaneous bleeding; severe, abnormal, prolonged bleeding following major trauma, deep injury, or surgical/dental interventions. Often undiagnosed until adult trauma or surgery.                          |
| _Normal Reference_ | _50–150 IU/dL (0.50–1.50 IU/mL) or 50%–150%_              | Normal physiological coagulation parameters.                                                                                                                                                                     |

> **Clinical Phenotype Note (WFH Recommendation 6.1.1):** While baseline factor levels guide classification, clinical bleeding phenotype varies. Some patients with _moderate_ haemophilia exhibit a _severe bleeding phenotype_ (frequent joint bleeds, arthropathy risk) and require identical prophylactic management to severe patients.
>
> **Sources:** [WFH Guidelines 2020, Chapter 2: Comprehensive Care of Hemophilia, Table 2-1, p. 22; Blanchette VS et al., ISTH SSC Communication, _J Thromb Haemost_ 2014;12:1935–1939].

### 2.2 Factor XI Deficiency Laboratory Groups

Unlike Haemophilia A and B, **plasma FXI activity does NOT correlate reliably with bleeding severity**:

| Severity Stratum              | Plasma FXI Activity Level   | Bleeding Manifestations & Clinical Notes                                                                                                                                                                                    |
| :---------------------------- | :-------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Severe Deficiency**         | **<15–20 IU/dL** (<15%–20%) | Homozygotes or compound heterozygotes. Bleeding after trauma or surgeries involving tissues with high local fibrinolytic activity (mouth, tonsils, nose, prostate, uterus). Spontaneous joint bleeds remain extremely rare. |
| **Partial / Mild Deficiency** | **20–70 IU/dL** (20%–70%)   | Heterozygotes. Often completely asymptomatic throughout life, though some individuals may still experience excessive post-traumatic or post-operative hemorrhage.                                                           |

> **Sources:** [WFH Monograph: _Management of Factor XI Deficiency_, Bolton-Maggs PHB; ISTH SSC Registry on Rare Coagulation Disorders; Peyvandi F, et al. _Haemophilia_ 2012;18:148–153].

### 2.3 Acquired Haemophilia A: Assessment Rather Than Congenital Severity Strata

Acquired haemophilia A does not use the congenital mild/moderate/severe factor-level classification. Assess and store at least:

1. **Current bleeding and clinical stability:** site, extent, haemoglobin trend, haemodynamic compromise, compartment/organ threat, and need for an invasive procedure.
2. **FVIII activity and inhibitor titre:** important for diagnosis, prognosis, laboratory follow-up, and planning inhibitor-eradication therapy, but **poor predictors of bleeding severity** and not a reason to withhold haemostatic treatment.
3. **Underlying or associated condition:** pregnancy/postpartum state, autoimmune disease, malignancy, drug association, or idiopathic disease.

Treat clinically relevant bleeding promptly irrespective of baseline FVIII activity or inhibitor titre. First-line haemostatic options are rFVIIa, aPCC, or recombinant porcine FVIII; choice depends on availability, contraindications, prior response, and the ability to monitor porcine FVIII.

> **Source:** [Tiede A, et al. International recommendations on acquired haemophilia A, _Haematologica_ 2020](https://haematologica.org/article/view/9931/71602).

---

## 3. Types of Prophylactic Medication & Indications by Type and Severity

Prophylaxis is defined by the WFH as: _"the regular administration of a hemostatic agent/agents with the goal of preventing bleeding in people with hemophilia while allowing them to lead active lives and achieve quality of life comparable to non-hemophilic individuals"_ [WFH Chapter 6].

### 3.1 Prophylaxis Timing Tiers (WFH Table 6-1)

- **Primary Prophylaxis:** Regular continuous prophylaxis started in the absence of documented joint disease (by examination/imaging) and **before the second clinically evident joint bleed and before 3 years of age**.
- **Secondary Prophylaxis:** Regular continuous prophylaxis initiated **after 2 or more joint bleeds** but prior to the onset of documented joint disease (usually $\ge 3$ years of age).
- **Tertiary Prophylaxis:** Regular continuous prophylaxis initiated **after the onset of documented joint disease** (often commenced in adolescence or adulthood to retard arthropathy progression).

### 3.2 Medication Classes Used for Prophylaxis

1. **Standard Half-Life (SHL) Factor VIII Concentrates (plasma-derived or recombinant):** pdFVIII, rFVIII (octocog alfa, moroctocog alfa, turoctocog alfa).
2. **Extended Half-Life (EHL) Factor VIII Concentrates:** Recombinant Fc fusion (efmoroctocog alfa), PEGylated (damoctocog alfa pegol, rurioctocog alfa pegol), or single-chain (lonoctocog alfa).
3. **Standard Half-Life (SHL) Factor IX Concentrates (plasma-derived or recombinant):** Pure pdFIX, rFIX (nonacog alfa).
4. **Extended Half-Life (EHL) Factor IX Concentrates:** Recombinant Fc fusion (eftrenonacog alfa), Albumin fusion (albutrepenonacog alfa), or GlycoPEGylated (nonacog beta pegol).
5. **Non-Factor Replacement / Substitution Therapy (Emicizumab):** Humanized bispecific monoclonal antibody bridging FIXa and FX to mimic activated FVIII cofactor function.
6. **Bypassing Agents (for patients with high-responding inhibitors):**
   - Recombinant activated Factor VII (rFVIIa, eptacog alfa / NovoSeven RT).
   - Activated Prothrombin Complex Concentrate (aPCC / FEIBA).
7. **Rebalancing Non-Factor Therapies:**
   - **Fitusiran (Qfitlia):** siRNA that lowers antithrombin; approved in the US for patients aged ≥12 years with haemophilia A or B, with or without inhibitors.
   - **Concizumab (Alhemo):** anti-TFPI monoclonal antibody; approved in the US for patients aged ≥12 years with haemophilia A or B **with inhibitors**.
   - **Marstacimab (Hympavzi):** anti-TFPI monoclonal antibody with jurisdiction- and label-specific age and inhibitor indications.

### 3.3 Which Haemophilia Types and Severities Use Which Prophylactic Medication?

| Haemophilia Type & Inhibitor Status    | Severity Level                           | Recommended Prophylactic Medication                                                                                                                                                                                     | Clinical Guideline Notes                                                                                                                                                                                                                                                    |
| :------------------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Haemophilia A (Without Inhibitors)** | **Severe phenotype**                     | Individualized prophylaxis with SHL/EHL/ultra-long-half-life FVIII or emicizumab; fitusiran or marstacimab may be locally approved.                                                                                     | Long-term prophylaxis is the standard of care. Selection is shared and individualized by age, venous access, bleeding/joint history, activity, adherence, PK, monitoring needs, comorbidity, availability, and preference; WFH does not impose a universal product ranking. |
| **Haemophilia A (Without Inhibitors)** | **Moderate or mild laboratory severity** | Consider regular or time-limited prophylaxis when bleeding phenotype, target joints, activity, procedures, or quality-of-life impact warrant it; otherwise episodic treatment may be appropriate.                       | Do not infer eligibility from factor level alone. A moderate patient may have a severe phenotype, and selected mild patients may need prophylaxis.                                                                                                                          |
| **Haemophilia A (With Inhibitors)**    | **Clinically indicated prophylaxis**     | WFH 2020 prefers **emicizumab** over bypassing-agent prophylaxis [WFH Rec 8.3.5, 8.3.11]. Concizumab, fitusiran, or marstacimab may now be locally approved alternatives; rFVIIa or aPCC prophylaxis may still be used. | Selection requires the current label, thrombotic-risk and breakthrough-bleed plan. Prophylaxis does not eradicate an inhibitor; evaluate ITI separately.                                                                                                                    |
| **Haemophilia B (Without Inhibitors)** | **Severe phenotype**                     | Individualized prophylaxis with pure SHL or EHL FIX; fitusiran or marstacimab may be locally approved.                                                                                                                  | Long-term prophylaxis is standard. Product and interval are individualized; emicizumab does not treat haemophilia B.                                                                                                                                                        |
| **Haemophilia B (Without Inhibitors)** | **Moderate or mild laboratory severity** | Consider regular or time-limited prophylaxis when phenotype, target joints, activity, procedures, or quality-of-life impact warrants it; otherwise episodic pure FIX may be appropriate.                                | Do not infer eligibility from factor level alone.                                                                                                                                                                                                                           |
| **Haemophilia B (With Inhibitors)**    | **Clinically indicated prophylaxis**     | Concizumab, fitusiran, or marstacimab may be locally approved. WFH 2020 options include rFVIIa; aPCC only when there is no FIX allergy/anaphylaxis history.                                                             | aPCC contains FIX and is contraindicated with relevant FIX allergy. Capture nephrotic-syndrome risk/history and a product-specific breakthrough plan.                                                                                                                       |
| **Factor XI Deficiency**               | **Any FXI level**                        | Long-term prophylaxis is generally not used. Procedure plans may use tranexamic acid alone for suitable mucosal/dental procedures, or FXI replacement with FXI concentrate or plasma when indicated.                    | Base the plan on personal/procedural bleeding risk, not FXI activity alone. **Do not combine FXI concentrate with tranexamic acid or another antifibrinolytic because of thrombosis risk.** FXI concentrate itself requires careful thrombotic-risk assessment.             |

> **Sources:** [WFH Guidelines 2020, Chapter 5: Hemostatic Agents, p. 68–78; Chapter 6: Prophylaxis in Hemophilia, p. 81–89; Chapter 8: Inhibitors to Clotting Factor, p. 104–114].

---

## 4. Prophylactic Dosages, Routes of Administration, and Frequencies

WFH Table 6-2 provides population-level regimen examples for **standard-half-life** factor concentrates. EHL, ultra-long-half-life, and non-factor regimens are product-specific; their locally approved label and the HTC prescription are the source of truth.

```
+---------------------------------------------------------------------------------------------------+
|                                 PROPHYLACTIC REGIMENS SUMMARY                                     |
+------------------------------------+-------+--------------------+---------------------------------+
| Therapeutic Agent                  | Route | Typical Dose       | Frequency                       |
+------------------------------------+-------+--------------------+---------------------------------+
| SHL FVIII (High-Dose)              | IV    | 25–40 IU/kg        | Every 2 days or 3x per week     |
| SHL FVIII (Intermediate-Dose)      | IV    | 15–25 IU/kg        | 3 days per week                 |
| SHL FVIII (Low-Dose)               | IV    | 10–15 IU/kg        | 2–3 days per week               |
| EHL/UHL FVIII                      | IV    | Product-specific    | Product/PK-specific             |
| SHL FIX (High-Dose)                | IV    | 40–60 IU/kg        | Twice per week                  |
| SHL FIX (Intermediate-Dose)        | IV    | 20–40 IU/kg        | Twice per week                  |
| SHL FIX (Low-Dose)                 | IV    | 10–15 IU/kg        | 2 days per week                 |
| EHL FIX                            | IV    | Product-specific    | Product/PK-specific             |
| Emicizumab (Loading)               | SC    | 3.0 mg/kg          | Once weekly for first 4 weeks   |
| Emicizumab (Maintenance Option 1)  | SC    | 1.5 mg/kg          | Once weekly                     |
| Emicizumab (Maintenance Option 2)  | SC    | 3.0 mg/kg          | Once every 2 weeks              |
| Emicizumab (Maintenance Option 3)  | SC    | 6.0 mg/kg          | Once every 4 weeks              |
| aPCC / FEIBA (Inhibitor Proph.)    | IV    | 50–100 U/kg        | Every other day or 3x per week  |
| rFVIIa (Inhibitor Proph.)          | IV    | 90–100 ug/kg       | Once daily (up to 270 ug/kg/d)  |
+------------------------------------+-------+--------------------+---------------------------------+
```

### 4.1 Detailed Regimens Breakdown

#### 4.1.1 Standard Half-Life (SHL) Factor VIII Prophylaxis (WFH Table 6-2)

- **Route:** Intravenous (IV) slow bolus over 3–5 minutes.
- **Pharmacokinetics:** In vivo recovery: 1 IU/kg IV raises plasma FVIII by **~2 IU/dL** ($0.02\text{ IU/mL}$). Half-life ($t_{1/2}$): **~12 hours** in adults (shorter in young children, ~8–10 hours).
- **Dosing Schedules:**
  - **High-dose:** 25–40 IU/kg every 2 days or 3 times per week (annual factor consumption: >4000 IU/kg/year).
  - **Intermediate-dose:** 15–25 IU/kg 3 days per week (1500–4000 IU/kg/year).
  - **Low-dose:** 10–15 IU/kg 2–3 days per week (1000–1500 IU/kg/year; used in resource-constrained environments).
  - **Frequency-Escalated Primary Prophylaxis (Canadian / Dutch Protocol):** Starts at 10–15 IU/kg or 50 IU/kg **once weekly** in infants/young toddlers to establish venous access and avoid CVADs, escalating to twice weekly, and subsequently alternate-day dosing if breakthrough bleeds occur.
  - **Infusion Timing:** Morning administration is recommended to align peak factor levels with daytime physical activity [WFH Section 6.3].

#### 4.1.2 Extended Half-Life (EHL) Factor VIII Prophylaxis

- **Route:** Intravenous (IV).
- **Pharmacokinetics:** Conventional EHL FVIII products generally extend half-life about **1.4- to 1.6-fold** compared with SHL FVIII. Efanesoctocog alfa is an ultra-long-half-life FVIII designed to overcome the von Willebrand factor half-life ceiling and must be modeled as a distinct product.
- **Dose and Frequency:** Use the specific product label and individualized PK/clinical response. Do not assign a class-wide dose, fixed half-life, recovery, target trough, or interval.
- **Monitoring:** Product and assay-reagent effects can alter FVIII results; store the product and laboratory method with every measured level.

#### 4.1.3 Standard Half-Life (SHL) Factor IX Prophylaxis (WFH Table 6-2)

- **Route:** Intravenous (IV).
- **Pharmacokinetics:** Half-life ($t_{1/2}$): **~18–24 hours**.
  - _Plasma-derived FIX (pdFIX):_ 1 IU/kg raises plasma FIX by **~1.0 IU/dL**.
  - _Recombinant FIX (rFIX, non-modified):_ Lower in vivo recovery; 1 IU/kg raises plasma FIX by **~0.8 IU/dL** in adults and **~0.7 IU/dL** in children <15 years. (Requires calculating dose as $\text{Desired Level} \times \text{Weight} \div 0.8$ for adults or $\div 0.7$ for children).
- **Dosing Schedules:**
  - **High-dose:** 40–60 IU/kg twice per week (>4000 IU/kg/year).
  - **Intermediate-dose:** 20–40 IU/kg twice per week (2000–4000 IU/kg/year).
  - **Low-dose:** 10–15 IU/kg 2 days per week (1000–1500 IU/kg/year).

#### 4.1.4 Extended Half-Life (EHL) Factor IX Prophylaxis

- **Route:** Intravenous (IV).
- **Pharmacokinetics:** EHL FIX products may extend half-life roughly **3- to 5-fold**, but recovery, distribution, assay behaviour, and approved intervals differ substantially by molecule and patient.
- **Dose and Frequency:** Use the specific product label and individualized PK/clinical response. Some WFH-described EHL FIX regimens administered every 7–14 days maintained FIX levels in the 10–20 IU/dL range, but this is not a universal class target or schedule.

#### 4.1.5 Emicizumab (Hemlibra) Prophylaxis (WFH Rec 5.7.1, 8.3.5)

- **Route:** Subcutaneous (SC) injection into abdomen, thigh, or upper outer arm.
- **Indications:** Congenital haemophilia A, **with or without FVIII inhibitors**, subject to the locally approved label and individualized prophylaxis decision.
- **Dosing Regimen:**
  - **Loading / Induction Phase:** **3.0 mg/kg once weekly for the first 4 weeks** (Days 1, 8, 15, 22).
  - **Maintenance Phase (Commencing Week 5):**
    - _Option A (Weekly):_ **1.5 mg/kg once weekly**.
    - _Option B (Every 2 weeks):_ **3.0 mg/kg once every 2 weeks**.
    - _Option C (Every 4 weeks):_ **6.0 mg/kg once every 4 weeks**.
  - _Pharmacokinetic Profile:_ Terminal half-life is ~28–30 days. WFH describes its haemostatic potential as roughly comparable to about 15 IU/dL FVIII, but this is **not a measured FVIII level**. Standard FVIII decay calculations and aPTT-based FVIII assays must not be applied to emicizumab.

#### 4.1.6 Prophylaxis in Inhibitor Patients Using Bypassing Agents

- **Activated Prothrombin Complex Concentrate (aPCC / FEIBA):**
  - **Route:** IV infusion (rate $\le 2\text{ U/kg/min}$).
  - **Dose:** **50–100 U/kg** every other day or 3 days per week.
  - **Maximum Limits:** Maximum single dose = **100 U/kg**; maximum daily dose = **200 U/kg/day** (to avoid thrombosis and DIC).
- **Recombinant Activated Factor VII (rFVIIa / NovoSeven RT):**
  - **Route:** IV bolus over 2–5 minutes.
  - **Dose:** **90–100 μg/kg** once daily, or up to **270 μg/kg** once daily in described prophylaxis regimens. Its short half-life creates substantial dosing burden; do not infer comparative effectiveness from half-life alone.

### 4.2 Treatment Landscape Added After WFH 2020

These therapies were not available for inclusion in the WFH third edition. Availability and indications vary by country; HackitRx must treat the selected jurisdiction and current product label as required fields.

| Therapy                            | Mechanism and route                                         | Current US indication as of 12 September 2026                                                                      | Safety/implementation fields required                                                                                                                                                                                                                                                                                 |
| :--------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Efanesoctocog alfa (ALTUVIIIO)** | Ultra-long-half-life recombinant FVIII; IV                  | Adults and children with haemophilia A for routine prophylaxis, on-demand treatment, and perioperative management  | Product-specific FVIII PK, assay method, prophylaxis schedule, and separate bleed-dose instructions. [FDA](https://www.fda.gov/vaccines-blood-biologics/altuviiio)                                                                                                                                                    |
| **Concizumab (ALHEMO)**            | Anti-TFPI monoclonal antibody; daily SC                     | Age ≥12 years with haemophilia A with FVIII inhibitors or haemophilia B with FIX inhibitors                        | Thrombotic risk, loading/maintenance phase, treatment interruption, and product-specific breakthrough-bleed plan. [FDA](https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-drug-prevent-or-reduce-frequency-bleeding-episodes-patients-hemophilia-inhibitors-or)                                          |
| **Fitusiran (QFITLIA)**            | siRNA lowering antithrombin; SC at label-directed intervals | Age ≥12 years with haemophilia A or B, with or without inhibitors                                                  | Companion-diagnostic antithrombin activity, individualized dose/interval, thrombosis and gallbladder warnings, liver monitoring, and reduced breakthrough-treatment dosing. [FDA](https://www.fda.gov/news-events/press-announcements/fda-approves-novel-treatment-hemophilia-or-b-or-without-factor-inhibitors)      |
| **Marstacimab (HYMPAVZI)**         | Anti-TFPI monoclonal antibody; weekly SC                    | FDA label revised June 2026: adults and children aged ≥6 years with haemophilia A or B, with or without inhibitors | Age-specific loading/maintenance dose, thromboembolic risk, product-specific breakthrough plan, and pre-major-surgery interruption (the US label specifies at least 7 days). Do not give extra marstacimab to treat a bleed. [FDA label](https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/761369s003lbl.pdf) |

> **Do not generalize across non-factor products:** Emicizumab, concizumab, fitusiran, and marstacimab have different mechanisms, approved populations, monitoring, interaction risks, missed-dose rules, perioperative instructions, and breakthrough-bleed regimens. None is an interchangeable generic “non-factor” dose state.

### 4.3 Gene Therapy

Gene therapy is a one-time IV treatment intended to produce endogenous factor expression; it is neither routine factor prophylaxis nor a permanent cure. Eligibility is product- and jurisdiction-specific and requires assessment at an experienced comprehensive haemophilia centre.

- **Valoctocogene roxaparvovec-rvox (ROCTAVIAN):** AAV5-based gene therapy for selected adults with severe haemophilia A who meet the locally approved label, including anti-AAV5 testing where required. [FDA approval](https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapy-adults-severe-hemophilia)
- **Etranacogene dezaparvovec-drlb (HEMGENIX):** AAV5-based gene therapy for selected adults with haemophilia B meeting label-defined prior treatment/bleeding criteria. [FDA prescribing information](https://www.fda.gov/media/163467/download?attachment.Revised%3A11%2F2022=)
- **Fidanacogene elaparvovec-dzkt (BEQVEZ):** AAV-based gene therapy for selected adults with haemophilia B; consult current local regulatory status and label. [FDA approved cellular and gene therapy products](https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/approved-cellular-gene-therapy-products)

Before treatment, capture eligibility, liver assessment, neutralizing-antibody testing required by the label, inhibitor status, vector/product, baseline factor use and bleeding. After treatment, capture factor activity with assay method, liver tests, corticosteroid/immunosuppression exposure, bleeds, factor use, adverse events, and durability over time. Patients retain a haemophilia diagnosis and need an emergency plan even when factor expression is clinically protective. Long-term registries and regulator-mandated follow-up are essential; repeat dosing is generally not currently feasible.

> **Sources:** [WFH Guidelines 2020, Chapter 5, p. 68–77; Chapter 6, Table 6-2, p. 83; Chapter 8, p. 110–114; EMA / FDA Hemlibra Prescribing Information].

---

## 5. Types of On-Demand (Episodic) Medication

On-demand (termed **episodic** in the 3rd edition WFH guidelines) replacement therapy refers to the administration of hemostatic agents specifically at the time of an acute bleed to arrest haemorrhage.

The categories of on-demand medications include:

1. **Standard Half-Life (SHL) Factor VIII Concentrates (pdFVIII and rFVIII):** Lyophilized factor concentrates administered IV to treat acute bleeding in Haemophilia A.
2. **Extended/Ultra-Long-Half-Life FVIII Concentrates:** Used for acute bleeds according to product-specific label dosing and the individual plan.
3. **Standard Half-Life (SHL) Factor IX Concentrates:**
   - _Pure FIX concentrates (plasma-derived or recombinant):_ The treatment of choice for acute bleeds in Haemophilia B.
   - _Prothrombin Complex Concentrates (PCCs):_ Contain FII, FVII, FIX, and FX. They are rarely used for haemophilia B because of thrombogenic potential; pure FIX is preferred [WFH Rec 5.3.3].
4. **Extended Half-Life (EHL) Factor IX Concentrates:** Used for acute bleeds with product-specific dosing; repeat requirements vary by product, bleed, and response.
5. **Desmopressin (1-deamino-8-D-arginine vasopressin / DDAVP):** Synthetic vasopressin analog that triggers endogenous release of FVIII and VWF from endothelial Weibel-Palade bodies into plasma.
6. **Bypassing Agents (for inhibitor patients or acute refractory bleeds):**
   - _Recombinant activated Factor VII (rFVIIa / NovoSeven RT):_ Binds directly to activated platelets and tissue factor to activate FX independently of FVIII/FIX.
   - _Activated Prothrombin Complex Concentrate (aPCC / FEIBA):_ Contains activated FVII along with zymogens FII, FIX, FX.
7. **Recombinant Porcine Factor VIII (rpFVIII / susoctocog alfa / Obizur):** Recombinant B-domain deleted porcine sequence FVIII that does not cross-react with human anti-FVIII antibodies; licensed for Acquired Haemophilia A.
8. **Factor XI Replacement:** Plasma-derived FXI concentrate may be used for selected major bleeds or procedures where available; plasma is an alternative. FXI concentrate has important thrombotic risk and must **not** be co-administered with an antifibrinolytic.
9. **Blood Components (Contingency Therapies when CFCs are Unavailable):**
   - _Cryoprecipitate:_ Insoluble plasma fraction rich in FVIII (~70–80 IU/bag), VWF, fibrinogen, and FXIII. Used _only_ for Haemophilia A when CFCs are unavailable [WFH Rec 5.5.3]. (Does not contain FIX or FXI).
   - _Fresh Frozen Plasma (FFP):_ Contains all coagulation factors (~1 IU/mL of FVIII and FIX). Difficult to achieve FVIII >30 IU/dL or FIX >25 IU/dL without fluid overload. Reserved strictly for resource-constrained emergencies [WFH Rec 5.5.2].

> **Critical Distinction (WFH Section 5.7 & 6.5):** **Emicizumab (Hemlibra) is strictly a prophylactic agent and CANNOT be used on-demand to treat acute bleeding.** It cannot be titrated acutely to stop an active bleed.

> **Sources:** [WFH Guidelines 2020, Chapter 5: Hemostatic Agents, p. 66–78; Chapter 7: Treatment of Specific Hemorrhages, p. 90–98; Chapter 8: Inhibitors, p. 109–114].

---

## 6. On-Demand Medication Use by Haemophilia Type and Severity

Matching on-demand therapeutic agents to clinical phenotypes:

```
+----------------------------------------------------------------------------------------------------+
|                         ON-DEMAND MEDICATION SELECTION MATRIX                                      |
+----------------------+--------------------+--------------------------------------------------------+
| Haemophilia Type     | Severity           | First-Line On-Demand Agent                             |
+----------------------+--------------------+--------------------------------------------------------+
| Haemophilia A        | Severe (<1%)       | SHL or EHL FVIII Concentrate (IV)                      |
| (No Inhibitors)      | Moderate (1%–5%)   | SHL or EHL FVIII Concentrate (IV) (DDAVP if responder) |
|                      | Mild (5%–<40%)     | DDAVP (IV/SC/Nasal); FVIII Concentrate if major/unresp.|
+----------------------+--------------------+--------------------------------------------------------+
| Haemophilia B        | Severe (<1%)       | Pure SHL or EHL FIX Concentrate (IV)                   |
| (No Inhibitors)      | Moderate (1%–5%)   | Pure SHL or EHL FIX Concentrate (IV)                   |
|                      | Mild (5%–<40%)     | Pure SHL or EHL FIX Concentrate (IV)                   |
+----------------------+--------------------+--------------------------------------------------------+
| Haemophilia A        | Low-Responding     | High-Dose FVIII Concentrate (IV)                       |
| (With Inhibitors)    | (<5 BU)            | (Switch to rFVIIa or aPCC if unresponsive)             |
|                      | High-Responding    | rFVIIa (IV) OR aPCC (IV)                               |
|                      | (>=5 BU)           | (If on Emicizumab: rFVIIa STRONGLY PREFERRED)          |
+----------------------+--------------------+--------------------------------------------------------+
| Haemophilia B        | Low-Responding     | High-Dose FIX Concentrate (IV) (monitor anaphylaxis)   |
| (With Inhibitors)    | High-Responding    | rFVIIa (IV) (aPCC CONTRAINDICATED if FIX allergy)      |
+----------------------+--------------------+--------------------------------------------------------+
| Factor XI Deficiency | Any FXI level      | Site/history-based: TXA alone OR FXI replacement       |
+----------------------+--------------------+--------------------------------------------------------+
| Acquired Haemophilia | Active Bleed       | rFVIIa (IV) OR aPCC (IV) OR Porcine FVIII (Obizur)     |
+----------------------+--------------------+--------------------------------------------------------+
```

### Detailed Clinical Guidance by Subgroup:

1. **Haemophilia A without Inhibitors:**
   - _Severe (<1%) & Moderate (1%–5%):_ IV FVIII concentrate (SHL or EHL). Target peak level is dictated by bleed location (see Table 7-2 below).
   - _Mild (5%–<40%):_ **Desmopressin (DDAVP)** may be preferred for suitable minor bleeds and minor procedures in patients with a documented adequate FVIII response. It avoids factor exposure for that episode. If DDAVP is inadequate or contraindicated, or if major trauma/surgery occurs, use IV FVIII concentrate according to the HTC plan.

2. **Haemophilia B without Inhibitors:**
   - _All Severities (Severe, Moderate, Mild):_ **Pure FIX concentrate** (plasma-derived or recombinant). Prothrombin Complex Concentrates (PCCs) should be avoided due to thrombogenic risks [WFH Rec 5.3.3].
   - _Contraindication:_ **DDAVP is completely ineffective in Haemophilia B** because vasopressin does not stimulate FIX synthesis or release.

3. **Breakthrough Bleeding in Patients on Emicizumab Prophylaxis:**
   - _Without Inhibitors:_ Treat with standard doses of **IV FVIII concentrate**. FVIII will restore normal hemostasis additively with emicizumab without increased thrombotic risk [WFH Section 7.1, p. 90].
   - _With Inhibitors:_ Use **rFVIIa** preferentially, following the individualized bleed plan. Avoid aPCC where possible because of thrombotic microangiopathy and thromboembolism risk. If rFVIIa is unavailable or ineffective and aPCC is clinically unavoidable, WFH limits the initial aPCC dose to **≤50 U/kg** and the total to **≤100 U/kg/day**, with close monitoring [WFH Rec 5.7.1, 8.3.4, 8.3.8].

4. **Haemophilia A with Inhibitors (Not on Emicizumab):**
   - _Low-Responding Inhibitor (<5 BU):_ Specific FVIII concentrates can be used if an inhibitor-neutralizing loading dose produces measurable plasma FVIII levels [WFH Rec 8.3.2].
   - _High-Responding Inhibitor (≥5 BU):_ Bypassing agents: either **rFVIIa** (90–270 μg/kg) or **aPCC** (50–100 U/kg).

5. **Haemophilia B with Inhibitors:**
   - _Low-Responding Inhibitor:_ FIX concentrates can be attempted under emergency clinical supervision if no history of allergic reactions.
   - _High-Responding Inhibitor / Allergic History:_ **rFVIIa is preferred** [WFH Rec 8.4.4, 8.4.8]. **aPCC is contraindicated** in patients with a history of FIX allergy/anaphylaxis because it contains FIX antigen and may provoke anaphylaxis or nephrotic syndrome.

6. **Factor XI Deficiency:**
   - _Minor Mucocutaneous / Dental / Menorrhagia:_ **Antifibrinolytic monotherapy** (oral/IV tranexamic acid) is usually sufficient without factor replacement.
   - _Major Surgery / Trauma:_ Plan from the personal bleeding history, surgical site, age, cardiovascular/thrombotic risk, and local availability. Options include plasma-derived FXI concentrate or virally inactivated/solvent-detergent plasma. Use the lowest effective replacement exposure under specialist monitoring. **Do not add tranexamic acid or another antifibrinolytic when FXI concentrate is used.**

7. **Acquired Haemophilia A:**
   - First-line hemostatic therapy: Bypassing agents (**rFVIIa 90 μg/kg q2–3h** or **aPCC 50–100 U/kg q8–12h**) or recombinant porcine FVIII (**susoctocog alfa 200 IU/kg** initial dose). Accompanied immediately by immunosuppressive therapy (corticosteroids $\pm$ cyclophosphamide or rituximab) to eliminate the autoantibody.

> **Sources:** [WFH Guidelines 2020, Chapter 5, p. 66–77; Chapter 7, p. 90–98; Chapter 8, p. 104–115; Tiede A, et al. _Haematologica_ 2020].

---

## 7. Dosages, Routes of Administration, and Frequencies of On-Demand Medications

### 7.1 Dosage Calculation Formulas (WFH Section 5.3)

These are population estimates for unmodified SHL factor in a patient without an inhibitor. “Desired rise” means **target activity minus the current/baseline activity**. EHL/UHL products, children, people at weight extremes, and patients with altered recovery or clearance require product-specific and individualized calculations.

#### Factor VIII Concentrate Dosage (Haemophilia A):

$$\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Factor Rise (IU/dL)} \times 0.5$$

- _Rationale:_ In the absence of an inhibitor, each $1\text{ IU/kg}$ of FVIII infused raises plasma FVIII by approximately $2\text{ IU/dL}$ ($2\%$).
- _Example:_ For a $70\text{ kg}$ patient with a baseline near zero requiring a target level of $80\text{ IU/dL}$:
  $$\text{Dose} = 70 \times 80 \times 0.5 = 2800\text{ IU}$$
- _Infusion Route & Rate:_ Intravenous bolus infusion slowly over 3–5 minutes.
- _Dosing Frequency:_ SHL FVIII repeat dosing is commonly based on its approximately 12-hour half-life, measured response, and bleed target. EHL/UHL repeat intervals are product- and patient-specific; do not apply a generic 12–24-hour rule.

#### Factor IX Concentrate Dosage (Haemophilia B):

- **Plasma-Derived FIX (pdFIX):**
  $$\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Factor Rise (IU/dL)} \times 1.0$$
  _(Each $1\text{ IU/kg}$ of pdFIX raises plasma FIX by $\sim 1.0\text{ IU/dL}$)._
- **Unmodified Recombinant FIX (rFIX):**
  - Adults: $\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Rise} \div 0.8$ (or $\times 1.25$).
  - Children (<15 years): $\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Rise} \div 0.7$ (or $\times 1.43$).
- _Infusion Route & Rate:_ Intravenous bolus slowly over several minutes.
- _Dosing Frequency:_ SHL FIX repeat dosing is based on its approximately 18–24-hour half-life, measured response, and bleed target. EHL FIX repeat intervals are product- and patient-specific; do not apply a generic 24–48-hour rule.

#### Neutralizing Dose Formula for Low-Responding FVIII Inhibitors (<5 BU):

$$\text{Loading Dose (IU)} = \text{Body Weight (kg)} \times 80 \times [(1 - \text{Hematocrit}) \times \text{Inhibitor Titer (BU)}] + 50\text{ IU/kg (hemostatic surplus)}$$

- _Monitoring:_ Peak factor level must be measured 15–30 minutes post-infusion [WFH Section 8.3].

---

### 7.2 On-Demand Target Factor Levels and Treatment Duration (WFH Table 7-2)

WFH Table 7-2 reports ranges of **global practice patterns**. Its lower- and higher-dose columns are descriptive, not minimum-versus-optimal standards and not universal prescribing mandates. The HTC plan must choose product-specific doses, repeat intervals, monitoring, and duration from the bleed site and severity, patient response, recovery/PK, inhibitor status, and local resources.

| Type of Haemorrhage                                                                                                   | Target Peak Level: Haemophilia A (IU/dL)                                                                                                                  | Treatment Duration: Haemophilia A (Days)               | Target Peak Level: Haemophilia B (IU/dL)                                                                                                                 | Treatment Duration: Haemophilia B (Days)               | Clinical Management Remarks                                                                                                                                                                                                |
| :-------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :----------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Acute Joint Bleed (Hemarthrosis)**                                                                                  | • Low: **10–20**<br>• High: **40–60**                                                                                                                     | **1–2 days** (repeat if clinically indicated)          | • Low: **10–20**<br>• High: **40–60**                                                                                                                    | **1–2 days** (repeat if clinically indicated)          | Treat at earliest symptom. Reassess clinically; repeat only at the product-/plan-specific interval if symptoms persist.                                                                                                    |
| **Superficial Muscle Bleed** (No neurovascular compromise)                                                            | • Low: **10–20**<br>• High: **40–60**                                                                                                                     | **2–3 days**                                           | • Low: **10–20**<br>• High: **40–60**                                                                                                                    | **2–3 days**                                           | RICE/PRICE adjuncts. Monitor distal pulses and sensation.                                                                                                                                                                  |
| **Deep Muscle / Iliopsoas / Compartment Risk**<br>• _Initial Loading_<br>• _Maintenance_                              | <br>• Low: **20–40** / High: **80–100**<br>• Low: **10–20** / High: **30–60**                                                                             | <br>1–2 days<br>3–5 days (or longer)                   | <br>• Low: **15–30** / High: **60–80**<br>• Low: **10–20** / High: **30–60**                                                                             | <br>1–2 days<br>3–5 days (or longer)                   | High compartment syndrome risk. Measure compartment pressure. Fasciotomy if $\Delta P < 30\text{ mmHg}$ within 12h.                                                                                                        |
| **Central Nervous System / Intracranial (ICH)**<br>• _Initial Loading_<br>• _Maintenance_                             | <br>• Low: **50–80** / High: **80–100**<br>• Low: **20–40** / High: **50**                                                                                | <br>1–3 days (or 1–7 days)<br>8–14 days (or 8–21 days) | <br>• Low: **50–80** / High: **60–80**<br>• Low: **20–40** / High: **30**                                                                                | <br>1–3 days (or 1–7 days)<br>8–14 days (or 8–21 days) | **Medical emergency.** Give prescribed haemostatic treatment immediately, before CT/MRI. After ICH, consider secondary prophylaxis for 3–6 months; lifelong prophylaxis may be appropriate in selected high-risk patients. |
| **Throat and Neck Haemorrhage**<br>• _Initial Loading_<br>• _Maintenance_                                             | <br>• Low: **30–50** / High: **80–100**<br>• Low: **10–20** / High: **50**                                                                                | <br>1–3 days (or 1–7 days)<br>4–7 days (or 8–14 days)  | <br>• Low: **30–50** / High: **60–80**<br>• Low: **10–20** / High: **30**                                                                                | <br>1–3 days (or 1–7 days)<br>4–7 days (or 8–14 days)  | Airway emergency. Immediate factor infusion. ENT consultation. Maintain levels until airway stable.                                                                                                                        |
| **Gastrointestinal (GI) Bleed**<br>• _Initial Loading_<br>• _Maintenance_                                             | <br>• Low: **30–50** / High: **80–100**<br>• Low: **10–20** / High: **50**                                                                                | <br>1–3 days (or 7–14 days)<br>4–7 days                | <br>• Low: **30–50** / High: **60–80**<br>• Low: **10–20** / High: **30**                                                                                | <br>1–3 days (or 7–14 days)<br>4–7 days                | Hospitalize. Monitor Hb. Endoscopy investigation of choice. Adjunctive tranexamic acid.                                                                                                                                    |
| **Renal Haemorrhage (Hematuria)**                                                                                     | • Low: **20–40**<br>• High: **50**                                                                                                                        | **3–5 days**                                           | • Low: **15–30**<br>• High: **40**                                                                                                                       | **3–5 days**                                           | Complete bed rest, vigorous hydration ($3\text{ L/m}^2/\text{day}$). **ANTIFIBRINOLYTICS ARE CONTRAINDICATED.**                                                                                                            |
| **Deep Laceration**                                                                                                   | • Low: **20–40**<br>• High: **50**                                                                                                                        | **5–7 days**                                           | • Low: **15–30**<br>• High: **40**                                                                                                                       | **5–7 days**                                           | Raise factor before suturing. Factor coverage for suture removal.                                                                                                                                                          |
| **Major Surgery**<br>• _Pre-operative_<br>• _Post-op (Days 1–3)_<br>• _Post-op (Days 4–6)_<br>• _Post-op (Days 7–14)_ | <br>• Low: **60–80** / High: **80–100**<br>• Low: **30–40** / High: **60–80**<br>• Low: **20–30** / High: **40–60**<br>• Low: **10–20** / High: **30–50** | <br>Pre-op bolus<br>Days 1–3<br>Days 4–6<br>Days 7–14  | <br>• Low: **50–70** / High: **60–80**<br>• Low: **30–40** / High: **40–60**<br>• Low: **20–30** / High: **30–50**<br>• Low: **10–20** / High: **20–40** | <br>Pre-op bolus<br>Days 1–3<br>Days 4–6<br>Days 7–14  | Bolus or adjusted continuous infusion may be used by an experienced centre; continuous-infusion rate is individualized from clearance and frequent factor assays.                                                          |
| **Minor Surgery**<br>• _Pre-operative_<br>• _Post-operative_                                                          | <br>• Low: **40–80** / High: **50–80**<br>• Low: **20–50** / High: **30–80**                                                                              | <br>Pre-op<br>1–5 days                                 | <br>• Low: **40–80** / High: **50–80**<br>• Low: **20–50** / High: **30–80**                                                                             | <br>Pre-op<br>1–5 days                                 | Single pre-op dose often sufficient for dental extraction if antifibrinolytic rinse is co-administered.                                                                                                                    |

> **Sources:** [WFH Guidelines 2020, Chapter 7: Treatment of Specific Hemorrhages, Table 7-2, p. 97; Chapter 9, p. 126–130].

---

### 7.3 Specific On-Demand Dosing for Ancillary & Bypassing Products

#### 7.3.1 Desmopressin (DDAVP) (WFH Section 5.6)

- **Routes & Dosage:**
  - **Intravenous (IV):** **0.3 μg/kg** diluted in 50–100 mL physiological saline, infused slowly over **20 to 30 minutes**. Peak FVIII response occurs at **60 minutes**.
  - **Subcutaneous (SC):** **0.3 μg/kg** (using high-concentration 15 μg/mL formulation).
  - **Intranasal Spray (using 1.5 mg/mL Stimate / Octim formulation):**
    - Patients $\ge 40\text{ kg}$: **300 μg** (one 150 μg spray in each nostril).
    - Patients $<40\text{ kg}$: **150 μg** (one 150 μg spray in one nostril only).
  - High-concentration intranasal DDAVP availability varies. Do not substitute a standard low-concentration antidiuretic nasal spray; verify formulation strength and current local authorization.
- **Frequency & Duration Limits:**
  - Administer **no more than once every 24 hours** (rarely twice daily in adults in hospital settings).
  - **Maximum treatment duration: 3 consecutive days**. Repeated dosing causes tachyphylaxis (exhaustion of endothelial FVIII stores) and water retention / severe hyponatremia.
- **Safety Restrictions & Fluid Protocols:**
  - Restrict fluids after DDAVP to reduce water intoxication and hyponatraemia risk. The WFH's specific **75% of maintenance for 24 hours** instruction applies to young paediatric inpatients; other patients need age-, setting-, comorbidity-, and dose-appropriate instructions.
  - **Strictly contraindicated in children under 2 years of age** due to cerebral edema and hyponatremic seizures [WFH Rec 5.6.4].
  - Use with caution in uncontrolled hypertension and in patients with cardiovascular disease or thrombosis risk [WFH Rec 5.6.5]; apply any additional product-label contraindications.

#### 7.3.2 Recombinant Activated Factor VII (rFVIIa / NovoSeven RT) (WFH Section 8.3)

- **Route:** IV bolus over 2 to 5 minutes.
- **Dosage Options:**
  - _Standard Multi-Dose Regimen:_ **90 μg/kg** every **2 to 3 hours** until hemostatic control is achieved.
  - _Single High-Dose Regimen (Joint/Muscle Bleeds):_ **270 μg/kg** as a single bolus at onset.
- **Breakthrough bleeds on Emicizumab:** Initial dose is **90 μg/kg**; caution if the patient has underlying cardiovascular risk factors.

#### 7.3.3 Activated Prothrombin Complex Concentrate (aPCC / FEIBA) (WFH Section 8.3)

- **Route:** IV infusion ($\le 2\text{ U/kg/min}$).
- **Dosage:** **50–100 U/kg** every **8 to 12 hours** (typically 75–85 U/kg).
- **Maximum Daily Threshold:** Maximum single dose = **100 U/kg**; maximum 24-hour dose = **200 U/kg/day**.
- **Sequential Bypassing Therapy (Refractory Bleeds - WFH Table 8-4):** Alternating rFVIIa (90 μg/kg) and aPCC (50 U/kg) every 3 hours under expert tertiary care observation.

#### 7.3.4 Recombinant Porcine Factor VIII (rpFVIII / susoctocog alfa / Obizur)

- **Route:** IV bolus.
- **Dosage:** Initial loading dose of **200 IU/kg**. Maintenance doses administered every **4 to 12 hours** titrated to maintain target trough FVIII:C $>50\%$.

> **Sources:** [WFH Guidelines 2020, Chapter 5, p. 74–77; Chapter 7, p. 90–98; Chapter 8, p. 110–115; EMA / FDA Product Inserts].

---

## 8. Other Medications Outside Prophylactic and On-Demand Factor Therapies

These encompass adjunctive hemostatics, analgesics, vaccines, bone health modulators, and local wound management agents:

### 8.1 Antifibrinolytic Agents (WFH Section 5.6, Rec 5.6.6–5.6.8)

Competitively inhibit plasminogen activation to plasmin, preventing clot lysis. Highly effective for mucosal bleeds (oral, epistaxis, GI, menorrhagia) and dental extractions:

- **Tranexamic Acid (TXA):**
  - _Oral Dosage:_ **25 mg/kg per dose**, administered **3 to 4 times daily** (typically 1000–1500 mg q6–8h in adults).
  - _Intravenous Dosage:_ **10 mg/kg per dose**, administered **2 to 3 times daily** (slow IV infusion; rapid injection causes dizziness/hypotension).
  - _Topical Rinse:_ 5% oral rinse (swish 10 mL for 2 minutes and spit q6h) or crushed tablet dissolved in clean water applied directly on mucosal bleeding lesions.
  - _Post-Dental Duration:_ Prescribed for **7 consecutive days** post-extraction.
  - _Renal Impairment:_ Dose must be reduced according to creatinine clearance to prevent neurotoxicity.
  - _CONTRAINDICATION 1:_ **Upper urinary tract bleeding / hematuria.** Inhibits clot lysis in the ureter, creating insoluble fibrin clots, acute ureteral obstruction, hydronephrosis, and permanent renal failure [WFH Rec 5.6.7].
  - _CONTRAINDICATION 2:_ **Haemophilia B treated with prothrombin complex concentrate (PCC)**, because of thromboembolism risk [WFH Rec 5.6.6]. WFH permits TXA with standard doses of CFCs and bypassing agents such as aPCC or rFVIIa; combination therapy still requires the specialist plan. This PCC rule is distinct from the emicizumab+aPCC warning and the FXI-concentrate+antifibrinolytic warning.
  - _CONTRAINDICATION 3:_ Thoracic surgery, where insoluble haematomas may form.
- **Epsilon Aminocaproic Acid (EACA):**
  - _Adult Dose:_ **100 mg/kg per dose** orally (max 2 g/dose) or IV (max 4 g/dose) every **4 to 6 hours** (maximum daily limit: **24 g/day**).
  - _Adverse Effects:_ Gastrointestinal distress; rare painful **myopathy** with elevated creatine kinase and myoglobinuria after several weeks of continuous therapy.

### 8.2 Pain Management & Analgesics (WFH Section 2.6, Table 2-4, Rec 2.6.1–2.6.9)

Haemophilia patients suffer acute bleed pain and chronic arthropathy pain. The WFH establishes a structured 3-step analgesic ladder:

| Severity Tier             | Recommended Analgesic Regimen                                                                                                                                                               | Contraindications & Clinical Precautions                                                                                                                                                                                                 |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Step 1: Mild Pain**     | **Paracetamol / Acetaminophen:**<br>• Adults: 500–1000 mg every 4–6 hours (max 4 g/day).<br>• Children: 10–15 mg/kg every 4–6 hours (max 60 mg/kg/day).                                     | First-line choice. Safe on gastrointestinal mucosa and platelets. Monitor hepatic function in hepatitis C/B.                                                                                                                             |
| **Step 2: Moderate Pain** | 1. **Selective COX-2 inhibitor:** e.g. celecoxib, when appropriate.<br>2. **Weak opioid combinations:** paracetamol with codeine or tramadol where age-appropriate and locally recommended. | COX-2 inhibitors have less platelet effect than non-selective NSAIDs but retain gastrointestinal, renal, and cardiovascular risks; use the lowest effective dose for the shortest duration. Follow local paediatric opioid restrictions. |
| **Step 3: Severe Pain**   | **Strong Opioids:**<br>• Morphine: Slow-release formulation with immediate-release rescue product.<br>• Oxycodone, Hydromorphone, Fentanyl.                                                 | Prescribe under pain specialist guidance. Avoid long-term addiction. Manage constipation and sedation.                                                                                                                                   |
| **Procedural Pain**       | **Topical Local Anesthetics:**<br>• EMLA cream (lidocaine 2.5% + prilocaine 2.5%) applied under occlusive dressing 60 min before venipuncture or port access.                               | Eliminates injection anxiety and pain, especially in pediatric patients.                                                                                                                                                                 |

> [!CAUTION]
> **AVOID ASPIRIN AND NON-SELECTIVE NSAIDs**
> Aspirin and non-selective NSAIDs impair platelet function and/or add gastrointestinal bleeding risk. WFH advises avoiding them in people with haemophilia; if any antiplatelet or anti-inflammatory therapy is clinically necessary, it requires individualized specialist risk assessment.

> [!WARNING]
> **AVOID THE INTRAMUSCULAR ROUTE FOR ANALGESIA**
> WFH advises that intramuscular analgesic injection is not appropriate because it can cause a muscle haematoma. Use an effective non-IM route [WFH Rec 2.6.5].

### 8.3 Topical and Local Hemostatic Agents (WFH Section 7.8)

- **Fibrin Sealants (e.g. Tisseel, Evicel):** Dual-component human fibrinogen and thrombin applied topically to provide instant localized fibrin cross-linking. Highly effective in dental extraction sockets and skin ulcers.
- **Topical Thrombin:** Applied locally via gelatin sponges (Gelfoam) or oxidized cellulose (Surgicel) for local capillary ooze.
- **Topical Adrenaline / Epinephrine:** Gauze soaked in 1:1000 adrenaline applied with firm local compression to mucosal bleed sites (mouth, nose) for vasoconstriction.

### 8.4 Vaccinations & Immunization Protocols (WFH Section 9.4, Rec 9.4.1–9.4.4)

- **Recommended Vaccines:** People with haemophilia should receive routine immunizations. WFH specifically recommends hepatitis A and B vaccination for those receiving plasma-derived products; local schedules may recommend these more broadly.
- **Route:** WFH 2020 prefers the **subcutaneous** route where it is as safe and effective as IM. Current MASAC advice is to follow each vaccine's approved route and schedule, because SC administration can reduce immunogenicity for some vaccines.
- **If IM is Used:** WFH advises a **25- to 27-gauge** needle, an ice pack for **5 minutes before**, and firm pressure for **at least 10 minutes** without rubbing. Whether pre-dose haemostatic treatment is needed depends on baseline factor level, current prophylaxis/non-factor therapy, vaccine route, and the individualized HTC plan—not technique alone.
- **Immunocompromised Patients:** Live-vaccine decisions depend on the cause and degree of immunosuppression and current immunization guidance.

> **Sources:** [WFH Guidelines 2020, Section 9.4]; [MASAC Document 278—administration of vaccines to individuals with bleeding disorders](https://www.bleeding.org/healthcare-professionals/guidelines-on-care/masac-documents/masac-document-278-masac-recommendations-on-administration-of-vaccines-to-individuals-with-bleeding-disorders).

### 8.5 Bone Health and Joint Adjuncts (WFH Chapter 10)

- **Calcium and Vitamin D:** Encourage adequate dietary intake and weight-bearing activity as clinically feasible. Assess bone health and use supplementation or osteoporosis medication when deficiency, osteopenia/osteoporosis, or another clinical risk indication is demonstrated; do not prescribe supplements universally.
- **Intra-articular Corticosteroids / Hyaluronic Acid:** Injected under factor coverage for chronic inflammatory hemophilic synovitis to reduce synovial hypertrophy.
- **Chemical / Radioisotope Synovectomy Agents:** Intra-articular injection of radioisotopes (Yttrium-90, Rhenium-186, Phosphorus-32) or chemical sclerosants (rifampicin) to ablate chronic hypervascularized synovium and eliminate target joints.

### 8.6 Gastrointestinal Protection

- **Proton Pump Inhibitors (PPIs) / $H_2$-Receptor Antagonists:** Omeprazole, pantoprazole, famotidine; prescribed during GI bleeding, post-GI bleed recovery, or when selective COX-2 inhibitors are co-administered in patients with peptic history.

---

## 9. Specific Guidelines on What to Do During an Active Bleed

### 9.1 The Fundamental Golden Rule: "Treat First, Investigate Later"

- **Immediate treatment:** Follow the individual's emergency plan and give the prescribed factor concentrate or bypassing agent promptly—ideally at the earliest recognized symptom and within 2 hours when home treatment is available [WFH Sections 7.1–7.2]. A patient on a non-factor prophylactic therapy still needs a separate product-specific breakthrough-bleed plan.
- **Do not delay emergency haemostasis:** For suspected life- or limb-threatening bleeding, give the prescribed haemostatic treatment before imaging or laboratory confirmation, then investigate urgently. WFH does not specify a quantitative harm increment for each 30-minute delay.

### 9.2 The First-Aid Framework: PRICE vs. POLICE (WFH Section 7.2, Rec 7.2.6)

In addition to immediate factor infusion, manage acute joint/muscle bleeds using:

- **P (Protection):** Splint or sling the affected joint/limb in a position of comfort (typically semi-flexion) to prevent inadvertent strain or re-injury.
- **R / OL (Rest / Optimal Loading):** Complete initial rest for acute pain. Once pain begins to subside, transition to **POLICE (Protection, Optimal Loading, Ice, Compression, Elevation)**—introduce gentle, pain-free active mobilization to prevent muscle atrophy and joint stiffness.
- **I (Ice):** Apply cold packs wrapped in a towel (never direct bare-skin contact) for **15–20 minutes every 4 to 6 hours**. Restricts swelling and provides analgesia. Limit total continuous ice duration to $<6\text{ hours}$ to prevent paradoxical impairment of local enzymatic coagulation.
- **C (Compression):** Apply an elastic bandage (e.g. Ace wrap) with mild, uniform pressure to reduce intra-articular capillary effusion. _Caution: Monitor distal pulse and capillary refill to prevent neurovascular compression._
- **E (Elevation):** Elevate the affected limb above the level of the heart to encourage lymphatic drainage and venous return.
- **Weight Bearing:** Avoid weight bearing during a painful lower-limb joint bleed. WFH notes that this may be necessary for up to a week in severe bleeds; resume progressively with rehabilitation guidance as symptoms and function improve [WFH Rec 7.2.7].

---

### 9.3 Action Protocols by Bleed Site and Severity

#### 9.3.1 Acute Joint Bleed (Hemarthrosis)

1. **Mild / Moderate Joint Bleed:**
   - Infuse FVIII (target peak **10–20 to 40–60 IU/dL**) or FIX (target peak **10–20 to 40–60 IU/dL**) immediately.
   - Apply PRICE/splint.
   - Re-evaluate at 6–12 hours: If significant improvement occurs within 8 hours, single dose may suffice. If bleeding symptoms continue, repeat infusion at 12 hours (FVIII) or 24 hours (FIX).
   - Initiate physical therapy under factor coverage as soon as pain subsides [WFH Rec 7.2.9].
2. **Severe Joint Bleed:**
   - Immediate IV factor infusion (target peak **40–60 IU/dL**). Continue daily/alternate-day infusions for 1–3 days until complete resolution.
   - **Arthrocentesis (Joint Aspiration):** Not performed routinely. Consider only for:
     1. A tense, painful haemarthrosis that has not improved within 24 hours of adequate haemostatic treatment.
     2. Suspicion of septic arthritis.
     - _Required conditions:_ Perform under sterile conditions with factor levels maintained at **30–50 IU/dL for 48–72 hours** [WFH Rec 7.2.11].

#### 9.3.2 Muscle Bleeds & Suspected Compartment Syndrome

1. **Superficial Muscle:** Factor replacement (peak **10–20 to 40–60 IU/dL**) for 2–3 days plus rest and cold compression.
2. **Deep Muscle Groups (Iliopsoas, Calf, Forearm):**
   - High risk of femoral nerve palsy, posterior tibial nerve injury, or Volkmann's contracture.
   - Infuse factor immediately: initial target **80–100 IU/dL** (FVIII) or **60–80 IU/dL** (FIX) for 1–2 days, then maintenance **30–60 IU/dL** for 3–5 days or longer [WFH Table 7-2].
   - Strict bed rest for iliopsoas bleeds (avoid crutch ambulation which contracts the psoas). Confirm with ultrasound or CT.
3. **Compartment Syndrome Emergency:**
   - Continuous monitoring of the 5 Ps: Pain (out of proportion), Pallor, Paresthesia, Pulselessness, Paralysis.
   - Direct intracompartmental pressure measurement.
   - If compartment syndrome is confirmed, obtain urgent surgical management, including fasciotomy when indicated, under adequate haemostatic coverage [WFH Rec 10.4.3]. Do not hard-code a single pressure threshold or 12-hour deadline as a haemophilia-specific rule.

#### 9.3.3 Life-Threatening Bleeds: Central Nervous System / Intracranial Bleed (ICH)

1. Treat ANY head injury, persistent severe headache, unexplained vomiting, or altered mental status as a presumptive ICH.
2. Give the patient's prescribed emergency haemostatic treatment **immediately and before CT or MRI** [WFH Rec 7.3.1]. For factor replacement, WFH Table 7-2 reports the initial practice ranges shown in Section 7.2.
3. Urgent hospitalization and emergent CT/MRI scan.
4. Maintain factor levels $\ge 50\text{ IU/dL}$ for **10 to 14 days** (up to 21 days in severe trauma).
5. After resolution, consider secondary prophylaxis for **3 to 6 months**; lifelong prophylaxis may be appropriate for selected patients at high recurrence risk [WFH Rec 6.6.1, 7.3.2].

#### 9.3.4 Life-Threatening Bleeds: Throat, Neck & Pharyngeal Bleeds

1. **Emergency Airway Threat:** Swelling from tonsillitis, dental work, or coughing can occlude the airway.
2. Elevate head slightly.
3. Infuse factor immediately (target peak **80–100 IU/dL** FVIII, **60–80 IU/dL** FIX).
4. Immediate emergency otolaryngology (ENT) consultation; prepare for endotracheal intubation or surgical tracheostomy under factor coverage if airway is compromised.
5. Maintain factor levels for **8 to 14 days** until tissue swelling resolves completely [WFH Table 7-2]. Co-administer tranexamic acid and antibiotics if infection triggered the bleed.

#### 9.3.5 Gastrointestinal (GI) Haemorrhage

1. Hospitalize immediately.
2. Infuse factor to achieve peak **80–100 IU/dL** (FVIII) or **60–80 IU/dL** (FIX). Maintain trough $>50\text{ IU/dL}$ for 7–14 days.
3. Co-administer IV/oral tranexamic acid (25 mg/kg q8h) [WFH Rec 7.5.2].
4. Perform urgent endoscopy to identify and coagulate bleeding lesions. Check blood counts and cross-match blood if severe anemia/shock develops.

#### 9.3.6 Renal Haemorrhage (Hematuria)

1. Treat all renal/urinary tract bleeding as urgent, identify the source, contact the HTC, and give prescribed factor replacement promptly [WFH Rec 7.6.1]. Recurrent or persistent haematuria requires urological assessment, including exclusion of malignancy where relevant.
2. Prescribe bed rest and adequate hydration until bleeding stops. WFH describes **$3.0\text{ L/m}^2/\text{day}$ for up to 48 hours** for mild painless haematuria, but not when renal or cardiac impairment makes this unsafe; avoid DDAVP during intensive hydration.
3. Watch for flank pain, clots, urinary obstruction, renal function deterioration, and haemodynamic compromise.
4. **Do not administer antifibrinolytics (TXA/EACA)** because of obstructive uropathy risk [WFH Rec 7.6.3].

#### 9.3.7 Epistaxis and Oral Bleeding

1. **Epistaxis:**
   - Sit upright with head tilted slightly forward (prevent swallowing of blood into stomach).
   - Apply firm, continuous pressure to the soft anterior part of the nose for **5–10 minutes** with the head forward.
   - Apply topical gauze soaked in tranexamic acid.
   - Avoid nasal packing where possible because insertion and removal can injure the mucosa and cause rebleeding [WFH Rec 7.9.2].
   - If severe/persistent, infuse factor (target peak 20–40 IU/dL).
2. **Oral Bleeding:**
   - Bite down firmly on a damp gauze swab for 20–30 minutes.
   - Administer oral tranexamic acid rinse / tablets for 5–7 days.
   - Topical application of adrenaline 1:1000 or fibrin glue.

#### 9.3.8 Active Bleed in Patients with Inhibitors

- **Low-Responding (<5 BU):** Infuse neutralizing high-dose FVIII/FIX.
- **High-Responding (≥5 BU) NOT on Emicizumab:** Infuse rFVIIa (90 μg/kg q2–3h) OR aPCC (50–100 U/kg q8–12h).
- **High-Responding ON Emicizumab Prophylaxis:**
  - First-line: **rFVIIa 90 μg/kg IV**.
  - Avoid aPCC where possible. If rFVIIa is ineffective or unavailable and aPCC is unavoidable, use only under the WFH dose limits and close clinical monitoring described in Section 6.

#### 9.3.9 Other Urgent or Easily Missed Sites

- **Eye/ophthalmic bleeding or trauma:** Give haemostatic treatment promptly and obtain urgent ophthalmology assessment because vision may be threatened.
- **Significant abdominal, retroperitoneal, pelvic, or deep soft-tissue bleeding:** Treat promptly and investigate in hospital; apparent external bruising may underestimate blood loss.
- **Deep laceration or penetrating injury:** Give haemostatic treatment before invasive exploration or suturing where feasible, and maintain coverage according to the HTC plan.
- **Any uncertain emergency:** Use the patient's emergency treatment card/plan, contact the HTC, and do not let the app calculate a novel regimen from generic factor targets.

> **Sources:** [WFH Guidelines 2020, Chapter 7: Treatment of Specific Hemorrhages, p. 90–98; Chapter 8, p. 110–115; Chapter 10, p. 145–148].

---

## 10. Guidelines on Resuming Prophylaxis After On-Demand Treatment for a Bleed

WFH does **not** specify universal post-bleed waiting periods such as 24 hours for SHL FVIII, 36–48 hours for SHL FIX, 48–72 hours for EHL FVIII, or 7–10 days for EHL FIX. It also does not establish a universal rule that a bleed dose automatically replaces that day's prophylaxis. Those earlier fixed rules have therefore been removed.

### 10.1 Factor-Replacement Prophylaxis

After an episodic dose or multi-dose bleed course, the next prophylaxis dose must follow the patient's written HTC plan. The decision depends on the exact product, time and amount of the last dose, prescribed prophylaxis interval, bleed control, planned rehabilitation/activity, individual recovery/half-life, measured levels when needed, and thrombosis or accumulation risk. The app may show both scheduled and administered doses, but must not independently cancel, duplicate, delay, or calculate the next dose.

### 10.2 Non-Factor Prophylaxis

- **Emicizumab:** A breakthrough bleed is treated with a separate prescribed haemostatic agent; emicizumab is not an acute-bleed treatment. It is generally continued on schedule, but the app must allow a clinician-directed hold or reschedule and must enforce the emicizumab/aPCC warning.
- **Concizumab, fitusiran, and marstacimab:** Do not copy the emicizumab rule. Each has label-specific missed-dose, interruption, surgery, thrombosis, monitoring, and breakthrough-treatment instructions. Fitusiran in particular changes permitted breakthrough-agent doses; marstacimab's US label includes a pre-major-surgery pause. The current local label and HTC plan control.
- **Gene therapy:** Breakthrough factor use does not “restart” gene therapy. Record the bleed, factor dose, measured expression, and clinical review; persistent or changing bleeding may signal loss/insufficiency of expression or another cause.

### 10.3 Review After Breakthrough Bleeding

A single bleed does not automatically mandate switching products or escalating prophylaxis. Review the bleed diagnosis/site, timing against prophylaxis, adherence and administration technique, activity/trauma, joint or structural pathology, product and dose, response to treatment, and patient goals. For factor therapy, consider recovery, trough/PK, and an inhibitor assay when response is unexpectedly poor. Recurrent spontaneous or joint bleeding warrants HTC reassessment and individualized modification; rehabilitation may require additional haemostatic coverage, but there is no universal 1–2-week intensified regimen.

### 10.4 Bleed-Episode Data Definition

For standardized outcome reporting, bleeding at the same site within **72 hours after stopping treatment** is generally recorded as continuation/recurrence of the original episode; after more than 72 hours it is recorded as a new bleed. This is a **data-classification convention**, not an instruction to dose, withhold prophylaxis, or delay clinical assessment.

> **Sources:** [WFH Guidelines 2020, Chapters 6–8]; Blanchette VS, et al. ISTH SSC definitions, _J Thromb Haemost_ 2014; [MASAC Document 268—emicizumab](https://www.bleeding.org/healthcare-professionals/guidelines-on-care/masac-documents/masac-document-268-recommendation-on-the-use-and-management-of-emicizumab-kxwh-hemlibrar-for-hemophilia-a-with-and-without-inhibitors); current product labels cited in Section 4.2.

---

## 11. Laboratory Monitoring and Inhibitors

### 11.1 Inhibitor Definitions and Screening

- WFH classifies an established inhibitor as **low responding <5 BU** or **high responding ≥5 BU**. A positive Nijmegen-modified Bethesda result is generally **>0.6 BU/mL for FVIII** and **≥0.3 BU/mL for FIX**, interpreted with the clinical and laboratory context.
- During factor exposure, WFH recommends inhibitor screening every **6–12 months and then annually**, and additionally after intensive exposure (more than 5 consecutive exposure days within 4 weeks), before surgery, and when clinical or laboratory response is inadequate.
- For an unexpected loss of response, record exposure days, recovery, half-life where measured, assay method, inhibitor titre and date, historical peak titre, anamnestic response, and allergic/nephrotic reactions—especially in haemophilia B.

### 11.2 Assay Interference and Product-Aware Testing

- **Emicizumab shortens the aPTT** and makes aPTT-based one-stage FVIII activity and Bethesda assays misleading. Use an appropriate **bovine-reagent chromogenic FVIII assay** to measure endogenous/infused FVIII activity or FVIII inhibitors in the presence of emicizumab.
- EHL/UHL factor products can show reagent-dependent one-stage or chromogenic assay discrepancies. Store the product, assay type, reagent/laboratory, sampling time, and last dose with every result.
- Bypassing agents and rebalancing therapies are not monitored by applying a generic FVIII/FIX percentage. Use the therapy-specific label, validated assay/biomarker, and specialist interpretation; for fitusiran this includes antithrombin activity using the approved companion diagnostic.

### 11.3 Immune Tolerance Induction (ITI)

For haemophilia A with a persistent FVIII inhibitor, ITI remains the established strategy to eradicate the inhibitor and restore FVIII responsiveness. Emicizumab prevents bleeding but does not eradicate the inhibitor. Track ITI product, dose/schedule, start date, inhibitor titres, FVIII recovery and half-life, interruptions, adherence, outcome, and concurrent prophylaxis. Haemophilia B ITI is less successful and carries important anaphylaxis and nephrotic-syndrome risks; it requires specialist-centre management.

> **Source:** WFH Guidelines 2020, Chapters 3, 5 and 8.

---

## 12. HackitRx Clinical Safety and Source Governance

### 12.1 Minimum Treatment-Plan Model

Do not infer a treatment plan from diagnosis and body weight alone. The minimum clinician-verified record should include:

- diagnosis, severity factor level and bleeding phenotype; inhibitor status and history;
- country/jurisdiction, product brand and molecule, route, indication, age eligibility, dose units, schedule and treatment phase;
- separate prophylaxis, breakthrough-bleed, perioperative, missed-dose, and emergency instructions;
- contraindicated or restricted combinations (especially emicizumab+aPCC, FXI concentrate+antifibrinolytic, antifibrinolytic+upper urinary tract bleeding, and FIX-containing products in relevant FIX allergy);
- product-specific monitoring, assay warnings, prescribing HTC, plan version, approval date, and review/expiry date.

### 12.2 Decision-Support Guardrails

1. **No autonomous prescribing:** Calculators may reproduce a clinician-approved formula but must not create a regimen from WFH practice ranges.
2. **No generic decay for non-factor therapy:** A FVIII/FIX percentage curve is not valid for emicizumab, anti-TFPI therapy, fitusiran, bypassing agents, or gene therapy.
3. **Hard-stop interaction alerts:** Present urgent, unmissable warnings for dangerous combinations while allowing documented expert-centre exceptions where guidance permits them.
4. **Emergency-first design:** Suspected head/CNS, airway/throat, eye, GI/abdominal, iliopsoas/deep muscle, compartment, or major traumatic bleeding should surface the patient's emergency plan and HTC/emergency contact before calculators.
5. **Auditability:** Preserve the user-entered event, clinician-authored instruction used, product label/guideline version, any override, and who authorized it.

### 12.3 Source Hierarchy and Maintenance

Use WFH 2020 for the core haemophilia A/B framework. For information absent from WFH 2020, use current regulator labels and later authoritative WFH, ISTH, MASAC, UKHCDO, or peer-reviewed consensus guidance. Regulatory approval is jurisdiction-specific and does not by itself establish comparative preference. Every web-derived rule must carry its source URL, jurisdiction, document/label revision date, date accessed, and a scheduled review date. A WFH shared-decision-making update notes that additional therapies and resources are now live, underscoring the need for versioned rather than static treatment options: [WFH update, 2025](https://wfh.org/article/wfh-sdm-tool-additional-treatments-and-updated-resources-now-live/).

---

## Complete Bibliographic Citations

1. **[WFH 2020]** Srivastava A, Santagostino E, Dougall A, Kitchen S, Sutherland M, Pipe SW, Carcao M, Mahlangu J, Ragni MV, Windyga J, Llinás A, Goddard NJ, Mohan R, Poonnoose PM, Feldman BM, Lewis SZ, van den Berg HM, Pierce GF; WFH Guidelines for the Management of Hemophilia panelists and co-authors. WFH Guidelines for the Management of Hemophilia, 3rd edition. _Haemophilia_. 2020;26(Suppl 6):1–158. DOI: [10.1111/hae.14046](https://doi.org/10.1111/hae.14046).
2. **[ISTH Definitions]** Blanchette VS, Key NS, Ljung LR, Manco-Johnson MJ, van den Berg HM, Srivastava A; Subcommittee on Factor VIII, Factor IX and Rare Coagulation Disorders. Definitions in hemophilia: communication from the SSC of the ISTH. _J Thromb Haemost_. 2014;12(11):1935–1939.
3. **[MASAC Prophylaxis]** Medical and Scientific Advisory Council (MASAC), National Bleeding Disorders Foundation. [MASAC Document 267: Recommendation Concerning Prophylaxis for Hemophilia A and B with and without Inhibitors](https://www.bleeding.org/healthcare-professionals/guidelines-on-care/masac-documents/masac-document-267-masac-recommendation-concerning-prophylaxis-for-hemophilia-a-and-b-with-and-without-inhibitors). Accessed 12 September 2026.
4. **[UKHCDO Guidelines]** Rayment R, Chalmers E, Forsyth K, et al. Guidelines on the management of acute bleeds and surgery in patients with haemophilia and other inherited bleeding disorders: a guideline from the United Kingdom Haemophilia Centre Doctors' Organisation (UKHCDO). _Haemophilia_. 2020;26(6):944–964.
5. **[Emicizumab Prophylaxis Trials]** Mahlangu J, Oldenburg J, Paz-Priel I, et al. Emicizumab prophylaxis in patients who have hemophilia A without inhibitors (HAVEN 3). _N Engl J Med_. 2018;379(9):811–822.
6. **[Emicizumab Inhibitor Trials]** Oldenburg J, Mahlangu JN, Kim B, et al. Emicizumab prophylaxis in hemophilia A with inhibitors (HAVEN 1). _N Engl J Med_. 2017;377(9):809–818.
7. **[Acquired Haemophilia A]** Tiede A, Collins P, Knoebl P, et al. [International recommendations on the diagnosis and treatment of acquired hemophilia A](https://haematologica.org/article/view/9931). _Haematologica_. 2020;105(7):1791–1801.
8. **[Factor XI Deficiency]** Bolton-Maggs PHB. [Treatment of Hemophilia No. 16: Factor XI Deficiency and Its Management](https://www1.wfh.org/publications/files/pdf-1141.pdf). World Federation of Hemophilia; 2008. Accessed 12 September 2026.
9. **[Women and Girls Nomenclature]** van Galen KPM, d'Oiron R, James P, et al. [A new hemophilia carrier nomenclature to define hemophilia in women and girls](https://pmc.ncbi.nlm.nih.gov/articles/PMC8361713/). _J Thromb Haemost_. 2021;19:1883–1887.
10. **[MASAC Emicizumab]** MASAC. [Document 268: Use and Management of Emicizumab](https://www.bleeding.org/healthcare-professionals/guidelines-on-care/masac-documents/masac-document-268-recommendation-on-the-use-and-management-of-emicizumab-kxwh-hemlibrar-for-hemophilia-a-with-and-without-inhibitors). Accessed 12 September 2026.
11. **[MASAC Vaccination]** MASAC. [Document 278: Administration of Vaccines to Individuals with Bleeding Disorders](https://www.bleeding.org/healthcare-professionals/guidelines-on-care/masac-documents/masac-document-278-masac-recommendations-on-administration-of-vaccines-to-individuals-with-bleeding-disorders). Accessed 12 September 2026.
12. **[ALTUVIIIO]** US Food and Drug Administration. [ALTUVIIIO](https://www.fda.gov/vaccines-blood-biologics/altuviiio). Accessed 12 September 2026.
13. **[ALHEMO]** US Food and Drug Administration. [FDA approves concizumab-mtci for haemophilia with inhibitors](https://www.fda.gov/drugs/news-events-human-drugs/fda-approves-drug-prevent-or-reduce-frequency-bleeding-episodes-patients-hemophilia-inhibitors-or). Accessed 12 September 2026.
14. **[QFITLIA]** US Food and Drug Administration. [FDA approves fitusiran for haemophilia A or B with or without inhibitors](https://www.fda.gov/news-events/press-announcements/fda-approves-novel-treatment-hemophilia-or-b-or-without-factor-inhibitors). 28 March 2025. Accessed 12 September 2026.
15. **[HYMPAVZI]** US Food and Drug Administration. [Marstacimab-hncq prescribing information](https://www.accessdata.fda.gov/drugsatfda_docs/label/2026/761369s003lbl.pdf). Revised June 2026. Accessed 12 September 2026.
16. **[ROCTAVIAN]** US Food and Drug Administration. [FDA approves valoctocogene roxaparvovec for adults with severe haemophilia A](https://www.fda.gov/news-events/press-announcements/fda-approves-first-gene-therapy-adults-severe-hemophilia). Accessed 12 September 2026.
17. **[HEMGENIX]** US Food and Drug Administration. [Etranacogene dezaparvovec-drlb prescribing information](https://www.fda.gov/media/163467/download). Accessed 12 September 2026.
18. **[Approved Gene Therapies]** US Food and Drug Administration. [Approved Cellular and Gene Therapy Products](https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/approved-cellular-gene-therapy-products). Accessed 12 September 2026.
19. **[WFH Shared Decision-Making Update]** World Federation of Hemophilia. [Additional treatments and updated resources now live](https://wfh.org/article/wfh-sdm-tool-additional-treatments-and-updated-resources-now-live/). 2025. Accessed 12 September 2026.
20. **[Hemlibra FDA Label]** Genentech, Inc. HEMLIBRA® (emicizumab-kxwh) injection prescribing information.
21. **[NovoSeven Prescribing Information]** Novo Nordisk Inc. NovoSeven® RT (coagulation factor VIIa, recombinant) prescribing information.
22. **[FEIBA Prescribing Information]** Takeda. FEIBA (anti-inhibitor coagulant complex) prescribing information.

---

> **Developer Action Required:** Review this clinical summary before integrating factor kinetics, dose-logging schemas, and bleeding triage rules into the HackitRx codebase.
