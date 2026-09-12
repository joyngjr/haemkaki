# Medical Summary: Comprehensive Clinical Domain Guide to Haemophilia Management

> **Status:** Completed domain expert review  
> **Issuing Skill:** `hackitrx-domain-expert`  
> **Target Audience:** HackitRx Development Team & Clinical Reviewers  
> **Primary Source:** *WFH Guidelines for the Management of Hemophilia, 3rd edition* (Srivastava A, Santagostino E, Dougall A, et al. *Haemophilia*. 2020;26(Suppl 6):1–158. DOI: 10.1111/hae.14046) [`WFH_guidelines.md`]  
> **Secondary / External Sources:** International Society on Thrombosis and Haemostasis (ISTH), Medical and Scientific Advisory Council (MASAC) of the National Bleeding Disorders Foundation (NBDF), United Kingdom Haemophilia Centre Doctors' Organisation (UKHCDO), European Medicines Agency (EMA), and US FDA Prescribing Information.

---

## Executive Overview for HackitRx

Haemophilia is a group of rare congenital or acquired bleeding disorders caused by a deficiency or dysfunction of specific coagulation factors. In the context of **HackitRx**—a factor-tracking and patient empowerment mobile web application—precise domain logic is essential. Understanding the distinct types of haemophilia, their clinical severity strata, the pharmacokinetics of standard versus extended half-life factor concentrates, non-factor substitution therapies (e.g. emicizumab), bypassing agents, acute bleed triage, and resumption schedules after on-demand dosing directly informs core data models (such as `FactorType`, `DoseState`, `StockState`, half-life decay modeling, and dose logging routines).

---

## 1. Types of Haemophilia

Coagulation disorders bearing the name "haemophilia" are classified based on the specific clotting factor affected and the genetic or immunological etiology:

### 1.1 Haemophilia A (Classic Haemophilia)
* **Deficiency:** Coagulation Factor VIII (FVIII).
* **Genetics & Inheritance:** X-linked recessive disorder caused by pathogenic variants in the *F8* gene located on the long arm of the X chromosome ($Xq28$).
* **Epidemiology:** Represents **80%–85%** of all congenital haemophilia cases.
  * Estimated global prevalence: 17.1 cases per 100,000 males across all severities (6.0 per 100,000 males for severe).
  * Estimated birth prevalence: 24.6 cases per 100,000 live male births (9.5 per 100,000 for severe).
  * Spontaneous mutations: Approximately 30% of newly diagnosed cases occur without a prior family history due to *de novo* spontaneous variants.
* **Sources:** [WFH Guidelines 2020, Chapter 2: Comprehensive Care of Hemophilia, p. 21–22; Chapter 4: Genetic Assessment, p. 55–60].

### 1.2 Haemophilia B (Christmas Disease)
* **Deficiency:** Coagulation Factor IX (FIX).
* **Genetics & Inheritance:** X-linked recessive disorder caused by mutations in the *F9* gene located on the X chromosome ($Xq27$).
* **Epidemiology:** Accounts for **15%–20%** of all congenital haemophilia cases.
  * Estimated global prevalence: 3.8 cases per 100,000 males across all severities (1.1 per 100,000 males for severe).
  * Estimated birth prevalence: 5.0 cases per 100,000 live male births (1.5 per 100,000 for severe).
* **Sources:** [WFH Guidelines 2020, Chapter 2: Comprehensive Care of Hemophilia, p. 21–22; Chapter 4: Genetic Assessment, p. 55–60].

### 1.3 Haemophilia C (Rosenthal Syndrome / Factor XI Deficiency)
* **Deficiency:** Coagulation Factor XI (FXI).
* **Genetics & Inheritance:** Autosomal recessive disorder caused by pathogenic variants in the *F11* gene on chromosome $4q35$. Unlike Haemophilia A and B, it affects **males and females equally**.
* **Epidemiology:** Rare in the general global population (~1 in 100,000), but has a high frequency among individuals of Ashkenazi Jewish ancestry (carrier rate ~8%–9%, disease prevalence ~0.1%–0.2%).
* **Clinical Distinction:** Unlike Haemophilia A and B, spontaneous joint and muscle bleeds (hemarthroses/hematomas) are rare. Bleeding is predominantly injury-related or surgical, especially in tissues rich in endogenous fibrinolytic activity (oral mucosa, nasopharynx, tonsils, urinary tract, uterus).
* **Sources:** [WFH Guidelines 2020, Abbreviations / Appendix FXI, p. 158; WFH Monograph on Factor XI Deficiency (Bolton-Maggs); Orphanet ORPHA:397; ISTH Rare Bleeding Disorders Registry].

### 1.4 Acquired Haemophilia (Primarily Acquired Haemophilia A [AHA])
* **Etiology:** Non-congenital, autoimmune bleeding disorder caused by the development of autoantibodies (inhibitors) against endogenous clotting factors (most frequently against Factor VIII; rare cases against FIX or FXI).
* **Demographics:** Rare (incidence 1.5–4 per million persons/year), typically presenting in older adults (>65 years) or women in the post-partum period (within 1–6 months after delivery). Often associated with autoimmune diseases (rheumatoid arthritis, SLE), solid or hematological malignancies, or medications, but idiopathic in ~50% of cases.
* **Clinical Manifestations:** Unlike congenital severe haemophilia where >80% of bleeds are hemarthroses, acquired haemophilia typically presents with extensive, life-threatening subcutaneous, deep muscle, mucosal, retroperitoneal, and gastrointestinal haemorrhages, while hemarthroses are distinctly uncommon.
* **Sources:** [WFH Guidelines 2020, Chapter 5, p. 72; Chapter 8, p. 109–112; Kruse-Jarres R, et al. *Haemophilia* 2017; Collins P, et al. *Blood* 2012].

### 1.5 Symptomatic Female Carriers of Haemophilia A and B
* **Pathophysiology:** Female carriers possess one mutated *F8* or *F9* allele. Due to skewed X-chromosome inactivation (extreme lyonization), Turner syndrome (45,X), or compound heterozygosity, baseline factor levels may drop below 40 IU/dL (<40%).
* **Classification:** Classified and treated according to the identical clinical severity criteria as affected males. Carriers with factor levels <40% are clinically diagnosed as having mild, moderate, or (rarely) severe haemophilia.
* **Sources:** [WFH Guidelines 2020, Chapter 2, p. 22; Chapter 9: Specific Management Issues – Carriers, p. 121–125].

---

## 2. Severity Classification for Each Type of Haemophilia

The clinical severity of congenital haemophilia is defined by the residual circulating clotting factor activity in plasma measured via one-stage clotting or chromogenic substrate assays.

### 2.1 Congenital Haemophilia A & B Severity (WFH Standardized Classification)

Derived directly from WFH Table 2-1:

| Severity Level | Clotting Factor Level (FVIII or FIX) | Clinical Bleeding Profile |
| :--- | :--- | :--- |
| **Severe** | **<1 IU/dL** (<0.01 IU/mL) or **<1% of normal** | Frequent spontaneous bleeding episodes, predominantly into joints (hemarthrosis) and deep muscles, in the complete absence of identifiable trauma or hemostatic challenge. Early onset (typically before age 2). |
| **Moderate** | **1–5 IU/dL** (0.01–0.05 IU/mL) or **1%–5% of normal** | Occasional spontaneous bleeding; prolonged and severe bleeding with minor trauma, injury, or minor surgical/dental procedures. May develop a severe bleeding phenotype if joint damage occurs. |
| **Mild** | **5–40 IU/dL** (0.05–0.40 IU/mL) or **5%–<40% of normal** | Rare spontaneous bleeding; severe, abnormal, prolonged bleeding following major trauma, deep injury, or surgical/dental interventions. Often undiagnosed until adult trauma or surgery. |
| *Normal Reference* | *50–150 IU/dL (0.50–1.50 IU/mL) or 50%–150%* | Normal physiological coagulation parameters. |

> **Clinical Phenotype Note (WFH Recommendation 6.1.1):** While baseline factor levels guide classification, clinical bleeding phenotype varies. Some patients with *moderate* haemophilia exhibit a *severe bleeding phenotype* (frequent joint bleeds, arthropathy risk) and require identical prophylactic management to severe patients.
>
> **Sources:** [WFH Guidelines 2020, Chapter 2: Comprehensive Care of Hemophilia, Table 2-1, p. 22; Blanchette VS et al., ISTH SSC Communication, *J Thromb Haemost* 2014;12:1935–1939].

### 2.2 Haemophilia C (Factor XI Deficiency) Severity Classification

