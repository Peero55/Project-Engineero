# Requirements Document

## Introduction

The Question Pipeline is a multi-stage system for building, validating, and delivering a bank of ~1,500 questions for Engineero's game-based study platform. It covers CompTIA Network+ (N10-009) domain-specific questions and general networking/computing questions. The pipeline supports importing seed material from external sources (Packt XLSX, community dumps), supplementing with Open Trivia DB, generating new questions via LLM, and validating all content against a strict schema. Supabase is the single source of truth — approved questions are promoted directly into the existing `questions` and `answer_options` tables where the battle engine already reads them. The pipeline uses local JSON files only as intermediate staging during ingestion, generation, and review.

## Glossary

- **Question_Bank**: The canonical collection of validated, approved questions stored in the Supabase `questions` and `answer_options` tables. Local JSON files in `data/questions/` serve as intermediate staging during pipeline processing.
- **Pipeline_CLI**: A set of Node/TypeScript CLI scripts in `packages/core` that orchestrate source ingestion, normalization, generation, validation, and publishing of questions.
- **Source_Ingester**: The pipeline stage that reads raw source material (XLSX, JSON dumps, API responses) and normalizes them into the canonical question schema.
- **LLM_Generator**: The pipeline stage that uses large language model prompts to batch-generate new questions in the canonical schema, targeting specific domains, subjects, and difficulty levels.
- **Validator**: The pipeline stage that checks every question against the canonical JSON schema, enforces field constraints, detects duplicates, and flags items for review.
- **Question_Schema**: The TypeScript interface and JSON Schema defining the shape of every question in the Question_Bank, including id, source, exam, domain, difficulty, options, explanation, tags, and review status.
- **Manifest**: A `manifest.json` file at `data/questions/manifest.json` that tracks pipeline state: ingestion log, question counts by domain/difficulty, and last pipeline run timestamp.
- **Review_Queue**: The set of questions with `status: "pending"` or `status: "needs_revision"` awaiting human approval before promotion to `status: "approved"`.
- **Deduplicator**: A validation sub-stage that detects near-duplicate questions using string similarity and optional embedding-based comparison.
- **Lab_Catalog**: A metadata registry mapping lab exercises to questions, domains, and remediation paths.
- **Open_Trivia_DB**: A free public API (opentdb.com) used as a supplemental source for general networking and computing trivia questions.
- **Difficulty_Model**: The 1–4 scale (easy/recall, medium/application, hard/troubleshooting, expert/analysis) used to classify question difficulty.
- **Cognitive_Level**: The taxonomy (recall, comprehension, application, troubleshooting, analysis) classifying the thinking skill a question tests.
- **Element_Map**: A static mapping that assigns one of five elemental affinities (Fire, Water, Earth, Air, Spirit) to each of the five CompTIA N10-009 exam domains, used to theme creature types in the game layer.
- **Creature_Type**: A fantasy creature classification (e.g., golem, mephit, serpent, drake) associated with an elemental affinity. Each creature type implies the N10-009 domain its questions are drawn from.
- **Objective_Metadata**: The set of fields on a question that link it to a specific CompTIA N10-009 exam objective, including `objective_id`, `objective_description`, and `objective_subtopics`.
- **Question_Selector**: The runtime module that chooses which question to present to a user, applying domain weighting, randomization, deduplication of recently seen questions, and adaptive reinforcement rules.
- **Domain_Weight_Table**: A configuration table defining the baseline probability distribution for question selection across the five N10-009 domains, matching official exam weightings (Networking Fundamentals 23%, Network Implementations 19%, Network Operations 16%, Network Security 19%, Network Troubleshooting 23%).
- **Adaptive_Reinforcement_Engine**: The subsystem that tracks per-user answer history, detects weak domains or creature types over a rolling window, and adjusts question selection probabilities to increase exposure to weak areas.
- **Rolling_Window**: A configurable time period (default 3 days) over which the Adaptive_Reinforcement_Engine evaluates a user's answer accuracy per domain and creature type.

## Requirements

### Requirement 1: Canonical Question Schema

**User Story:** As a developer, I want a single, strict JSON schema for all questions, so that every pipeline stage and consumer operates on a consistent data shape.

#### Acceptance Criteria

