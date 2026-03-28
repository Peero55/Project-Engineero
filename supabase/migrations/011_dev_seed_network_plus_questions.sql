-- Extra Network+ (N10-008) multiple-choice questions for dev/QA: progression + tier coverage.
-- Tier 1 = light, 2 = medium, 3 = heavy, 4 = ultimate (per product difficulty model).
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.
-- Skips all inserts when migration 007 seed (certifications) is not present.

do $lh011$
begin
  if exists (
    select 1 from certifications where id = '11111111-1111-4111-8111-111111111101'::uuid
  ) then

-- Tier 1 — light (4)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('66666666-6666-4666-8666-666666666601'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'generated', 'multiple_choice', 1,
   'Which OSI layer is primarily responsible for physical addressing (MAC addresses) on a LAN?',
   'Layer 2, the Data Link layer, uses MAC addresses for local delivery.',
   'The Data Link layer (Layer 2) frames traffic on a local segment and uses MAC addresses; the Physical layer (Layer 1) transmits bits but does not define MAC addressing.',
   true),
  ('66666666-6666-4666-8666-666666666602'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 1,
   'What is the default TCP port for HTTPS?',
   'HTTPS uses TCP port 443 by default.',
   'HTTPS wraps HTTP in TLS. IANA assigns the well-known port 443/tcp for HTTP over TLS.',
   true),
  ('66666666-6666-4666-8666-666666666603'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 1,
   'Per common structured cabling practice, what is the maximum recommended horizontal cable run length for twisted-pair Ethernet to a work area outlet?',
   '100 meters is the common maximum horizontal channel length for twisted-pair Ethernet.',
   'TIA/EIA standards specify a 100 m horizontal channel for copper Ethernet (patch + horizontal + outlet), beyond which attenuation and timing budgets are typically exceeded.',
   true),
  ('66666666-6666-4666-8666-666666666604'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333305'::uuid, 'generated', 'multiple_choice', 1,
   'IEEE 802.11ax is most commonly marketed to end users as which generation name?',
   '802.11ax is Wi-Fi 6.',
   'The Wi-Fi Alliance brands 802.11ax as Wi-Fi 6; 802.11ac is Wi-Fi 5, and 802.11be is Wi-Fi 7.',
   true)
on conflict (id) do nothing;

-- Tier 2 — medium (4)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('66666666-6666-4666-8666-666666666605'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'generated', 'multiple_choice', 2,
   'In an IPv4 /24 subnet that is fully assigned to one LAN, how many usable host addresses are available for devices (excluding network and broadcast)?',
   'A /24 yields 254 usable host addresses (2^8 - 2).',
   'A /24 has 256 addresses; subtract the network and broadcast addresses for a single subnet to get 254 assignable hosts.',
   true),
  ('66666666-6666-4666-8666-666666666606'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 2,
   'In a normal TCP three-way handshake, what is the third segment sent?',
   'The third segment is an ACK completing the handshake.',
   'Client sends SYN, server responds SYN-ACK, client completes with ACK. Data may follow after the connection is established.',
   true),
  ('66666666-6666-4666-8666-666666666607'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 2,
   'Which standard defines the 4-byte VLAN tag inserted into Ethernet frames for trunk links?',
   'IEEE 802.1Q adds the VLAN tag on trunks.',
   '802.1Q tagging allows switches to carry multiple VLANs on a trunk by inserting a TPID/TCI field; ISL is legacy Cisco-proprietary encapsulation.',
   true),
  ('66666666-6666-4666-8666-666666666608'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 2,
   'In classic STP (802.1D), the root bridge is selected primarily based on what?',
   'The switch with the lowest bridge priority (and tie-breaker MAC) becomes root.',
   'Bridge ID combines priority and MAC; lowest numerical bridge ID wins the root election.',
   true)
on conflict (id) do nothing;

-- Tier 3 — heavy (4)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('66666666-6666-4666-8666-666666666609'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 3,
   'OSPF (Open Shortest Path First) is best described as which type of interior gateway routing protocol?',
   'OSPF is a link-state routing protocol.',
   'OSPF floods LSAs, builds a shortest-path tree with Dijkstra, and uses areas for scalability; it is not distance-vector like RIP.',
   true),
  ('66666666-6666-4666-8666-666666666610'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, '33333333-3333-4333-8333-333333333307'::uuid, 'generated', 'multiple_choice', 3,
   'Compared to a stateful firewall, a stateless packet filter typically makes permit/deny decisions based on what?',
   'Stateless filters typically evaluate each packet using header fields (for example 5-tuple) without connection tracking.',
   'Stateful firewalls track connection state and can enforce return traffic rules; stateless ACLs generally do not maintain a session table.',
   true),
  ('66666666-6666-4666-8666-666666666611'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 3,
   'In DNS, which record type is most commonly used for reverse lookups (IP address to hostname)?',
   'PTR records map addresses to names in reverse zones.',
   'Reverse DNS uses PTR in in-addr.arpa or ip6.arpa; A/AAAA map names to addresses.',
   true),
  ('66666666-6666-4666-8666-666666666612'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333305'::uuid, 'generated', 'multiple_choice', 3,
   'WPA3-Personal improves WPA2-Personal primarily by replacing PSK 4-way handshake weakness with what approach?',
   'WPA3-Personal uses SAE (Simultaneous Authentication of Equals) for password-based networks.',
   'SAE provides forward secrecy and better resistance to offline dictionary attacks compared with WPA2 PSK exchanges in many deployments.',
   true)