Unlike Haemophilia A and B, **plasma FXI activity does NOT correlate reliably with bleeding severity**:

| Severity Stratum | Plasma FXI Activity Level | Bleeding Manifestations & Clinical Notes |
| :--- | :--- | :--- |
| **Severe Deficiency** | **<15–20 IU/dL** (<15%–20%) | Homozygotes or compound heterozygotes. Bleeding after trauma or surgeries involving tissues with high local fibrinolytic activity (mouth, tonsils, nose, prostate, uterus). Spontaneous joint bleeds remain extremely rare. |
| **Partial / Mild Deficiency** | **20–70 IU/dL** (20%–70%) | Heterozygotes. Often completely asymptomatic throughout life, though some individuals may still experience excessive post-traumatic or post-operative hemorrhage. |

> **Sources:** [WFH Monograph: *Management of Factor XI Deficiency*, Bolton-Maggs PHB; ISTH SSC Registry on Rare Coagulation Disorders; Peyvandi F, et al. *Haemophilia* 2012;18:148–153].

### 2.3 Acquired Haemophilia Severity Classification

Acquired Haemophilia A does not use congenital percentage strata (<1%, 1–5%, 5–40%). Instead, it is stratified by:
1. **Bethesda Inhibitor Titer:** Low-titer (<5 Bethesda Units [BU]/mL) versus High-titer (≥5 BU/mL).
2. **Clinical Severity of Bleeding:**
   * **Life-threatening / Major:** Intracranial, retroperitoneal, intra-abdominal, gastrointestinal, or extensive deep intramuscular bleed with compartment syndrome or hemodynamic instability.
   * **Moderate / Non-life-threatening:** Extensive subcutaneous ecchymoses, superficial muscular hematomas, epistaxis, or mild mucosal bleeding without hemodynamic instability.
> **Sources:** [Kruse-Jarres R, et al. *Haemophilia* 2017;23(5):677–691; Tiede A, et al. *Haematologica* 2020; Collins P, et al. *Blood* 2012].

---

## 3. Types of Prophylactic Medication & Indications by Type and Severity

Prophylaxis is defined by the WFH as: *"the regular administration of a hemostatic agent/agents with the goal of preventing bleeding in people with hemophilia while allowing them to lead active lives and achieve quality of life comparable to non-hemophilic individuals"* [WFH Rec 6.11].

### 3.1 Prophylaxis Timing Tiers (WFH Table 6-1)
* **Primary Prophylaxis:** Regular continuous prophylaxis started in the absence of documented joint disease (by examination/imaging) and **before the second clinically evident joint bleed and before 3 years of age**.
* **Secondary Prophylaxis:** Regular continuous prophylaxis initiated **after 2 or more joint bleeds** but prior to the onset of documented joint disease (usually $\ge 3$ years of age).
* **Tertiary Prophylaxis:** Regular continuous prophylaxis initiated **after the onset of documented joint disease** (often commenced in adolescence or adulthood to retard arthropathy progression).

### 3.2 Medication Classes Used for Prophylaxis
1. **Standard Half-Life (SHL) Factor VIII Concentrates (plasma-derived or recombinant):** pdFVIII, rFVIII (octocog alfa, moroctocog alfa, turoctocog alfa).
2. **Extended Half-Life (EHL) Factor VIII Concentrates:** Recombinant Fc fusion (efmoroctocog alfa), PEGylated (damoctocog alfa pegol, rurioctocog alfa pegol), or single-chain (lonoctocog alfa).
3. **Standard Half-Life (SHL) Factor IX Concentrates (plasma-derived or recombinant):** Pure pdFIX, rFIX (nonacog alfa).
4. **Extended Half-Life (EHL) Factor IX Concentrates:** Recombinant Fc fusion (eftrenonacog alfa), Albumin fusion (albutrepenonacog alfa), or GlycoPEGylated (nonacog beta pegol).
5. **Non-Factor Replacement / Substitution Therapy (Emicizumab):** Humanized bispecific monoclonal antibody bridging FIXa and FX to mimic activated FVIII cofactor function.
6. **Bypassing Agents (for patients with high-responding inhibitors):**
   * Recombinant activated Factor VII (rFVIIa, eptacog alfa / NovoSeven RT).
   * Activated Prothrombin Complex Concentrate (aPCC / FEIBA).
7. **Emerging Non-Factor Therapies (in clinical trials / recent approvals):**
   * Fitusiran: siRNA suppressing antithrombin synthesis.
   * Concizumab / Marstacimab: Anti-tissue factor pathway inhibitor (anti-TFPI) monoclonal antibodies.

### 3.3 Which Haemophilia Types and Severities Use Which Prophylactic Medication?

| Haemophilia Type & Inhibitor Status | Severity Level | Recommended Prophylactic Medication | Clinical Guideline Notes |
| :--- | :--- | :--- | :--- |
| **Haemophilia A (Without Inhibitors)** | **Severe (<1%)** | **First-line Options:**<br>1. **Emicizumab** (SC)<br>2. **EHL FVIII Concentrates** (IV)<br>3. **SHL FVIII Concentrates** (IV) | Regular lifelong prophylaxis is the mandatory standard of care [WFH Rec 6.1.1, 6.2.1]. Emicizumab or EHL products reduce infusion frequency and CVAD requirement. |
| **Haemophilia A (Without Inhibitors)** | **Moderate (1%–5%)** | Prophylaxis indicated **if displaying severe bleeding phenotype** (joint bleeds, target joint, trauma-prone). Choice: Emicizumab, EHL FVIII, or SHL FVIII. | Patients with true moderate phenotype without joint bleeding may be maintained on on-demand episodic therapy [WFH Rec 6.1.1]. |
| **Haemophilia A (Without Inhibitors)** | **Mild (5%–<40%)** | Routine prophylaxis is **NOT recommended**. Short-term prophylaxis (pre-operative or during intensive physical rehabilitation) using FVIII or DDAVP may be applied. | Spontaneous bleeding is rare; routine daily/weekly prophylaxis is unwarranted [WFH Chapter 2, Table 2-1]. |
| **Haemophilia A (With Inhibitors)** | **All Severities (Severe, Moderate, Mild)** | **Preferred:** **Emicizumab** (SC) [WFH Rec 8.3.5, 8.3.11].<br>**Alternative (if emicizumab unavailable):** Bypassing agents: **aPCC** (FEIBA) IV or **rFVIIa** (NovoSeven) IV. | Emicizumab is strongly preferred over bypassing agents for inhibitor prophylaxis due to subcutaneous route, superior bleed reduction, and lack of inhibitor neutralization [WFH Rec 8.3.11]. |
| **Haemophilia B (Without Inhibitors)** | **Severe (<1%)** | **First-line Options:**<br>1. **EHL FIX Concentrates** (IV)<br>2. **SHL Pure FIX Concentrates** (IV) | Lifelong regular prophylaxis is standard of care [WFH Rec 6.1.1, 6.4.1]. EHL FIX allows dramatic interval extensions (every 7–14 days). Emicizumab is NOT effective in Haemophilia B. |
| **Haemophilia B (Without Inhibitors)** | **Moderate (1%–5%)** | Prophylaxis indicated **if exhibiting severe bleeding phenotype**. Choice: EHL FIX or pure SHL FIX. | Same principles as Moderate Haemophilia A. |
| **Haemophilia B (Without Inhibitors)** | **Mild (5%–<40%)** | Routine prophylaxis **NOT indicated**. Pure FIX concentrate used on-demand. | Infrequent bleeding; on-demand treatment sufficient. |
| **Haemophilia B (With Inhibitors)** | **All Severities** | **Bypassing Agent Prophylaxis:**<br>• **rFVIIa** (NovoSeven) IV [WFH Rec 8.4.8].<br>• **aPCC** (FEIBA) IV *ONLY if NO history of FIX allergy/anaphylaxis*. | *Caution:* aPCC contains trace FIX; strictly contraindicated if patient has an allergic or anaphylactic history to FIX [WFH Rec 8.4.4, 8.4.5]. |
| **Haemophilia C (FXI Deficiency)** | **Severe (<15–20%) or Mild** | Routine long-term prophylaxis is **NOT indicated**. Short-term prophylaxis (pre-operative) with tranexamic acid $\pm$ FXI concentrate or SD-FFP is used. | Spontaneous hemarthrosis does not occur; long-term factor prophylaxis is contraindicated due to thrombotic risks associated with repeated FXI infusions. |

> **Sources:** [WFH Guidelines 2020, Chapter 5: Hemostatic Agents, p. 68–78; Chapter 6: Prophylaxis in Hemophilia, p. 81–89; Chapter 8: Inhibitors to Clotting Factor, p. 104–114].