1. THE Question_Schema SHALL define the following required fields: id, source, source_type, exam, exam_version, domain, subject, subtopic, difficulty, difficulty_label, cognitive_level, question_type, question, options, correct_answer, explanation, tags, status, reviewed, created_at, updated_at.
2. THE Question_Schema SHALL define the following optional fields: lab_related, lab_id, references.
3. WHEN a question has `question_type` of "multiple_choice", THE Question_Schema SHALL require exactly four items in the `options` array.
4. THE Question_Schema SHALL constrain `difficulty` to integer values 1, 2, 3, or 4.
5. THE Question_Schema SHALL constrain `difficulty_label` to one of "easy", "medium", "hard", or "expert".
6. THE Question_Schema SHALL constrain `cognitive_level` to one of "recall", "comprehension", "application", "troubleshooting", or "analysis".
7. THE Question_Schema SHALL constrain `status` to one of "pending", "approved", "rejected", or "needs_revision".
8. THE Question_Schema SHALL constrain `source_type` to one of "seed", "generated", "api", or "manual".
9. THE Question_Schema SHALL require `correct_answer` to be a value present in the `options` array.
10. THE Question_Schema SHALL require `id` to follow the pattern `{exam_prefix}-{version}-d{domain_number}-{sequence}` (e.g., "netplus-n10-009-d1-000001") for exam-specific questions. FOR questions with `source_type` of "api" or `exam` of "General", THE Question_Schema SHALL accept the relaxed pattern `{source}-{category_slug}-{sequence}` (e.g., "opentdb-computer-science-000001").

### Requirement 2: Question Bank Folder Structure

**User Story:** As a developer, I want a well-organized folder structure for pipeline staging data, so that raw sources, normalized data, review queues, and pipeline artifacts are clearly separated.

#### Acceptance Criteria

1. THE Pipeline_CLI SHALL organize question pipeline data under a `data/questions/` directory at the repository root.
2. THE Pipeline_CLI SHALL maintain the following subdirectories: `sources/raw`, `sources/normalized`, and `sources/review` for pipeline staging.
3. THE Pipeline_CLI SHALL store the pipeline manifest file at `data/questions/manifest.json` tracking ingestion history, question counts, and last pipeline run timestamp.
4. THE Pipeline_CLI SHALL store LLM generation prompts and templates in `data/questions/prompts/`.
5. THE Pipeline_CLI SHALL store validation reports in `data/questions/reports/`.

### Requirement 3: Source Ingestion Pipeline

**User Story:** As a content curator, I want to import seed questions from XLSX files and community JSON dumps, so that existing question material is normalized into the canonical schema without manual reformatting.

#### Acceptance Criteria

1. WHEN an XLSX file is placed in `sources/raw`, THE Source_Ingester SHALL parse the file and produce normalized JSON in `sources/normalized`.
2. WHEN a JSON dump file is placed in `sources/raw`, THE Source_Ingester SHALL parse the file and produce normalized JSON in `sources/normalized`.
3. THE Source_Ingester SHALL map source columns/fields to the Question_Schema, setting `source_type` to "seed".
4. THE Source_Ingester SHALL assign deterministic IDs based on exam prefix, domain, and sequence number.
5. IF a source file contains rows missing required fields, THEN THE Source_Ingester SHALL log a warning and skip the incomplete row.
6. THE Source_Ingester SHALL set `status` to "pending" and `reviewed` to false for all ingested questions.
7. THE Source_Ingester SHALL record the original source filename in the `source` field.

### Requirement 4: Open Trivia DB Supplemental Ingestion (Deferred — Future)

**User Story:** As a content curator, I want to pull general networking and computing questions from Open Trivia DB, so that the question bank includes supplemental non-CompTIA content for broader coverage.

**Note:** This requirement is deferred to a future phase. The pipeline architecture should support adding this source later, but implementation is not required for MVP.

#### Acceptance Criteria