on conflict (id) do nothing;

-- Tier 4 — ultimate (3 scenario-style)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('66666666-6666-4666-8666-666666666613'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 4,
   'A workstation can reach a server using its IP address but not using its fully qualified domain name. No recent changes were made on the workstation. What should you verify first?',
   'Verify DNS resolution: name-to-address mapping is failing while L3 connectivity works.',
   'If IP works but the hostname does not, DNS lookup, hosts file overrides, or split-DNS misconfiguration are prime suspects before assuming routing failures.',
   true),
  ('66666666-6666-4666-8666-666666666614'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 4,
   'Traceroute toward a remote host shows consistent timeouts at one intermediate hop, but the final destination is still reached within expected latency. What is a plausible explanation?',
   'The intermediate device may be dropping or deprioritizing probe traffic (for example ICMP TTL exceeded) while still forwarding transit traffic.',
   'Many routers rate-limit or filter ICMP time-exceeded replies; traceroute output can show asterisks without proving a black hole for actual application traffic.',
   true),
  ('66666666-6666-4666-8666-666666666615'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 4,
   'Users report intermittent loss and link flaps only on drops at the far end of a long horizontal copper run. Physical switch ports and SFPs were already swapped on the closet side. What is the best next troubleshooting focus?',
   'Re-validate the copper run: termination, cable category, distance, and potential EMI or damaged pairs.',
   'Intermittent physical-layer issues often trace to marginal cabling, bad punch-downs, bend radius violations, or interference—especially when flaps correlate with a long run.',
   true)
on conflict (id) do nothing;