---

## 4. Prophylactic Dosages, Routes of Administration, and Frequencies

Quantitative dosing parameters from WFH Table 6-2, Chapter 5, and Chapter 8:

```
+---------------------------------------------------------------------------------------------------+
|                                 PROPHYLACTIC REGIMENS SUMMARY                                     |
+------------------------------------+-------+--------------------+---------------------------------+
| Therapeutic Agent                  | Route | Typical Dose       | Frequency                       |
+------------------------------------+-------+--------------------+---------------------------------+
| SHL FVIII (High-Dose)              | IV    | 25–40 IU/kg        | Every 2 days or 3x per week     |
| SHL FVIII (Intermediate-Dose)      | IV    | 15–25 IU/kg        | 3 days per week                 |
| SHL FVIII (Low-Dose)               | IV    | 10–15 IU/kg        | 2–3 days per week               |
| EHL FVIII                          | IV    | 25–50 IU/kg        | Twice weekly or every 3–5 days  |
| SHL FIX (High-Dose)                | IV    | 40–60 IU/kg        | Twice per week                  |
| SHL FIX (Intermediate-Dose)        | IV    | 20–40 IU/kg        | Twice per week                  |
| SHL FIX (Low-Dose)                 | IV    | 10–15 IU/kg        | 2 days per week                 |
| EHL FIX                            | IV    | 30–50 to 100 IU/kg | Once every 7 to 14 days         |
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
* **Route:** Intravenous (IV) slow bolus over 3–5 minutes.
* **Pharmacokinetics:** In vivo recovery: 1 IU/kg IV raises plasma FVIII by **~2 IU/dL** ($0.02\text{ IU/mL}$). Half-life ($t_{1/2}$): **~12 hours** in adults (shorter in young children, ~8–10 hours).
* **Dosing Schedules:**
  * **High-dose:** 25–40 IU/kg every 2 days or 3 times per week (annual factor consumption: >4000 IU/kg/year).
  * **Intermediate-dose:** 15–25 IU/kg 3 days per week (1500–4000 IU/kg/year).
  * **Low-dose:** 10–15 IU/kg 2–3 days per week (1000–1500 IU/kg/year; used in resource-constrained environments).
  * **Frequency-Escalated Primary Prophylaxis (Canadian / Dutch Protocol):** Starts at 10–15 IU/kg or 50 IU/kg **once weekly** in infants/young toddlers to establish venous access and avoid CVADs, escalating to twice weekly, and subsequently alternate-day dosing if breakthrough bleeds occur.
  * **Infusion Timing:** Morning administration is recommended to align peak factor levels with daytime physical activity [WFH Section 6.3].

#### 4.1.2 Extended Half-Life (EHL) Factor VIII Prophylaxis
* **Route:** Intravenous (IV).
* **Pharmacokinetics:** Modest half-life extension (**1.4- to 1.6-fold**, $t_{1/2} \approx 19\text{ hours}$). Recovery is identical to SHL FVIII (~2 IU/dL per IU/kg).
* **Dosage & Frequency:**
  * **Dose:** 25–50 IU/kg.
  * **Frequency:** **Twice weekly** or **every 3 to 5 days** (e.g., every 72–96 hours).
  * **Clinical Benefit:** Reduces annual venipunctures from ~150 to ~100 while maintaining equivalent or higher trough levels (>3%–5%) [WFH Section 6.4].

#### 4.1.3 Standard Half-Life (SHL) Factor IX Prophylaxis (WFH Table 6-2)
* **Route:** Intravenous (IV).
* **Pharmacokinetics:** Half-life ($t_{1/2}$): **~18–24 hours**.
  * *Plasma-derived FIX (pdFIX):* 1 IU/kg raises plasma FIX by **~1.0 IU/dL**.
  * *Recombinant FIX (rFIX, non-modified):* Lower in vivo recovery; 1 IU/kg raises plasma FIX by **~0.8 IU/dL** in adults and **~0.7 IU/dL** in children <15 years. (Requires calculating dose as $\text{Desired Level} \times \text{Weight} \div 0.8$ for adults or $\div 0.7$ for children).
* **Dosing Schedules:**
  * **High-dose:** 40–60 IU/kg twice per week (>4000 IU/kg/year).
  * **Intermediate-dose:** 20–40 IU/kg twice per week (2000–4000 IU/kg/year).
  * **Low-dose:** 10–15 IU/kg 2 days per week (1000–1500 IU/kg/year).

#### 4.1.4 Extended Half-Life (EHL) Factor IX Prophylaxis
* **Route:** Intravenous (IV).
* **Pharmacokinetics:** Substantial half-life extension (**3- to 5-fold longer**, $t_{1/2} \approx 80\text{ to }120+\text{ hours}$). Certain products exhibit higher recovery due to limited extravascular distribution.
* **Dosage & Frequency:**
  * **Dose:** 30–50 IU/kg (for Fc-fusion / albumin-fusion) or 40–100 IU/kg (for glycoPEGylated FIX).
  * **Frequency:** **Once every 7 days, every 10 days, or every 14 days** (some patients achieve troughs >5%–10% with every-14-day or every-21-day infusions) [WFH Section 5.3, 6.4].

#### 4.1.5 Emicizumab (Hemlibra) Prophylaxis (WFH Rec 5.7.1, 8.3.5)
* **Route:** Subcutaneous (SC) injection into abdomen, thigh, or upper outer arm.
* **Indications:** Congenital Haemophilia A of all severities (severe, or moderate with severe bleeding phenotype), **with or without FVIII inhibitors**.
* **Dosing Regimen:**
  * **Loading / Induction Phase:** **3.0 mg/kg once weekly for the first 4 weeks** (Days 1, 8, 15, 22).
  * **Maintenance Phase (Commencing Week 5):**
    * *Option A (Weekly):* **1.5 mg/kg once weekly**.
    * *Option B (Every 2 weeks):* **3.0 mg/kg once every 2 weeks**.
    * *Option C (Every 4 weeks):* **6.0 mg/kg once every 4 weeks**.
  * *Pharmacokinetic Profile:* Terminal half-life is ~28–30 days. Steady-state therapeutic levels are reached by week 4–5, producing constant hemostatic efficacy equivalent to ~15% FVIII activity without sinusoidal peaks and troughs.

#### 4.1.6 Prophylaxis in Inhibitor Patients Using Bypassing Agents
* **Activated Prothrombin Complex Concentrate (aPCC / FEIBA):**
  * **Route:** IV infusion (rate $\le 2\text{ U/kg/min}$).
  * **Dose:** **50–100 U/kg** every other day or 3 days per week.
  * **Maximum Limits:** Maximum single dose = **100 U/kg**; maximum daily dose = **200 U/kg/day** (to avoid thrombosis and DIC).
* **Recombinant Activated Factor VII (rFVIIa / NovoSeven RT):**
  * **Route:** IV bolus over 2–5 minutes.
  * **Dose:** **90–100 μg/kg** once daily, or up to **270 μg/kg** once daily (less effective than emicizumab due to ultra-short $t_{1/2} \approx 2.3\text{ hours}$).

> **Sources:** [WFH Guidelines 2020, Chapter 5, p. 68–77; Chapter 6, Table 6-2, p. 83; Chapter 8, p. 110–114; EMA / FDA Hemlibra Prescribing Information].

---

## 5. Types of On-Demand (Episodic) Medication

On-demand (termed **episodic** in the 3rd edition WFH guidelines) replacement therapy refers to the administration of hemostatic agents specifically at the time of an acute bleed to arrest haemorrhage.

The categories of on-demand medications include:

1. **Standard Half-Life (SHL) Factor VIII Concentrates (pdFVIII and rFVIII):** Lyophilized factor concentrates administered IV to treat acute bleeding in Haemophilia A.
2. **Extended Half-Life (EHL) Factor VIII Concentrates:** Used for acute bleeds; over 90% of bleeds resolve with a single infusion.
3. **Standard Half-Life (SHL) Factor IX Concentrates:**
   * *Pure FIX concentrates (plasma-derived or recombinant):* The treatment of choice for acute bleeds in Haemophilia B.
   * *Prothrombin Complex Concentrates (PCCs):* Contains FII, FVII, FIX, FX. Rarely used today due to thrombogenic potential; pure FIX is strictly preferred [WFH Rec 5.3.3].
4. **Extended Half-Life (EHL) Factor IX Concentrates:** Highly effective for acute bleeds; requires fewer repeat infusions due to prolonged residence time.
5. **Desmopressin (1-deamino-8-D-arginine vasopressin / DDAVP):** Synthetic vasopressin analog that triggers endogenous release of FVIII and VWF from endothelial Weibel-Palade bodies into plasma.
6. **Bypassing Agents (for inhibitor patients or acute refractory bleeds):**
   * *Recombinant activated Factor VII (rFVIIa / NovoSeven RT):* Binds directly to activated platelets and tissue factor to activate FX independently of FVIII/FIX.
   * *Activated Prothrombin Complex Concentrate (aPCC / FEIBA):* Contains activated FVII along with zymogens FII, FIX, FX.
7. **Recombinant Porcine Factor VIII (rpFVIII / susoctocog alfa / Obizur):** Recombinant B-domain deleted porcine sequence FVIII that does not cross-react with human anti-FVIII antibodies; licensed for Acquired Haemophilia A.
8. **Factor XI Concentrates (pdFXI, e.g. Hemoleven):** Specific virally inactivated plasma-derived concentrate for acute major bleeding or surgical coverage in Haemophilia C.
9. **Blood Components (Contingency Therapies when CFCs are Unavailable):**
   * *Cryoprecipitate:* Insoluble plasma fraction rich in FVIII (~70–80 IU/bag), VWF, fibrinogen, and FXIII. Used *only* for Haemophilia A when CFCs are unavailable [WFH Rec 5.5.3]. (Does not contain FIX or FXI).
   * *Fresh Frozen Plasma (FFP):* Contains all coagulation factors (~1 IU/mL of FVIII and FIX). Difficult to achieve FVIII >30 IU/dL or FIX >25 IU/dL without fluid overload. Reserved strictly for resource-constrained emergencies [WFH Rec 5.5.2].

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
| Haemophilia C (FXI)  | Severe or Mild     | Tranexamic Acid (minor); FXI Conc. / SD-FFP (major)    |
+----------------------+--------------------+--------------------------------------------------------+
| Acquired Haemophilia | Active Bleed       | rFVIIa (IV) OR aPCC (IV) OR Porcine FVIII (Obizur)     |
+----------------------+--------------------+--------------------------------------------------------+
```