1. WHEN the Open Trivia DB fetch command is invoked, THE Source_Ingester SHALL request questions from the Open Trivia DB API filtered to Computer Science and related categories.
2. THE Source_Ingester SHALL respect the Open Trivia DB rate limit of 50 questions per API call.
3. THE Source_Ingester SHALL normalize Open Trivia DB responses into the Question_Schema, setting `source_type` to "api" and `source` to "opentdb".
4. THE Source_Ingester SHALL set `exam` to "General" and `exam_version` to "none" for Open Trivia DB questions.
5. THE Source_Ingester SHALL set `status` to "pending" and `reviewed` to false for all Open Trivia DB questions.
6. THE Source_Ingester SHALL deduplicate against existing normalized questions before writing new entries.
7. IF the Open Trivia DB API is unreachable, THEN THE Source_Ingester SHALL log the error and continue without failing the overall pipeline run.

### Requirement 5: LLM Question Generation Pipeline

**User Story:** As a content curator, I want to generate CompTIA Network+ questions using an LLM, so that the question bank reaches the ~1,500 target with domain-balanced, difficulty-balanced, high-quality content.

#### Acceptance Criteria

1. THE LLM_Generator SHALL accept a generation manifest specifying target counts per domain, subject, subtopic, and difficulty level.
2. THE LLM_Generator SHALL use a system prompt that defines the Question_Schema, Difficulty_Model, Cognitive_Level taxonomy, and CompTIA N10-009 domain structure.
3. THE LLM_Generator SHALL use a user prompt template that specifies the target domain, subject, subtopic, difficulty, count, and exemplar questions.
4. THE LLM_Generator SHALL include a self-check/critic prompt that instructs the LLM to verify factual accuracy, option plausibility, explanation completeness, and schema compliance before returning output.
5. WHEN the LLM returns malformed JSON, THE LLM_Generator SHALL apply a normalization prompt to attempt repair, and log a warning if repair fails.
6. THE LLM_Generator SHALL set `source_type` to "generated" and record the model identifier in the `source` field.
7. THE LLM_Generator SHALL prioritize free or low-cost model paths in this order: (a) local Ollama models (qwen, llama, mistral) at zero cost, (b) Gemini Flash free tier (generous rate limits for structured output), (c) paid cloud APIs only as a fallback when free options are insufficient.
8. THE LLM_Generator SHALL set `status` to "pending" and `reviewed` to false for all generated questions.
9. THE LLM_Generator SHALL batch generation into groups of 10–25 questions per prompt call to balance quality and throughput.
10. THE LLM_Generator SHALL write generated batches to `sources/normalized` with batch metadata (timestamp, model, domain, count).
11. THE LLM_Generator SHALL check generated questions against existing bank content for near-duplicates before writing.

### Requirement 5.1: LLM Prompt Templates

**User Story:** As a developer, I want production-ready prompt templates stored in the repository, so that question generation is reproducible and improvable over time.

#### Acceptance Criteria

1. THE LLM_Generator SHALL store prompt templates as text files in `data/questions/prompts/`.
2. THE LLM_Generator SHALL provide a system prompt template that establishes the LLM's role as a CompTIA Network+ exam question author with the full Question_Schema definition.
3. THE LLM_Generator SHALL provide a user prompt template with placeholders for domain, subject, subtopic, difficulty, count, and exemplar questions.
4. THE LLM_Generator SHALL provide a critic prompt template that instructs the LLM to review its own output for factual errors, ambiguous wording, implausible distractors, and schema violations.
5. THE LLM_Generator SHALL provide a normalization prompt template for repairing malformed JSON output.

### Requirement 6: Question Validation Pipeline

**User Story:** As a developer, I want automated validation of every question, so that only schema-compliant, non-duplicate, well-formed questions enter the review queue.

#### Acceptance Criteria

1. THE Validator SHALL verify every question against the Question_Schema using JSON Schema validation (e.g., Ajv).
2. THE Validator SHALL verify that all required fields are present and non-empty.
3. THE Validator SHALL verify that `difficulty` is one of 1, 2, 3, or 4 and that `difficulty_label` matches the corresponding label.
4. THE Validator SHALL verify that `correct_answer` is present in the `options` array.
5. THE Validator SHALL verify that `options` contains exactly four items for `multiple_choice` questions.
6. THE Validator SHALL verify that `explanation` is non-empty and contains a minimum of 20 characters.
7. THE Validator SHALL detect duplicate question IDs within the dataset and flag them as errors.
8. THE Validator SHALL detect near-duplicate question text using string similarity (e.g., Dice coefficient) with a configurable similarity threshold.
9. THE Validator SHALL verify that `domain` and `subject` values align with the defined CompTIA N10-009 domain model or the general question category model.
10. THE Validator SHALL produce a validation report in `data/questions/reports/` listing all errors, warnings, and pass/fail counts.
11. IF a question fails validation, THEN THE Validator SHALL set the question `status` to "needs_revision".