-- Answer options (A–D), one correct each
insert into answer_options (question_id, label, option_text, is_correct, sort_order) values
  ('66666666-6666-4666-8666-666666666601'::uuid, 'A', 'Layer 1 – Physical', false, 1),
  ('66666666-6666-4666-8666-666666666601'::uuid, 'B', 'Layer 2 – Data Link', true, 2),
  ('66666666-6666-4666-8666-666666666601'::uuid, 'C', 'Layer 3 – Network', false, 3),
  ('66666666-6666-4666-8666-666666666601'::uuid, 'D', 'Layer 4 – Transport', false, 4),
  ('66666666-6666-4666-8666-666666666602'::uuid, 'A', 'TCP 80', false, 1),
  ('66666666-6666-4666-8666-666666666602'::uuid, 'B', 'TCP 443', true, 2),
  ('66666666-6666-4666-8666-666666666602'::uuid, 'C', 'UDP 53', false, 3),
  ('66666666-6666-4666-8666-666666666602'::uuid, 'D', 'TCP 8080', false, 4),
  ('66666666-6666-4666-8666-666666666603'::uuid, 'A', '50 meters', false, 1),
  ('66666666-6666-4666-8666-666666666603'::uuid, 'B', '100 meters', true, 2),
  ('66666666-6666-4666-8666-666666666603'::uuid, 'C', '150 meters', false, 3),
  ('66666666-6666-4666-8666-666666666603'::uuid, 'D', '500 meters', false, 4),
  ('66666666-6666-4666-8666-666666666604'::uuid, 'A', 'Wi-Fi 4', false, 1),
  ('66666666-6666-4666-8666-666666666604'::uuid, 'B', 'Wi-Fi 5', false, 2),
  ('66666666-6666-4666-8666-666666666604'::uuid, 'C', 'Wi-Fi 6', true, 3),
  ('66666666-6666-4666-8666-666666666604'::uuid, 'D', 'Wi-Fi 7', false, 4),
  ('66666666-6666-4666-8666-666666666605'::uuid, 'A', '126', false, 1),
  ('66666666-6666-4666-8666-666666666605'::uuid, 'B', '254', true, 2),
  ('66666666-6666-4666-8666-666666666605'::uuid, 'C', '256', false, 3),
  ('66666666-6666-4666-8666-666666666605'::uuid, 'D', '510', false, 4),
  ('66666666-6666-4666-8666-666666666606'::uuid, 'A', 'SYN', false, 1),
  ('66666666-6666-4666-8666-666666666606'::uuid, 'B', 'FIN', false, 2),
  ('66666666-6666-4666-8666-666666666606'::uuid, 'C', 'ACK', true, 3),
  ('66666666-6666-4666-8666-666666666606'::uuid, 'D', 'RST', false, 4),
  ('66666666-6666-4666-8666-666666666607'::uuid, 'A', 'IEEE 802.1X', false, 1),
  ('66666666-6666-4666-8666-666666666607'::uuid, 'B', 'IEEE 802.1Q', true, 2),
  ('66666666-6666-4666-8666-666666666607'::uuid, 'C', 'IEEE 802.3ad', false, 3),
  ('66666666-6666-4666-8666-666666666607'::uuid, 'D', 'IEEE 802.11', false, 4),
  ('66666666-6666-4666-8666-666666666608'::uuid, 'A', 'Lowest switch hostname alphabetically', false, 1),
  ('66666666-6666-4666-8666-666666666608'::uuid, 'B', 'Lowest bridge priority (with MAC tie-breaker)', true, 2),
  ('66666666-6666-4666-8666-666666666608'::uuid, 'C', 'Highest number of active ports', false, 3),
  ('66666666-6666-4666-8666-666666666608'::uuid, 'D', 'Oldest uptime', false, 4),
  ('66666666-6666-4666-8666-666666666609'::uuid, 'A', 'Distance-vector', false, 1),
  ('66666666-6666-4666-8666-666666666609'::uuid, 'B', 'Path-vector', false, 2),
  ('66666666-6666-4666-8666-666666666609'::uuid, 'C', 'Link-state', true, 3),
  ('66666666-6666-4666-8666-666666666609'::uuid, 'D', 'Hybrid distance-vector', false, 4),
  ('66666666-6666-4666-8666-666666666610'::uuid, 'A', 'Application payload signatures only', false, 1),
  ('66666666-6666-4666-8666-666666666610'::uuid, 'B', 'Per-packet header fields without connection state', true, 2),
  ('66666666-6666-4666-8666-666666666610'::uuid, 'C', 'TLS session resumption tickets', false, 3),
  ('66666666-6666-4666-8666-666666666610'::uuid, 'D', 'ARP cache entries', false, 4),
  ('66666666-6666-4666-8666-666666666611'::uuid, 'A', 'AAAA', false, 1),
  ('66666666-6666-4666-8666-666666666611'::uuid, 'B', 'CNAME', false, 2),
  ('66666666-6666-4666-8666-666666666611'::uuid, 'C', 'PTR', true, 3),
  ('66666666-6666-4666-8666-666666666611'::uuid, 'D', 'MX', false, 4),
  ('66666666-6666-4666-8666-666666666612'::uuid, 'A', 'WEP shared key rotation', false, 1),
  ('66666666-6666-4666-8666-666666666612'::uuid, 'B', 'TKIP with pre-shared keys only', false, 2),
  ('66666666-6666-4666-8666-666666666612'::uuid, 'C', 'SAE (Simultaneous Authentication of Equals)', true, 3),
  ('66666666-6666-4666-8666-666666666612'::uuid, 'D', '802.1X with machine certificates only', false, 4),
  ('66666666-6666-4666-8666-666666666613'::uuid, 'A', 'Default gateway misconfiguration', false, 1),
  ('66666666-6666-4666-8666-666666666613'::uuid, 'B', 'DNS resolution or name service', true, 2),
  ('66666666-6666-4666-8666-666666666613'::uuid, 'C', 'Incorrect subnet mask on the server', false, 3),
  ('66666666-6666-4666-8666-666666666613'::uuid, 'D', 'MTU black hole on the path', false, 4),
  ('66666666-6666-4666-8666-666666666614'::uuid, 'A', 'The path is broken; all traffic is dropped at that hop', false, 1),
  ('66666666-6666-4666-8666-666666666614'::uuid, 'B', 'ICMP/probe traffic may be filtered while forwarding continues', true, 2),
  ('66666666-6666-4666-8666-666666666614'::uuid, 'C', 'The destination host is down despite replies', false, 3),
  ('66666666-6666-4666-8666-666666666614'::uuid, 'D', 'You must always replace the router at that hop', false, 4),
  ('66666666-6666-4666-8666-666666666615'::uuid, 'A', 'Disable QoS on the workstation', false, 1),
  ('66666666-6666-4666-8666-666666666615'::uuid, 'B', 'Reload core switch firmware without backup', false, 2),
  ('66666666-6666-4666-8666-666666666615'::uuid, 'C', 'Re-check cable plant: terminations, length, damage, EMI', true, 3),
  ('66666666-6666-4666-8666-666666666615'::uuid, 'D', 'Assume an application bug and redeploy software', false, 4)
on conflict (question_id, label) do nothing;

  end if;
end;
$lh011$;