### Detailed Clinical Guidance by Subgroup:

1. **Haemophilia A without Inhibitors:**
   * *Severe (<1%) & Moderate (1%–5%):* IV FVIII concentrate (SHL or EHL). Target peak level is dictated by bleed location (see Table 7-2 below).
   * *Mild (5%–<40%):* **Desmopressin (DDAVP)** is the treatment of choice for mild bleeds and minor surgery in patients with documented responsive FVIII increments (typically 3- to 6-fold baseline rise). It avoids CFC cost and eliminates the risk of alloantibody inhibitor formation [WFH Rec 5.6.1]. If DDAVP is inadequate, contraindicated (e.g. age <2, uncontrolled hypertension), or if major trauma/surgery occurs, use IV FVIII concentrate.

2. **Haemophilia B without Inhibitors:**
   * *All Severities (Severe, Moderate, Mild):* **Pure FIX concentrate** (plasma-derived or recombinant). Prothrombin Complex Concentrates (PCCs) should be avoided due to thrombogenic risks [WFH Rec 5.3.3].
   * *Contraindication:* **DDAVP is completely ineffective in Haemophilia B** because vasopressin does not stimulate FIX synthesis or release.

3. **Breakthrough Bleeding in Patients on Emicizumab Prophylaxis:**
   * *Without Inhibitors:* Treat with standard doses of **IV FVIII concentrate**. FVIII will restore normal hemostasis additively with emicizumab without increased thrombotic risk [WFH Section 7.1, p. 90].
   * *With Inhibitors:* Treat with **rFVIIa (recombinant Factor VIIa)** at standard initial doses (90 μg/kg). **aPCC (FEIBA) MUST BE AVOIDED** or used with extreme caution ($\le 50\text{ U/kg}$, max $100\text{ U/kg/day}$) due to black-box warnings of fatal thrombotic microangiopathy (TMA) and venous/arterial thromboembolism [WFH Rec 5.7.1, 8.3.4, 8.3.8].

4. **Haemophilia A with Inhibitors (Not on Emicizumab):**
   * *Low-Responding Inhibitor (<5 BU):* Specific FVIII concentrates can be used if an inhibitor-neutralizing loading dose produces measurable plasma FVIII levels [WFH Rec 8.3.2].
   * *High-Responding Inhibitor (≥5 BU):* Bypassing agents: either **rFVIIa** (90–270 μg/kg) or **aPCC** (50–100 U/kg).

5. **Haemophilia B with Inhibitors:**
   * *Low-Responding Inhibitor:* FIX concentrates can be attempted under emergency clinical supervision if no history of allergic reactions.
   * *High-Responding Inhibitor / Allergic History:* **rFVIIa is the mandatory first-line agent** [WFH Rec 8.4.4, 8.4.8]. **aPCC is contraindicated** in patients with a history of FIX allergy/anaphylaxis because aPCC contains FIX antigen which can provoke life-threatening anaphylaxis or nephrotic syndrome.

6. **Haemophilia C (Factor XI Deficiency):**
   * *Minor Mucocutaneous / Dental / Menorrhagia:* **Antifibrinolytic monotherapy** (oral/IV tranexamic acid) is usually sufficient without factor replacement.
   * *Major Surgery / Trauma:* Plasma-derived FXI concentrate (target FXI 30–45 IU/dL). If unavailable, virally inactivated/solvent-detergent FFP (15–20 mL/kg). Antifibrinolytics are added as adjunctive therapy.

7. **Acquired Haemophilia A:**
   * First-line hemostatic therapy: Bypassing agents (**rFVIIa 90 μg/kg q2–3h** or **aPCC 50–100 U/kg q8–12h**) or recombinant porcine FVIII (**susoctocog alfa 200 IU/kg** initial dose). Accompanied immediately by immunosuppressive therapy (corticosteroids $\pm$ cyclophosphamide or rituximab) to eliminate the autoantibody.

> **Sources:** [WFH Guidelines 2020, Chapter 5, p. 66–77; Chapter 7, p. 90–98; Chapter 8, p. 104–115; Tiede A, et al. *Haematologica* 2020].

---

## 7. Dosages, Routes of Administration, and Frequencies of On-Demand Medications

### 7.1 Dosage Calculation Formulas (WFH Section 5.3)

#### Factor VIII Concentrate Dosage (Haemophilia A):
$$\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Factor Rise (IU/dL)} \times 0.5$$
* *Rationale:* In the absence of an inhibitor, each $1\text{ IU/kg}$ of FVIII infused raises plasma FVIII by approximately $2\text{ IU/dL}$ ($2\%$).
* *Example:* For a $70\text{ kg}$ patient requiring a target level of $80\text{ IU/dL}$:
  $$\text{Dose} = 70 \times 80 \times 0.5 = 2800\text{ IU}$$
* *Infusion Route & Rate:* Intravenous bolus infusion slowly over 3–5 minutes.
* *Dosing Frequency:* SHL FVIII has a half-life of ~12 hours. Repeat doses are administered every **8 to 12 hours** to maintain target trough levels. For EHL FVIII, repeat doses are given every **12 to 24 hours**.

#### Factor IX Concentrate Dosage (Haemophilia B):
* **Plasma-Derived FIX (pdFIX):**
  $$\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Factor Rise (IU/dL)} \times 1.0$$
  *(Each $1\text{ IU/kg}$ of pdFIX raises plasma FIX by $\sim 1.0\text{ IU/dL}$).*
* **Unmodified Recombinant FIX (rFIX):**
  * Adults: $\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Rise} \div 0.8$ (or $\times 1.25$).
  * Children (<15 years): $\text{Dose (IU)} = \text{Body Weight (kg)} \times \text{Desired Rise} \div 0.7$ (or $\times 1.43$).
* *Infusion Route & Rate:* Intravenous bolus slowly over several minutes.
* *Dosing Frequency:* SHL FIX has a half-life of ~18–24 hours. Repeat doses are administered every **18 to 24 hours**. For EHL FIX, repeat doses are given every **24 to 48 hours**.

#### Neutralizing Dose Formula for Low-Responding FVIII Inhibitors (<5 BU):
$$\text{Loading Dose (IU)} = \text{Body Weight (kg)} \times 80 \times [(1 - \text{Hematocrit}) \times \text{Inhibitor Titer (BU)}] + 50\text{ IU/kg (hemostatic surplus)}$$
* *Monitoring:* Peak factor level must be measured 15–30 minutes post-infusion [WFH Section 8.3].

---

### 7.2 On-Demand Target Factor Levels and Treatment Duration (WFH Table 7-2)