### Requirement 7: Review Workflow

**User Story:** As a content curator, I want a review workflow that tracks question status through pending, approved, rejected, and needs_revision states, so that only human-reviewed questions are promoted to the final bank.

#### Acceptance Criteria

1. WHEN questions pass validation, THE Pipeline_CLI SHALL move them to `sources/review` grouped by domain and difficulty for batch review.
2. THE Pipeline_CLI SHALL support approving, rejecting, or marking questions as needs_revision via a CLI command.
3. THE existing admin web UI at `/admin/content` SHALL remain the primary interface for reviewing and promoting staged questions into the live Supabase tables.
4. WHEN a question is approved via CLI, THE Pipeline_CLI SHALL set `status` to "approved" and `reviewed` to true.
5. WHEN a question is rejected, THE Pipeline_CLI SHALL set `status` to "rejected" and retain the question in the review directory for audit.
6. WHEN a question is marked needs_revision, THE Pipeline_CLI SHALL set `status` to "needs_revision" and retain the question in the review directory.
7. THE Pipeline_CLI SHALL prevent questions with `status` other than "approved" from being promoted to Supabase.

### Requirement 8: Deduplication Pipeline

**User Story:** As a content curator, I want automated deduplication across all question sources, so that the bank does not contain redundant or near-identical questions.

#### Acceptance Criteria

1. THE Deduplicator SHALL compare every new question against the existing normalized pool using string similarity on the `question` field.
2. THE Deduplicator SHALL flag question pairs exceeding a configurable similarity threshold (default 0.85 Dice coefficient) as potential duplicates.
3. THE Deduplicator SHALL log all flagged pairs to the validation report with both question IDs and the similarity score.
4. THE Deduplicator SHALL support an optional embedding-based comparison mode using sentence embeddings for semantic deduplication.
5. WHEN a duplicate is detected during ingestion or generation, THE Deduplicator SHALL mark the newer question as "needs_revision" and include the ID of the suspected original in the validation report.

### Requirement 9: Lab Catalog and Question Mapping (Deferred — Future)

**User Story:** As a game designer, I want a lab catalog that maps hands-on exercises to questions and domains, so that failed battles can recommend targeted lab practice.

**Note:** This requirement is deferred to a future phase. The question schema includes `lab_related` and `lab_id` fields to support future lab integration. The full lab catalog, remediation mapping, and platform classification will be a dedicated spec when the question bank reaches sufficient coverage. Future plans include deep integration with Cisco Packet Tracer, GNS3, Wireshark, TryHackMe, and home-lab exercises, with a remediation engine that recommends labs based on battle performance.

#### Acceptance Criteria

1. THE Lab_Catalog SHALL define each lab with the following fields: id, title, category, platform, difficulty, objectives, prerequisites, estimated_time, tools_required, steps_summary, related_domains, related_subjects, related_question_ids.
2. THE Lab_Catalog SHALL be stored as a JSON file at `data/questions/labs.json` and promoted to a Supabase `labs` table when ready.
3. THE Lab_Catalog SHALL support the following platform values: "packet_tracer", "gns3", "wireshark", "cisco_modeling_labs", "tryhackme", "home_lab".
4. WHEN a question has `lab_related` set to true, THE Question_Schema SHALL require a valid `lab_id` that references an entry in the Lab_Catalog.
5. THE Lab_Catalog SHALL support a remediation mapping: given a domain and subject where a user performed poorly, the catalog SHALL return recommended lab IDs.

### Requirement 10: Difficulty and Domain Balance Tracking

**User Story:** As a content curator, I want visibility into the distribution of questions by domain, difficulty, and cognitive level, so that I can identify gaps and target generation efforts.

#### Acceptance Criteria

