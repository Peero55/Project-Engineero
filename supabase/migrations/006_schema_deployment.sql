-- Deployment-ready schema constraints
-- Prevent duplicate slugs within certification/domain hierarchy
create unique index if not exists idx_domains_cert_slug on domains(certification_id, slug);
create unique index if not exists idx_topics_domain_slug on topics(domain_id, slug);
-- Prevent duplicate answer option labels per question
create unique index if not exists idx_answer_options_question_label on answer_options(question_id, label);