The World Federation of Hemophilia defines global practice patterns (reflecting resource availability). Lower-dose patterns represent minimum thresholds in resource-limited systems, whereas higher-dose patterns reflect optimal hemostatic control in well-resourced centres:

| Type of Haemorrhage | Target Peak Level: Haemophilia A (IU/dL) | Treatment Duration: Haemophilia A (Days) | Target Peak Level: Haemophilia B (IU/dL) | Treatment Duration: Haemophilia B (Days) | Clinical Management Remarks |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Acute Joint Bleed (Hemarthrosis)** | • Low: **10–20**<br>• High: **40–60** | **1–2 days** (repeat if clinically indicated) | • Low: **10–20**<br>• High: **40–60** | **1–2 days** (repeat if clinically indicated) | Infuse at earliest "aura" / sensation. Repeat dose after 12h (FVIII) or 24h (FIX) if pain/swelling persists. |
| **Superficial Muscle Bleed** (No neurovascular compromise) | • Low: **10–20**<br>• High: **40–60** | **2–3 days** | • Low: **10–20**<br>• High: **40–60** | **2–3 days** | RICE/PRICE adjuncts. Monitor distal pulses and sensation. |
| **Deep Muscle / Iliopsoas / Compartment Risk**<br>• *Initial Loading*<br>• *Maintenance* | <br>• Low: **20–40** / High: **80–100**<br>• Low: **10–20** / High: **30–60** | <br>1–2 days<br>3–5 days (or longer) | <br>• Low: **15–30** / High: **60–80**<br>• Low: **10–20** / High: **30–60** | <br>1–2 days<br>3–5 days (or longer) | High compartment syndrome risk. Measure compartment pressure. Fasciotomy if $\Delta P < 30\text{ mmHg}$ within 12h. |
| **Central Nervous System / Intracranial (ICH)**<br>• *Initial Loading*<br>• *Maintenance* | <br>• Low: **50–80** / High: **80–100**<br>• Low: **20–40** / High: **50** | <br>1–3 days (or 1–7 days)<br>8–14 days (or 8–21 days) | <br>• Low: **50–80** / High: **60–80**<br>• Low: **20–40** / High: **30** | <br>1–3 days (or 1–7 days)<br>8–14 days (or 8–21 days) | **Medical emergency.** Infuse 100% factor IMMEDIATELY prior to CT/MRI. Mandatory secondary prophylaxis for 3–6 months. |
| **Throat and Neck Haemorrhage**<br>• *Initial Loading*<br>• *Maintenance* | <br>• Low: **30–50** / High: **80–100**<br>• Low: **10–20** / High: **50** | <br>1–3 days (or 1–7 days)<br>4–7 days (or 8–14 days) | <br>• Low: **30–50** / High: **60–80**<br>• Low: **10–20** / High: **30** | <br>1–3 days (or 1–7 days)<br>4–7 days (or 8–14 days) | Airway emergency. Immediate factor infusion. ENT consultation. Maintain levels until airway stable. |
| **Gastrointestinal (GI) Bleed**<br>• *Initial Loading*<br>• *Maintenance* | <br>• Low: **30–50** / High: **80–100**<br>• Low: **10–20** / High: **50** | <br>1–3 days (or 7–14 days)<br>4–7 days | <br>• Low: **30–50** / High: **60–80**<br>• Low: **10–20** / High: **30** | <br>1–3 days (or 7–14 days)<br>4–7 days | Hospitalize. Monitor Hb. Endoscopy investigation of choice. Adjunctive tranexamic acid. |
| **Renal Haemorrhage (Hematuria)** | • Low: **20–40**<br>• High: **50** | **3–5 days** | • Low: **15–30**<br>• High: **40** | **3–5 days** | Complete bed rest, vigorous hydration ($3\text{ L/m}^2/\text{day}$). **ANTIFIBRINOLYTICS ARE CONTRAINDICATED.** |
| **Deep Laceration** | • Low: **20–40**<br>• High: **50** | **5–7 days** | • Low: **15–30**<br>• High: **40** | **5–7 days** | Raise factor before suturing. Factor coverage for suture removal. |
| **Major Surgery**<br>• *Pre-operative*<br>• *Post-op (Days 1–3)*<br>• *Post-op (Days 4–6)*<br>• *Post-op (Days 7–14)* | <br>• Low: **60–80** / High: **80–100**<br>• Low: **30–40** / High: **60–80**<br>• Low: **20–30** / High: **40–60**<br>• Low: **10–20** / High: **30–50** | <br>Pre-op bolus<br>Days 1–3<br>Days 4–6<br>Days 7–14 | <br>• Low: **50–70** / High: **60–80**<br>• Low: **30–40** / High: **40–60**<br>• Low: **20–30** / High: **30–50**<br>• Low: **10–20** / High: **20–40** | <br>Pre-op bolus<br>Days 1–3<br>Days 4–6<br>Days 7–14 | Continuous infusion alternative: $2\text{–}4\text{ IU/kg/h}$ FVIII or $1\text{–}2\text{ IU/kg/h}$ FIX, monitored with daily assays. |
| **Minor Surgery**<br>• *Pre-operative*<br>• *Post-operative* | <br>• Low: **40–80** / High: **50–80**<br>• Low: **20–50** / High: **30–80** | <br>Pre-op<br>1–5 days | <br>• Low: **40–80** / High: **50–80**<br>• Low: **20–50** / High: **30–80** | <br>Pre-op<br>1–5 days | Single pre-op dose often sufficient for dental extraction if antifibrinolytic rinse is co-administered. |

> **Sources:** [WFH Guidelines 2020, Chapter 7: Treatment of Specific Hemorrhages, Table 7-2, p. 97; Chapter 9, p. 126–130].

---

### 7.3 Specific On-Demand Dosing for Ancillary & Bypassing Products

#### 7.3.1 Desmopressin (DDAVP) (WFH Section 5.6)
* **Routes & Dosage:**
  * **Intravenous (IV):** **0.3 μg/kg** diluted in 50–100 mL physiological saline, infused slowly over **20 to 30 minutes**. Peak FVIII response occurs at **60 minutes**.
  * **Subcutaneous (SC):** **0.3 μg/kg** (using high-concentration 15 μg/mL formulation).
  * **Intranasal Spray (using 1.5 mg/mL Stimate / Octim formulation):**
    * Patients $\ge 40\text{ kg}$: **300 μg** (one 150 μg spray in each nostril).
    * Patients $<40\text{ kg}$: **150 μg** (one 150 μg spray in one nostril only).
* **Frequency & Duration Limits:**
  * Administer **no more than once every 24 hours** (rarely twice daily in adults in hospital settings).
  * **Maximum treatment duration: 3 consecutive days**. Repeated dosing causes tachyphylaxis (exhaustion of endothelial FVIII stores) and water retention / severe hyponatremia.
* **Safety Restrictions & Fluid Protocols:**
  * Fluid intake must be restricted to **75% of maintenance requirements** for 24 hours following a dose.
  * **Strictly contraindicated in children under 2 years of age** due to cerebral edema and hyponatremic seizures [WFH Rec 5.6.4].
  * Contraindicated in patients with unstable angina, severe cardiovascular disease, or uncontrolled hypertension [WFH Rec 5.6.5].

#### 7.3.2 Recombinant Activated Factor VII (rFVIIa / NovoSeven RT) (WFH Section 8.3)
* **Route:** IV bolus over 2 to 5 minutes.
* **Dosage Options:**
  * *Standard Multi-Dose Regimen:* **90 μg/kg** every **2 to 3 hours** until hemostatic control is achieved.
  * *Single High-Dose Regimen (Joint/Muscle Bleeds):* **270 μg/kg** as a single bolus at onset.
* **Breakthrough bleeds on Emicizumab:** Initial dose is **90 μg/kg**; caution if the patient has underlying cardiovascular risk factors.

#### 7.3.3 Activated Prothrombin Complex Concentrate (aPCC / FEIBA) (WFH Section 8.3)
* **Route:** IV infusion ($\le 2\text{ U/kg/min}$).
* **Dosage:** **50–100 U/kg** every **8 to 12 hours** (typically 75–85 U/kg).
* **Maximum Daily Threshold:** Maximum single dose = **100 U/kg**; maximum 24-hour dose = **200 U/kg/day**.
* **Sequential Bypassing Therapy (Refractory Bleeds - WFH Table 8-4):** Alternating rFVIIa (90 μg/kg) and aPCC (50 U/kg) every 3 hours under expert tertiary care observation.