1. THE Pipeline_CLI SHALL query Supabase to produce a breakdown of question counts by domain, by difficulty level, and by cognitive level.
2. THE Pipeline_CLI SHALL provide a `stats` command that prints the current distribution of approved questions by domain, difficulty, cognitive level, and source type.
3. WHEN the `stats` command detects a domain with fewer than 50 approved questions, THE Pipeline_CLI SHALL flag the domain as under-represented.
4. WHEN the `stats` command detects a difficulty level with fewer than 15% of total approved questions, THE Pipeline_CLI SHALL flag the difficulty level as under-represented.

### Requirement 11: Seed-and-Append Workflow

**User Story:** As a developer, I want a seed-and-append workflow where source material is imported once and new batches are appended incrementally, so that the pipeline does not re-process previously ingested content.

#### Acceptance Criteria

1. THE Pipeline_CLI SHALL maintain an ingestion log at `data/questions/ingestion-log.json` recording each ingestion run with timestamp, source file, and count of questions produced.
2. WHEN a source file has already been recorded in the ingestion log, THE Source_Ingester SHALL skip the file and log a notice.
3. THE Pipeline_CLI SHALL support an `append` command that promotes new approved questions to Supabase without re-processing previously promoted content.
4. WHEN the `append` command is run, THE Pipeline_CLI SHALL update the local manifest with new counts and last-run timestamp.
5. THE Pipeline_CLI SHALL support a `rebuild` command that re-validates and re-promotes the complete set of approved questions from local staging files.

### Requirement 12: Ollama and Local LLM Support

**User Story:** As a developer, I want an optional path to use local LLMs via Ollama for question generation, so that generation can run without cloud API costs or rate limits.

#### Acceptance Criteria

1. WHERE the Ollama integration is enabled, THE LLM_Generator SHALL connect to a local Ollama instance at a configurable URL (default `http://localhost:11434`).
2. WHERE the Ollama integration is enabled, THE LLM_Generator SHALL support model selection from the locally available models (e.g., qwen, llama, mistral).
3. THE LLM_Generator SHALL use the same prompt templates for both cloud and local LLM paths.
4. THE LLM_Generator SHALL apply the same validation pipeline to locally generated questions as to cloud-generated questions.
5. WHERE the Ollama integration is enabled, THE LLM_Generator SHALL support few-shot prompting by including 3–5 exemplar questions from the approved bank in the user prompt.

### Requirement 13: Schema Serialization Round-Trip

**User Story:** As a developer, I want to verify that questions survive a full serialize-deserialize round trip, so that no data is lost or corrupted during JSON read/write cycles.

#### Acceptance Criteria

1. FOR ALL valid Question_Schema objects, serializing to JSON and deserializing back SHALL produce an object equivalent to the original (round-trip property).
2. THE Validator SHALL include a round-trip check as part of the validation pipeline.
3. WHEN a question fails the round-trip check, THE Validator SHALL flag the question with a "round_trip_failure" error in the validation report.

### Requirement 14: Existing System Integration

**User Story:** As a developer, I want the question pipeline to integrate with the existing Supabase-backed question engine and content ingestion system, so that approved questions can be promoted into the live game database without granting direct database access to non-super-admin users.

#### Acceptance Criteria

1. THE Pipeline_CLI SHALL provide a `promote` command that inserts approved Question_Bank entries into the Supabase `questions` and `answer_options` tables.
2. THE Pipeline_CLI SHALL map Question_Schema fields to the existing Supabase schema: `question` to `prompt`, `difficulty` to `difficulty_tier`, `explanation` to `short_explanation`, `domain` to `domain_id` (via lookup), `subject` to `topic_id` (via lookup).
3. WHEN promoting a question, THE Pipeline_CLI SHALL set `source_type` to the value from the Question_Schema and `is_active` to true.
4. THE Pipeline_CLI SHALL skip promotion of questions whose IDs already exist in the Supabase `questions` table.
5. IF a domain or topic referenced by a question does not exist in Supabase, THEN THE Pipeline_CLI SHALL log an error and skip the question.
6. THE Pipeline_CLI SHALL authenticate using `SUPABASE_SERVICE_ROLE_KEY` and SHALL only be runnable by developers with access to the `.env` file.
7. THE existing admin web UI at `/admin/content` SHALL remain gated by `ADMIN_API_SECRET` and SHALL be the only web-based path for content review and promotion.
8. THE `promote` command SHALL require a Supabase migration adding `cognitive_level` (text, nullable) and `subtopic` (text, nullable) columns to the `questions` table before first use. THE Pipeline_CLI SHALL map `cognitive_level` and `subtopic` from the Question_Schema to these new columns during promotion.

