-- Seed Network+ (CompTIA N10-008) certification structure
-- Idempotent: uses ON CONFLICT DO NOTHING for re-runnable migrations
-- UUIDs use valid v4 format (version nibble 4, variant nibble 8/9/a/b) for API validation compatibility

insert into certifications (id, slug, name) values
  ('11111111-1111-4111-8111-111111111101'::uuid, 'network-plus', 'CompTIA Network+')
on conflict (slug) do nothing;

-- Domains (N10-008 exam objectives)
insert into domains (id, certification_id, slug, name, sort_order) values
  ('22222222-2222-4222-8222-222222222201'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, 'networking-fundamentals', 'Networking Fundamentals', 1),
  ('22222222-2222-4222-8222-222222222202'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, 'network-implementations', 'Network Implementations', 2),
  ('22222222-2222-4222-8222-222222222203'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, 'network-operations', 'Network Operations', 3),
  ('22222222-2222-4222-8222-222222222204'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, 'network-security', 'Network Security', 4),
  ('22222222-2222-4222-8222-222222222205'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, 'network-troubleshooting', 'Network Troubleshooting', 5)
on conflict (certification_id, slug) do nothing;

-- Topics (key subtopics per domain)
insert into topics (id, domain_id, slug, name, summary, sort_order) values
  ('33333333-3333-4333-8333-333333333301'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, 'osi-model', 'OSI Model', '7-layer model and protocol mapping', 1),
  ('33333333-3333-4333-8333-333333333302'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, 'tcp-ip', 'TCP/IP Model', '4-layer model, ports, and addressing', 2),
  ('33333333-3333-4333-8333-333333333303'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, 'subnetting', 'Subnetting', 'IPv4/IPv6 subnetting and CIDR', 3),
  ('33333333-3333-4333-8333-333333333304'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, 'ethernet', 'Ethernet Standards', 'Cabling, connectors, and standards', 1),
  ('33333333-3333-4333-8333-333333333305'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, 'wireless', 'Wireless Technologies', 'Wi-Fi standards and security', 2),
  ('33333333-3333-4333-8333-333333333306'::uuid, '22222222-2222-4222-8222-222222222203'::uuid, 'monitoring', 'Network Monitoring', 'SNMP, logs, metrics', 1),
  ('33333333-3333-4333-8333-333333333307'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, 'firewalls', 'Firewalls and ACLs', 'Stateful/stateless, rules', 1),
  ('33333333-3333-4333-8333-333333333308'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, 'troubleshooting-methodology', 'Troubleshooting Methodology', 'Identify, theorize, test, establish plan', 1)
on conflict (domain_id, slug) do nothing;

-- Sample hunt (concept hunt for Networking Fundamentals)
insert into hunts (id, domain_id, slug, name, description, hunt_type, required_progress) values
  ('44444444-4444-4444-8444-444444444401'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, 'networking-fundamentals-hunt', 'Networking Fundamentals Hunt', 'Master OSI, TCP/IP, and subnetting.', 'concept_hunt', 100)
on conflict (slug) do nothing;

-- Sample question (OSI model) - so question engine has content
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('55555555-5555-4555-8555-555555555501'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'generated', 'multiple_choice', 1,
   'At which OSI layer does TCP operate?',
   'TCP is a Transport layer (Layer 4) protocol.',
   'TCP (Transmission Control Protocol) operates at Layer 4, the Transport layer of the OSI model. It provides reliable, connection-oriented delivery with sequencing and acknowledgment.',
   true)
on conflict do nothing;

-- Answer options for sample question (idempotent via ON CONFLICT)
insert into answer_options (question_id, label, option_text, is_correct, sort_order) values
  ('55555555-5555-4555-8555-555555555501'::uuid, 'A', 'Layer 3 - Network', false, 1),
  ('55555555-5555-4555-8555-555555555501'::uuid, 'B', 'Layer 4 - Transport', true, 2),
  ('55555555-5555-4555-8555-555555555501'::uuid, 'C', 'Layer 5 - Session', false, 3),
  ('55555555-5555-4555-8555-555555555501'::uuid, 'D', 'Layer 7 - Application', false, 4)
on conflict (question_id, label) do nothing;