#### 7.3.4 Recombinant Porcine Factor VIII (rpFVIII / susoctocog alfa / Obizur)
* **Route:** IV bolus.
* **Dosage:** Initial loading dose of **200 IU/kg**. Maintenance doses administered every **4 to 12 hours** titrated to maintain target trough FVIII:C $>50\%$.

> **Sources:** [WFH Guidelines 2020, Chapter 5, p. 74–77; Chapter 7, p. 90–98; Chapter 8, p. 110–115; EMA / FDA Product Inserts].

---

## 8. Other Medications Outside Prophylactic and On-Demand Factor Therapies

These encompass adjunctive hemostatics, analgesics, vaccines, bone health modulators, and local wound management agents:

### 8.1 Antifibrinolytic Agents (WFH Section 5.6, Rec 5.6.6–5.6.8)
Competitively inhibit plasminogen activation to plasmin, preventing clot lysis. Highly effective for mucosal bleeds (oral, epistaxis, GI, menorrhagia) and dental extractions:
* **Tranexamic Acid (TXA):**
  * *Oral Dosage:* **25 mg/kg per dose**, administered **3 to 4 times daily** (typically 1000–1500 mg q6–8h in adults).
  * *Intravenous Dosage:* **10 mg/kg per dose**, administered **2 to 3 times daily** (slow IV infusion; rapid injection causes dizziness/hypotension).
  * *Topical Rinse:* 5% oral rinse (swish 10 mL for 2 minutes and spit q6h) or crushed tablet dissolved in clean water applied directly on mucosal bleeding lesions.
  * *Post-Dental Duration:* Prescribed for **7 consecutive days** post-extraction.
  * *Renal Impairment:* Dose must be reduced according to creatinine clearance to prevent neurotoxicity.
  * *CONTRAINDICATION 1:* **Upper urinary tract bleeding / hematuria.** Inhibits clot lysis in the ureter, creating insoluble fibrin clots, acute ureteral obstruction, hydronephrosis, and permanent renal failure [WFH Rec 5.6.7].
  * *CONTRAINDICATION 2:* Concurrent use with **Prothrombin Complex Concentrates (PCCs)** or high-dose aPCC due to fatal thromboembolism [WFH Rec 5.6.6].
* **Epsilon Aminocaproic Acid (EACA):**
  * *Adult Dose:* **100 mg/kg per dose** orally (max 2 g/dose) or IV (max 4 g/dose) every **4 to 6 hours** (maximum daily limit: **24 g/day**).
  * *Adverse Effects:* Gastrointestinal distress; rare painful **myopathy** with elevated creatine kinase and myoglobinuria after several weeks of continuous therapy.

### 8.2 Pain Management & Analgesics (WFH Section 2.6, Table 2-4, Rec 2.6.1–2.6.9)

Haemophilia patients suffer acute bleed pain and chronic arthropathy pain. The WFH establishes a structured 3-step analgesic ladder:

| Severity Tier | Recommended Analgesic Regimen | Contraindications & Clinical Precautions |
| :--- | :--- | :--- |
| **Step 1: Mild Pain** | **Paracetamol / Acetaminophen:**<br>• Adults: 500–1000 mg every 4–6 hours (max 4 g/day).<br>• Children: 10–15 mg/kg every 4–6 hours (max 60 mg/kg/day). | First-line choice. Safe on gastrointestinal mucosa and platelets. Monitor hepatic function in hepatitis C/B. |
| **Step 2: Moderate Pain** | 1. **Selective COX-2 Inhibitors:**<br>• Celecoxib (100–200 mg once or twice daily).<br>• Etoricoxib, Meloxicam.<br>2. **Weak Opioid Combinations:**<br>• Paracetamol + Codeine (adults only).<br>• Paracetamol + Tramadol (3–4 times daily). | **Selective COX-2 inhibitors DO NOT inhibit platelet COX-1 or platelet aggregation**, making them safe for hemophilic synovitis/arthropathy.<br>*Precaution:* Use with caution in hypertension or renal impairment. **Codeine is contraindicated in children <12 years old.** |
| **Step 3: Severe Pain** | **Strong Opioids:**<br>• Morphine: Slow-release formulation with immediate-release rescue product.<br>• Oxycodone, Hydromorphone, Fentanyl. | Prescribe under pain specialist guidance. Avoid long-term addiction. Manage constipation and sedation. |
| **Procedural Pain** | **Topical Local Anesthetics:**<br>• EMLA cream (lidocaine 2.5% + prilocaine 2.5%) applied under occlusive dressing 60 min before venipuncture or port access. | Eliminates injection anxiety and pain, especially in pediatric patients. |

> [!CAUTION]
> **ABSOLUTE CONTRAINDICATION: ASPIRIN & NON-SELECTIVE NSAIDs**  
> Aspirin (acetylsalicylic acid) and non-selective NSAIDs (ibuprofen, naproxen, indomethacin, diclofenac, ketorolac) **irreversibly or reversibly inhibit platelet cyclooxygenase-1 (COX-1)**, abolishing thromboxane $A_2$ synthesis and platelet aggregation. In a patient with baseline coagulopathy, this precipitates catastrophic, uncontrolled gastrointestinal and intracranial bleeding.

> [!WARNING]
> **INTRAMUSCULAR (IM) INJECTIONS CONTRAINDICATED**  
> Intramuscular administration of any analgesic (e.g. IM morphine, pethidine, or ketorolac) is strictly contraindicated due to the risk of large, deep intramuscular hematomas, nerve compression, and compartment syndrome [WFH Rec 2.6.5].

### 8.3 Topical and Local Hemostatic Agents (WFH Section 7.8)
* **Fibrin Sealants (e.g. Tisseel, Evicel):** Dual-component human fibrinogen and thrombin applied topically to provide instant localized fibrin cross-linking. Highly effective in dental extraction sockets and skin ulcers.
* **Topical Thrombin:** Applied locally via gelatin sponges (Gelfoam) or oxidized cellulose (Surgicel) for local capillary ooze.
* **Topical Adrenaline / Epinephrine:** Gauze soaked in 1:1000 adrenaline applied with firm local compression to mucosal bleed sites (mouth, nose) for vasoconstriction.

### 8.4 Vaccinations & Immunization Protocols (WFH Section 9.4, Rec 9.4.1–9.4.4)
* **Mandatory Vaccines:** **Hepatitis A virus (HAV)** and **Hepatitis B virus (HBV)** vaccines are mandatory for all persons with haemophilia at the earliest age, given potential lifetime exposure to blood-derived products.
* **Administration Route:** Vaccines should be administered **subcutaneously (SC)** rather than intramuscularly (IM) whenever possible to prevent deep muscle hematomas.
* **Protocol if IM Route is Unavoidable:** Use a **23- to 25-gauge fine needle**, apply an ice pack to the site for **5 minutes before injection**, and maintain firm, continuous digital pressure for **at least 10 minutes** without rubbing. Factor infusion is generally not required if this technique is followed.
* **Immunocompromised Patients (HIV):** Avoid live virus vaccines (oral polio, yellow fever, MMR, varicella) if CD4 count is suppressed.

### 8.5 Bone Health and Joint Adjuncts (WFH Chapter 10)
* **Calcium and Vitamin D Supplementation:** Prescribed routinely to prevent and manage secondary osteoporosis/osteopenia resulting from reduced weight-bearing and chronic arthropathy.
* **Intra-articular Corticosteroids / Hyaluronic Acid:** Injected under factor coverage for chronic inflammatory hemophilic synovitis to reduce synovial hypertrophy.
* **Chemical / Radioisotope Synovectomy Agents:** Intra-articular injection of radioisotopes (Yttrium-90, Rhenium-186, Phosphorus-32) or chemical sclerosants (rifampicin) to ablate chronic hypervascularized synovium and eliminate target joints.

### 8.6 Gastrointestinal Protection
* **Proton Pump Inhibitors (PPIs) / $H_2$-Receptor Antagonists:** Omeprazole, pantoprazole, famotidine; prescribed during GI bleeding, post-GI bleed recovery, or when selective COX-2 inhibitors are co-administered in patients with peptic history.

---

## 9. Specific Guidelines on What to Do During an Active Bleed

### 9.1 The Fundamental Golden Rule: "Treat First, Investigate Later"
* **Immediate Infusion:** Clotting factor concentrate (or bypassing agent) must be infused **immediately—ideally within 2 hours of bleed onset or at the earliest "aura" / tingling sensation** [WFH Section 7.1, 7.2].
* **Never Delay for Diagnostic Workups:** Do NOT wait for laboratory assay results, radiological confirmations (X-rays, CT scans, ultrasound), or specialized hospital consultations before infusing the hemostatic agent. Every 30-minute delay increases tissue distension, pain, cartilage lysis, and risk of permanent arthropathy.