### Requirement 15: Elemental Creature-Type System Mapped to N10-009 Domains

**User Story:** As a game designer, I want each CompTIA Network+ exam domain mapped to a distinct elemental affinity with themed creature types, so that battling a creature implicitly reinforces which domain the player is studying.

#### Acceptance Criteria

1. THE Element_Map SHALL define exactly five elemental affinities, one per N10-009 domain: Fire (Networking Fundamentals), Water (Network Implementations), Earth (Network Operations), Air (Network Security), Spirit (Network Troubleshooting).
2. THE Element_Map SHALL assign each elemental affinity a pool of at least three distinct Creature_Type values drawn from fantasy archetypes (e.g., Fire: golem, mephit, salamander; Water: serpent, leviathan, naiad; Earth: treant, basilisk, gargoyle; Air: djinn, griffin, sylph; Spirit: wraith, phantom, banshee).
3. THE Element_Map SHALL exclude dragon-class creatures from all elemental pools, reserving them for future boss-tier encounters.
4. THE Element_Map SHALL be stored as a typed constant in `packages/types` so that `apps/web`, `apps/slack`, and `packages/core` share the same mapping.
5. THE Element_Map SHALL be the single source of truth for the relationship between N10-009 domains and creature types; no other module SHALL define independent domain-to-creature mappings.
6. WHEN a new Creature_Type is added to an elemental pool, THE Element_Map SHALL require the creature to be associated with exactly one elemental affinity.
7. THE Validator SHALL verify that every question with a `domain` value has a corresponding elemental affinity in the Element_Map.

### Requirement 16: CompTIA N10-009 Objective Metadata on Questions

**User Story:** As a content curator, I want each question tagged with the specific N10-009 exam objective it covers, so that question selection, reporting, and adaptive reinforcement can operate at the objective level rather than only at the domain level.

#### Acceptance Criteria

1. THE Question_Schema SHALL define the following additional required fields for N10-009 questions: `objective_id` (string matching the official CompTIA objective numbering, e.g., "1.1", "1.2", "2.3"), `objective_description` (human-readable objective title).
2. THE Question_Schema SHALL define an optional field `objective_subtopics` (array of strings) listing the specific subtopics within the objective that the question addresses (e.g., for objective 1.1: "OSI model layers", "data encapsulation").
3. THE Question_Schema SHALL constrain `objective_id` values to the set of valid CompTIA N10-009 objective identifiers as defined in the official exam objectives document.
4. THE Validator SHALL verify that `objective_id` is present and valid for all questions where `exam` is "Network+" and `exam_version` is "N10-009".
5. THE Validator SHALL verify that `objective_description` is non-empty and contains a minimum of 10 characters for all questions with a valid `objective_id`.
6. WHEN a question references objective 1.1 (OSI model), THE Question_Schema SHALL accept `objective_subtopics` values from the set: "physical layer", "data link layer", "network layer", "transport layer", "session layer", "presentation layer", "application layer", "data encapsulation", "PDU".
7. WHEN a question references objective 1.2 (networking appliances), THE Question_Schema SHALL accept `objective_subtopics` values from the set: "routers", "switches", "firewalls", "IDS/IPS", "load balancers", "proxies", "NAS", "SAN", "wireless access points", "wireless LAN controllers".
8. WHEN a question references objective 1.4 (IP addressing), THE Question_Schema SHALL accept `objective_subtopics` values from the set: "public vs. private", "APIPA", "RFC1918", "loopback", "VLSM", "CIDR", "address classes", "IPv4 subnetting", "IPv6 addressing".
9. THE Pipeline_CLI `stats` command SHALL include a breakdown of approved question counts by `objective_id` in addition to the existing domain and difficulty breakdowns.
10. IF a question has `exam` set to "General", THEN THE Question_Schema SHALL treat `objective_id` and `objective_description` as optional fields.

### Requirement 17: Question Randomization by Objective

**User Story:** As a player, I want daily questions to be randomized within each objective area, so that I encounter varied questions across study sessions and do not see the same questions repeatedly.

#### Acceptance Criteria

