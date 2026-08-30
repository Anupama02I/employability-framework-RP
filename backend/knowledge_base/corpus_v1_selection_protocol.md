# Corpus V1.0 Selection Protocol

**Protocol version:** 1.0  
**Frozen-design date:** 2026-08-25

## 1. Purpose

Corpus V1.0 is a controlled knowledge base for a multilingual Sri Lankan youth employability and career-guidance chatbot. It is separate from the employability prediction dataset and does not contain users' assessment profiles, predictions, SHAP values or chat histories.

The corpus supports five knowledge needs: (1) occupational/career information, (2) education and training pathways, (3) career preparation, (4) labour-market information, and (5) career-support/referral information.

## 2. Curation strategy

The study uses a **purposive, coverage-oriented corpus curation strategy** with predefined knowledge domains and explicit source-eligibility criteria. The stopping rule is adequate authoritative coverage with limited redundancy, not an arbitrary document count.

### Occupational-source redesign

An initial CareerOne-heavy occupational corpus was manually screened. Several guides were short, occupation-specific, included volatile salary/job-count material, and some older files contained internal wording/content inconsistencies. Therefore, the core occupational branch was redesigned around **ISCO-08 as the taxonomic reference** and **ESCO v1.2.1 as the structured occupation-skill source**.

The ESCO English CSV dataset was transformed into **3,039 validated occupation profiles** containing occupation name, description, alternative labels, ISCO group, and linked essential/optional skills. CareerOne occupational PDFs are retained only as supplementary Sri Lankan reference material and are not indexed in the core V1 occupational branch.

## 3. Source hierarchy

**Tier 1 - Sri Lankan official/public sources:** TVEC/CareerOne, NAITA, UGC, DCS, Ministry of Labour/Department of Manpower and Employment, NYSC, NEC.

**Tier 2 - international authoritative sources:** ILO and European Commission ESCO. These may support general occupational/career-preparation knowledge but must not be used to invent Sri Lankan salaries, vacancies, admissions rules or current training availability.

## 4. Source roles

- `methodology_reference`: supports taxonomy/policy/methodology and is normally not embedded.
- `rag_content`: eligible for retrieval.
- `supplementary_not_indexed`: retained for comparison/local context but excluded from core V1 retrieval.
- `source_discovery`: helps locate authoritative primary material but is not itself substantive answer content.

## 5. Inclusion criteria

A source is eligible when it is authoritative, directly relevant to a predefined domain, reproducibly accessible, sufficiently substantive/factual, traceable to an identifiable publisher and URL, compatible with a freshness/validity rule, non-promotional for the intended role, and usable without unsupported causal/discriminatory/guaranteed-employment claims.

## 6. Exclusion codes

- E01 outside scope or transactional rather than reusable knowledge
- E02 unverifiable authority
- E03 primarily promotional/commercial
- E04 outdated or superseded
- E05 duplicate of a more authoritative source
- E06 highly time-sensitive for a frozen static corpus
- E07 unsupported/discriminatory career claims
- E08 insufficient substantive factual content
- E09 cannot be reliably extracted
- E10 better primary/official source available
- E11 not reproducibly accessible during screening
- E12 insufficient internal content quality/consistency
- E13 redundant for the core role after adoption of a stronger structured source
- E14 navigation/source-discovery page rather than substantive answer content

## 7. Domain design

### Occupational information
Core: ESCO v1.2.1 with ISCO mapping. Index occupation descriptions, titles, ISCO group, essential skills and optional skills. Do not use ESCO for Sri Lankan salary/vacancy/admission/training-availability claims.

### Education and training pathways
Core: TVEC NVQ Operations Manual 2021, NAITA RPL, UGC Handbook 2025/2026, NYSC Technical and Vocational Training Division, NYSC Training Centres Directory, and NYSC Examination and Assessment Division.

### Career preparation
Core: CareerOne Portfolio Guide, ILO *How to Support a Jobseeker?*, and ILO *Guiding Youth Careers*.

### Labour-market information
Core: DCS Annual Bulletin 2025 and DCS Q1 2026. All statistics retain their reporting period.

### Career support/referral
Core: selected Department of Manpower and Employment sections of the Ministry of Labour Progress Report 2025. NYSC centre information may also support training referral.

## 8. NYSC handling

NYSC is included under **education and training pathways** because its official Technical and Vocational Training Division describes the training-centre role, its Centres directory provides island-wide centre information, and its Examination and Assessment Division documents NVQ certification, RPL and OJT functions.

Because current course availability is dynamic, V1 freezes dated snapshots of the NYSC institutional/pathway pages and centre directory but excludes individual course-registration/course-availability pages from stable static knowledge. When centre/course information is surfaced, the chatbot should state that availability may change and direct the user to the current NYSC official site for confirmation.

## 9. Freshness/validity policy

- Stable/versioned: ISCO, ESCO version, NVQ framework.
- Validity-bound: UGC admissions handbook.
- Time-stamped: DCS statistics, Ministry progress report.
- Semi-dynamic: NAITA RPL, CareerOne career-preparation material, NYSC institutional pages.
- Highly dynamic: vacancies, live intakes, fees and current course availability; excluded from static V1 unless explicitly represented as a dated referral snapshot.

## 10. Raw and processed data

`knowledge_base/raw/` stores unmodified originals or dated HTML snapshots. `knowledge_base/processed/` stores derived text/JSONL/chunks. For each source, record URL, retrieval date, local filename, publication/version/validity information and SHA-256 hash where applicable.

## 11. Multilingual design

Corpus V1 prioritizes authoritative-source quality rather than silently machine-translating all documents. The chatbot remains English/Sinhala/Tamil; multilingual retrieval is handled through the embedding/LLM layer. Machine-translated corpus copies are not treated as original authoritative documents.

## 12. Core V1 assets

The core manifest contains **13 assets**: 1 structured occupational dataset, 6 education/training pathway assets, 3 career-preparation assets, 2 labour-market reports, and 1 career-support/referral report. ISCO-08 and the NEC TVET policy remain methodology references in the source registry and are not part of the core vector index.

## 13. Freeze and updates

Corpus V1.0 is frozen before final RAG/chatbot evaluation. A later refresh creates a new corpus version rather than silently replacing sources used in already reported experiments.

## 14. Next implementation stage

1. collect remaining raw sources and dated HTML snapshots;
2. calculate SHA-256 hashes;
3. extract/clean text while preserving metadata and validity dates;
4. chunk content;
5. create multilingual embeddings and vector index;
6. evaluate retrieval before final chatbot evaluation.