### 9.2 The First-Aid Framework: PRICE vs. POLICE (WFH Section 7.2, Rec 7.2.6)
In addition to immediate factor infusion, manage acute joint/muscle bleeds using:
* **P (Protection):** Splint or sling the affected joint/limb in a position of comfort (typically semi-flexion) to prevent inadvertent strain or re-injury.
* **R / OL (Rest / Optimal Loading):** Complete initial rest for acute pain. Once pain begins to subside, transition to **POLICE (Protection, Optimal Loading, Ice, Compression, Elevation)**—introduce gentle, pain-free active mobilization to prevent muscle atrophy and joint stiffness.
* **I (Ice):** Apply cold packs wrapped in a towel (never direct bare-skin contact) for **15–20 minutes every 4 to 6 hours**. Restricts swelling and provides analgesia. Limit total continuous ice duration to $<6\text{ hours}$ to prevent paradoxical impairment of local enzymatic coagulation.
* **C (Compression):** Apply an elastic bandage (e.g. Ace wrap) with mild, uniform pressure to reduce intra-articular capillary effusion. *Caution: Monitor distal pulse and capillary refill to prevent neurovascular compression.*
* **E (Elevation):** Elevate the affected limb above the level of the heart to encourage lymphatic drainage and venous return.
* **Weight-Bearing Restriction:** Patients with hip, knee, or ankle bleeds must remain **strictly non-weight-bearing (using crutches or wheelchair) for up to 1 week**, resuming weight-bearing only when complete pre-bleed range of motion is restored and acute pain is absent [WFH Rec 7.2.7].

---

### 9.3 Action Protocols by Bleed Site and Severity

#### 9.3.1 Acute Joint Bleed (Hemarthrosis)
1. **Mild / Moderate Joint Bleed:**
   * Infuse FVIII (target peak **10–20 to 40–60 IU/dL**) or FIX (target peak **10–20 to 40–60 IU/dL**) immediately.
   * Apply PRICE/splint.
   * Re-evaluate at 6–12 hours: If significant improvement occurs within 8 hours, single dose may suffice. If bleeding symptoms continue, repeat infusion at 12 hours (FVIII) or 24 hours (FIX).
   * Initiate physical therapy under factor coverage as soon as pain subsides [WFH Rec 7.2.9].
2. **Severe Joint Bleed:**
   * Immediate IV factor infusion (target peak **40–60 IU/dL**). Continue daily/alternate-day infusions for 1–3 days until complete resolution.
   * **Arthrocentesis (Joint Aspiration):** NOT performed routinely. Reserved strictly for:
     1. Tense, agonizing hemarthrosis showing zero relief 24 hours post-infusion (especially hip hemarthrosis to prevent avascular femoral head necrosis).
     2. Suspicion of septic arthritis.
     * *Mandatory Rule:* Arthrocentesis must ONLY be performed under sterile conditions with guaranteed factor levels $\ge 30\text{–}50\text{ IU/dL}$ maintained for **48 to 72 hours** [WFH Rec 7.2.11].

#### 9.3.2 Muscle Bleeds & Suspected Compartment Syndrome
1. **Superficial Muscle:** Factor replacement (peak **10–20 to 40–60 IU/dL**) for 2–3 days plus rest and cold compression.
2. **Deep Muscle Groups (Iliopsoas, Calf, Forearm):**
   * High risk of femoral nerve palsy, posterior tibial nerve injury, or Volkmann's contracture.
   * Infuse factor immediately: initial target **80–100 IU/dL** (FVIII) or **60–80 IU/dL** (FIX) for 1–2 days, then maintenance **30–60 IU/dL** for 3–5 days or longer [WFH Table 7-2].
   * Strict bed rest for iliopsoas bleeds (avoid crutch ambulation which contracts the psoas). Confirm with ultrasound or CT.
3. **Compartment Syndrome Emergency:**
   * Continuous monitoring of the 5 Ps: Pain (out of proportion), Pallor, Paresthesia, Pulselessness, Paralysis.
   * Direct intracompartmental pressure measurement.
   * If confirmed ($\Delta P < 30\text{ mmHg}$), **emergency surgical fasciotomy must be performed within 12 hours of symptom onset** under high-dose factor replacement [WFH Rec 10.4.3].

#### 9.3.3 Life-Threatening Bleeds: Central Nervous System / Intracranial Bleed (ICH)
1. Treat ANY head injury, persistent severe headache, unexplained vomiting, or altered mental status as a presumptive ICH.
2. **Infuse 100% factor replacement IMMEDIATELY** (target peak **80–100 IU/dL** for FVIII, **60–80 IU/dL** for FIX) **BEFORE ordering or transporting the patient for CT or MRI** [WFH Rec 7.3.1].
3. Urgent hospitalization and emergent CT/MRI scan.
4. Maintain factor levels $\ge 50\text{ IU/dL}$ for **10 to 14 days** (up to 21 days in severe trauma).
5. **Mandatory Secondary Prophylaxis:** Following resolution, place the patient on regular secondary prophylaxis for **at least 3 to 6 months** (or lifelong) to prevent recurrent ICH [WFH Rec 6.6.1, 7.3.2].

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
1. Enforce **complete bed rest**.
2. Initiate **vigorous oral or IV hydration** at **$3.0\text{ L/m}^2\text{ body surface area/day}$** to maintain rapid urine flow and prevent clot stagnation.
3. **DO NOT ADMINISTER ANTIFIBRINOLYTICS (TXA / EACA)** [WFH Rec 7.6.3].
4. If painless macroscopic hematuria persists beyond 48 hours or is accompanied by flank colic, administer factor replacement (peak **20–40 to 50 IU/dL**) for 3–5 days [WFH Table 7-2].

#### 9.3.7 Epistaxis and Oral Bleeding
1. **Epistaxis:**
   * Sit upright with head tilted slightly forward (prevent swallowing of blood into stomach).
   * Apply firm, continuous digital pressure to Little’s area (anterior nasal septum) for 10–15 minutes with ice-water-soaked gauze.
   * Apply topical gauze soaked in tranexamic acid.
   * **Nasal packing is contraindicated** (causes mucosal shearing and massive rebleeding upon extraction) [WFH Rec 7.9.2].
   * If severe/persistent, infuse factor (target peak 20–40 IU/dL).
2. **Oral Bleeding:**
   * Bite down firmly on a damp gauze swab for 20–30 minutes.
   * Administer oral tranexamic acid rinse / tablets for 5–7 days.
   * Topical application of adrenaline 1:1000 or fibrin glue.

#### 9.3.8 Active Bleed in Patients with Inhibitors
* **Low-Responding (<5 BU):** Infuse neutralizing high-dose FVIII/FIX.
* **High-Responding (≥5 BU) NOT on Emicizumab:** Infuse rFVIIa (90 μg/kg q2–3h) OR aPCC (50–100 U/kg q8–12h).
* **High-Responding ON Emicizumab Prophylaxis:**
  * First-line: **rFVIIa 90 μg/kg IV**.
  * **Strictly avoid aPCC** due to black box warning of thrombotic microangiopathy (TMA).

> **Sources:** [WFH Guidelines 2020, Chapter 7: Treatment of Specific Hemorrhages, p. 90–98; Chapter 8, p. 110–115; Chapter 10, p. 145–148].

---

## 10. Guidelines on Resuming Prophylaxis After On-Demand Treatment for a Bleed

When a patient on established prophylaxis experiences a breakthrough bleed and takes on-demand (episodic) factor therapy, how and when should they resume their regular prophylaxis?

### 10.1 Pharmacokinetic Rationale and Acute Substitution Rule
1. **Day-of-Bleed Dose Substitution:**
   * An on-demand therapeutic dose (e.g. 40–50 IU/kg) produces a high factor peak (80%–100%) that far exceeds the peak of a routine prophylactic dose (15–30 IU/kg).
   * Therefore, **if a breakthrough bleed occurs on a day when a routine prophylactic infusion was scheduled, the therapeutic on-demand infusion serves as and replaces that day's scheduled prophylactic dose.** The patient does NOT inject their routine prophylactic dose in addition to the on-demand dose on that day.
2. **Multi-Day Treatment Override:**
   * If a severe or deep bleed requires repeat therapeutic infusions (e.g., every 8–12 hours for FVIII or every 24 hours for FIX over 2–5 days as per WFH Table 7-2), the regular prophylaxis schedule is temporarily **superseded** by the acute treatment protocol.