1. THE Question_Selector SHALL maintain a per-user history of question IDs presented within the current Rolling_Window (default 3 days).
2. WHEN selecting a question for a given domain and objective, THE Question_Selector SHALL exclude questions that appear in the user's Rolling_Window history for that objective.
3. IF all approved questions for a given objective have been presented within the Rolling_Window, THEN THE Question_Selector SHALL reset the history for that objective and select from the full pool.
4. THE Question_Selector SHALL use a pseudo-random selection algorithm seeded per user and per day so that the same user receives a consistent daily set if they revisit, but different users receive different sets.
5. THE Question_Selector SHALL store per-user question history in the Supabase database, keyed by user ID and question ID with a timestamp.
6. WHEN selecting daily questions, THE Question_Selector SHALL distribute questions across domains according to the Domain_Weight_Table baseline probabilities.
7. THE Question_Selector SHALL select a minimum of one question per domain per daily session when the total daily question count is five or greater.

### Requirement 18: Adaptive Reinforcement System

**User Story:** As a player, I want the system to give me more questions in areas where I struggle, so that I build mastery through targeted repetition of weak topics rather than random review.

#### Acceptance Criteria

1. THE Adaptive_Reinforcement_Engine SHALL track per-user answer correctness for each domain and each Creature_Type over the Rolling_Window (default 3 days).
2. WHEN a user's accuracy for a specific domain falls below 60% over the Rolling_Window, THE Adaptive_Reinforcement_Engine SHALL classify that domain as "weak" for the user.
3. WHEN a user's accuracy for a specific Creature_Type falls below 60% over the Rolling_Window, THE Adaptive_Reinforcement_Engine SHALL classify that Creature_Type as "weak" for the user.
4. WHILE a domain is classified as "weak" for a user, THE Question_Selector SHALL increase the selection probability for that domain by 50% relative to the Domain_Weight_Table baseline (redistributing the increase proportionally from non-weak domains).
5. WHEN a user's accuracy for a previously "weak" domain rises above 75% over the Rolling_Window, THE Adaptive_Reinforcement_Engine SHALL reclassify the domain as "normal" and restore baseline weighting.
6. THE Adaptive_Reinforcement_Engine SHALL store per-user accuracy aggregates in Supabase, updating after each answered question.
7. THE Adaptive_Reinforcement_Engine SHALL recalculate domain and Creature_Type accuracy at the start of each question selection event, using only answers within the Rolling_Window.
8. IF a user has answered fewer than 5 questions total within the Rolling_Window, THEN THE Adaptive_Reinforcement_Engine SHALL use Domain_Weight_Table baseline probabilities without adaptive adjustment.
9. THE Adaptive_Reinforcement_Engine SHALL log each adaptive weight adjustment (domain, old weight, new weight, trigger accuracy) to a user-scoped audit trail in Supabase for debugging and tuning.

### Requirement 19: Domain Weighting Baseline

**User Story:** As a content curator, I want question occurrence to match official CompTIA exam domain weightings as a baseline, so that study sessions reflect the actual exam distribution before adaptive adjustments are applied.

#### Acceptance Criteria

1. THE Domain_Weight_Table SHALL define baseline selection probabilities matching the CompTIA N10-009 exam weightings: Networking Fundamentals 23%, Network Implementations 19%, Network Operations 16%, Network Security 19%, Network Troubleshooting 23%.
2. THE Domain_Weight_Table SHALL be stored as a typed constant in `packages/config` so that the Question_Selector, Adaptive_Reinforcement_Engine, and Pipeline_CLI `stats` command share the same values.
3. THE Question_Selector SHALL use the Domain_Weight_Table as the starting probability distribution for every question selection event before applying adaptive adjustments.
4. WHEN the Domain_Weight_Table values are summed, THE total SHALL equal 100% (tolerance of ±0.1% for floating-point representation).
5. THE Pipeline_CLI `stats` command SHALL compare the actual distribution of approved questions per domain against the Domain_Weight_Table and flag any domain where the approved question share deviates by more than 5 percentage points from the target weight.
6. IF a domain has zero approved questions, THEN THE Question_Selector SHALL skip that domain during selection and redistribute its weight proportionally across the remaining domains, logging a warning.
7. THE Domain_Weight_Table SHALL support future extension to additional certifications by accepting an exam identifier parameter, defaulting to "N10-009".