---

### 10.2 Resumption Protocols by Medication Class

#### 10.2.1 Standard Half-Life (SHL) Factor Concentrates (FVIII / FIX)
* **Timing of Next Dose:**
  * Once acute bleeding has ceased and the therapeutic treatment course is concluded:
    * **For FVIII ($t_{1/2} \approx 12\text{ hours}$):** The patient resumes their regular prophylactic regimen on their **next regularly scheduled calendar day, provided at least 24 hours have elapsed since the final on-demand infusion**. If the final therapeutic dose was administered on the morning of Day 3, a patient on an alternate-day schedule (Mon/Wed/Fri) would resume their regular prophylactic dose on Day 5 (Friday morning).
    * **For FIX ($t_{1/2} \approx 18–24\text{ hours}$):** Resume regular prophylaxis on the next scheduled day, allowing **36 to 48 hours** after the last therapeutic dose.
* **Re-Anchoring Calendar Routines:**
  * To promote long-term treatment adherence, clinicians recommend re-anchoring the patient back to their fixed calendar days (e.g., Mon-Wed-Fri for FVIII, Mon-Thu for FIX) rather than permanently shifting their schedule, as fixed routines minimize forgotten doses [WFH Section 6.8].

#### 10.2.2 Extended Half-Life (EHL) Factor Concentrates
* **EHL FVIII ($t_{1/2} \approx 19\text{ hours}$):** Resume routine prophylaxis **48 to 72 hours** after the final on-demand dose, re-aligning with the patient's fixed 2-day-per-week or every-3-to-4-day schedule.
* **EHL FIX ($t_{1/2} \approx 80–120\text{ hours}$):** Due to the prolonged half-life and high recovery of EHL FIX, an acute on-demand therapeutic dose maintains protective plasma FIX levels ($\ge 5\%–10\%$) for many days. The patient should resume their routine weekly or bi-weekly prophylaxis **7 to 10 days** after the final on-demand dose.

#### 10.2.3 Emicizumab (Hemlibra) Prophylaxis: The "Non-Interruption" Rule
* **Mandatory Guideline:** **Emicizumab prophylaxis is NEVER stopped, paused, delayed, or rescheduled due to an acute bleed or on-demand factor treatment.**
* **Mechanism:** Emicizumab is a long-acting monoclonal antibody with a 30-day half-life. Episodic infusions of FVIII or rFVIIa act synergistically at the biochemical level and do not alter emicizumab clearance.
* **Action:** The patient continues to inject their weekly, bi-weekly, or monthly subcutaneous emicizumab dose **on the exact scheduled date and time**, regardless of how many doses of FVIII or rFVIIa were infused to manage the acute bleed.

---

### 10.3 Temporary Intensified / Secondary Prophylaxis Post-Bleed
* **Protection During Physical Rehabilitation (WFH Rec 7.2.9, 10.4.3):**
  * Following an acute joint or deep muscle bleed, the joint capsule remains distended and the synovium is acutely inflamed and hypervascularized, creating a high-risk window for immediate re-bleeding upon remobilization.
  * Expert consensus and WFH guidelines recommend instituting a **temporary period of enhanced / secondary prophylaxis (e.g. daily or alternate-day factor coverage, targeting troughs >3%–5%) for 1 to 2 weeks** during physical therapy and progressive weight-bearing, before stepping down to the patient's baseline prophylactic regimen.

---

### 10.4 Clinical Investigation Triggered by Breakthrough Bleeding (WFH Rec 6.3.2, 8.2.1)
Whenever an adherent patient experiences a breakthrough bleed on prophylaxis, the WFH mandates two immediate clinical actions:
1. **Screen for Inhibitor Development:** Any sudden loss of prophylactic efficacy or unexpected breakthrough bleed must prompt immediate laboratory screening for an alloantibody inhibitor using the Bethesda assay [WFH Rec 6.3.2, 8.2.1].
2. **Pharmacokinetic Assessment & Regimen Escalation:** If inhibitor screening is negative, the patient's factor trough levels should be measured. The prophylaxis regimen should be **escalated (increasing dose, frequency, or transitioning from SHL to EHL or emicizumab)** to prevent future breakthrough bleeding and preserve joint function [WFH Rec 6.1.1, 6.3.2].

---

### 10.5 The 72-Hour "New Bleed" vs. "Bleed Recurrence" Definition
* Derived from the ISTH Scientific and Standardization Committee (SSC) criteria adopted in WFH Section 7.2:
  * **Bleed Continuation / Recurrence:** Any bleed occurring **$\le 72\text{ hours}$** after stopping treatment for the initial bleed is classified as continuation of the original bleed. It requires **immediate re-initiation of episodic on-demand factor therapy**, NOT reliance on routine prophylaxis.
  * **New Bleed:** A bleed occurring **$>72\text{ hours}$** after cessation of treatment is defined as a distinct new bleeding episode.

> **Sources:** [WFH Guidelines 2020, Chapter 6: Prophylaxis, p. 81–89; Chapter 7: Treatment of Specific Hemorrhages, p. 90–98; Chapter 8, p. 104–115; Blanchette VS, et al. ISTH SSC Communication, *J Thromb Haemost* 2014; MASAC Document #241, National Bleeding Disorders Foundation].

---

## Complete Bibliographic Citations

1. **[WFH 2020]** Srivastava A, Santagostino E, Dougall A, Kitchen S, Sutherland M, Pipe SW, Carcao M, Mahlangu J, Ragni MV, Windyga J, Llinás A, Goddard NJ, Mohan R, Poonnoose PM, Feldman BM, Lewis SZ, van den Berg HM, Pierce GF; WFH Guidelines for the Management of Hemophilia panelists and co-authors. WFH Guidelines for the Management of Hemophilia, 3rd edition. *Haemophilia*. 2020;26(Suppl 6):1–158. DOI: [10.1111/hae.14046](https://doi.org/10.1111/hae.14046).
2. **[ISTH Definitions]** Blanchette VS, Key NS, Ljung LR, Manco-Johnson MJ, van den Berg HM, Srivastava A; Subcommittee on Factor VIII, Factor IX and Rare Coagulation Disorders. Definitions in hemophilia: communication from the SSC of the ISTH. *J Thromb Haemost*. 2014;12(11):1935–1939.
3. **[MASAC Prophylaxis]** Medical and Scientific Advisory Council (MASAC) of the National Bleeding Disorders Foundation. *MASAC Recommendation Concerning Prophylaxis for Hemophilia A and B with and without Inhibitors*. MASAC Document #241. New York, NY: NBDF; 2016 (Updated 2022).
4. **[UKHCDO Guidelines]** Rayment R, Chalmers E, Forsyth K, et al. Guidelines on the management of acute bleeds and surgery in patients with haemophilia and other inherited bleeding disorders: a guideline from the United Kingdom Haemophilia Centre Doctors' Organisation (UKHCDO). *Haemophilia*. 2020;26(6):944–964.
5. **[Emicizumab Prophylaxis Trials]** Mahlangu J, Oldenburg J, Paz-Priel I, et al. Emicizumab prophylaxis in patients who have hemophilia A without inhibitors (HAVEN 3). *N Engl J Med*. 2018;379(9):811–822.
6. **[Emicizumab Inhibitor Trials]** Oldenburg J, Mahlangu JN, Kim B, et al. Emicizumab prophylaxis in hemophilia A with inhibitors (HAVEN 1). *N Engl J Med*. 2017;377(9):809–818.
7. **[Acquired Haemophilia A]** Tiede A, Collins P, Knoebl P, et al. International recommendations on the diagnosis and treatment of acquired hemophilia A. *Haematologica*. 2020;105(7):1791–1801.
8. **[Factor XI Deficiency]** Bolton-Maggs PHB. Factor XI deficiency—resolving the enigma? *Hematology Am Soc Hematol Educ Program*. 2009;2009(1):97–105.
9. **[Hemlibra FDA Label]** Genentech, Inc. HEMLIBRA® (emicizumab-kxwh) injection prescribing information. South San Francisco, CA; Revised 2021.
10. **[NovoSeven Prescribing Information]** Novo Nordisk Inc. NovoSeven® RT (coagulation factor VIIa, recombinant) prescribing information. Plainsboro, NJ; Revised 2020.
11. **[FEIBA Prescribing Information]** Baxalta US Inc. FEIBA (Anti-Inhibitor Coagulant Complex) prescribing information. Lexington, MA; Revised 2020.

---
> **Developer Action Required:** Review this clinical summary before integrating factor kinetics, dose-logging schemas, and bleeding triage rules into the HackitRx codebase.
