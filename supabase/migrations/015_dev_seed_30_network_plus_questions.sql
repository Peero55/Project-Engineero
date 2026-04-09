-- 30 additional Network+ (N10-008) multiple-choice test questions for dev/QA.
-- Spread across all 5 domains, all 8 topics, tiers 1–4.
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING.
-- Skips all inserts when migration 007 seed (certifications) is not present.

do $seed30$
begin
  if exists (
    select 1 from certifications where id = '11111111-1111-4111-8111-111111111101'::uuid
  ) then

-- ============================================================
-- QUESTIONS (30 total)
-- ============================================================

-- Q01 — Tier 1 — OSI Model
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777701'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'generated', 'multiple_choice', 1,
   'Which OSI layer is responsible for end-to-end encryption and data formatting, such as converting between character encoding schemes?',
   'The Presentation layer (Layer 6) handles data formatting and encryption.',
   'Layer 6 translates data between the application and network formats, handling encryption, compression, and character set conversion (e.g., ASCII to EBCDIC).',
   true)
on conflict (id) do nothing;

-- Q02 — Tier 1 — TCP/IP
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777702'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 1,
   'Which protocol uses UDP port 53 by default for standard name resolution queries?',
   'DNS uses UDP port 53 for most queries.',
   'DNS typically uses UDP/53 for queries under 512 bytes. TCP/53 is used for zone transfers and large responses. DNSSEC may also trigger TCP fallback.',
   true)
on conflict (id) do nothing;

-- Q03 — Tier 1 — Ethernet
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777703'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 1,
   'What type of cable uses light to transmit data over long distances with minimal signal loss?',
   'Fiber optic cable transmits data as light pulses.',
   'Fiber optic cables use glass or plastic cores to carry light signals. Single-mode fiber supports longer distances than multimode. Both are immune to electromagnetic interference.',
   true)
on conflict (id) do nothing;

-- Q04 — Tier 1 — Wireless
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777704'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333305'::uuid, 'generated', 'multiple_choice', 1,
   'Which wireless frequency band generally provides greater range but lower throughput compared to 5 GHz?',
   '2.4 GHz has better range but lower maximum throughput than 5 GHz.',
   'The 2.4 GHz band penetrates walls better and travels farther, but has only 3 non-overlapping channels and more interference. 5 GHz offers more channels and higher speeds at shorter range.',
   true)
on conflict (id) do nothing;

-- Q05 — Tier 1 — Monitoring
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777705'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222203'::uuid, '33333333-3333-4333-8333-333333333306'::uuid, 'generated', 'multiple_choice', 1,
   'What does SNMP stand for?',
   'SNMP stands for Simple Network Management Protocol.',
   'SNMP is used to monitor and manage network devices. Agents on devices report to a management station using OIDs organized in a MIB (Management Information Base).',
   true)
on conflict (id) do nothing;

-- Q06 — Tier 1 — Firewalls
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777706'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, '33333333-3333-4333-8333-333333333307'::uuid, 'generated', 'multiple_choice', 1,
   'What is the primary purpose of an Access Control List (ACL) on a network device?',
   'ACLs filter traffic by permitting or denying packets based on defined rules.',
   'ACLs are ordered lists of permit/deny statements evaluated against packet headers. They can filter on source/destination IP, port, and protocol. They are commonly applied to router interfaces.',
   true)
on conflict (id) do nothing;

-- Q07 — Tier 1 — Troubleshooting
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777707'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 1,
   'What command-line tool sends ICMP echo requests to test basic connectivity to a remote host?',
   'The ping command sends ICMP echo requests.',
   'Ping uses ICMP Type 8 (echo request) and expects Type 0 (echo reply). It verifies Layer 3 reachability but does not test specific application ports or services.',
   true)
on conflict (id) do nothing;

-- Q08 — Tier 1 — Subnetting
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777708'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'generated', 'multiple_choice', 1,
   'What is the subnet mask for a /16 network in dotted-decimal notation?',
   'A /16 subnet mask is 255.255.0.0.',
   'A /16 prefix means the first 16 bits are network bits. In dotted decimal that is 255.255.0.0, providing 65,534 usable host addresses per subnet.',
   true)
on conflict (id) do nothing;

-- Q09 — Tier 2 — OSI Model
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777709'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'generated', 'multiple_choice', 2,
   'A switch uses MAC address tables to forward frames. At which OSI layer does this forwarding decision primarily occur?',
   'Switches operate at Layer 2 (Data Link) using MAC addresses.',
   'Layer 2 switches examine the destination MAC in each frame and consult their MAC address table (CAM table) to determine the egress port. Layer 3 switches can also route, but basic switching is a Layer 2 function.',
   true)
on conflict (id) do nothing;

-- Q10 — Tier 2 — TCP/IP
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777710'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 2,
   'Which transport-layer protocol provides connectionless, best-effort delivery without guaranteed ordering?',
   'UDP is connectionless and does not guarantee delivery or ordering.',
   'UDP (User Datagram Protocol) sends datagrams without establishing a session. It has lower overhead than TCP, making it suitable for real-time applications like VoIP and DNS queries.',
   true)
on conflict (id) do nothing;

-- Q11 — Tier 2 — Subnetting
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777711'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'generated', 'multiple_choice', 2,
   'An organization needs exactly 30 usable host addresses per subnet. What is the smallest CIDR prefix length that satisfies this requirement?',
   'A /27 provides 30 usable hosts (2^5 - 2 = 30).',
   'A /27 gives 32 addresses minus network and broadcast = 30 usable. A /28 only provides 14 usable hosts, which is insufficient.',
   true)
on conflict (id) do nothing;

-- Q12 — Tier 2 — Ethernet
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777712'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 2,
   'What is the primary advantage of using a managed switch over an unmanaged switch in an enterprise network?',
   'Managed switches allow configuration of VLANs, QoS, port security, and monitoring.',
   'Managed switches provide administrative control including VLAN segmentation, SNMP monitoring, port mirroring, spanning tree configuration, and access control. Unmanaged switches are plug-and-play with no configuration options.',
   true)
on conflict (id) do nothing;

-- Q13 — Tier 2 — Wireless
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777713'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333305'::uuid, 'generated', 'multiple_choice', 2,
   'In WPA2-Enterprise, what protocol framework is used to authenticate users against a RADIUS server?',
   'WPA2-Enterprise uses 802.1X with EAP for RADIUS-based authentication.',
   'IEEE 802.1X provides port-based network access control. EAP (Extensible Authentication Protocol) carries the authentication exchange between the supplicant and the RADIUS server through the authenticator (AP).',
   true)
on conflict (id) do nothing;

-- Q14 — Tier 2 — Monitoring
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777714'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222203'::uuid, '33333333-3333-4333-8333-333333333306'::uuid, 'generated', 'multiple_choice', 2,
   'A network administrator wants to collect flow data showing source/destination IPs, ports, and byte counts from a router. Which protocol is designed for this purpose?',
   'NetFlow (or IPFIX) collects IP traffic flow statistics from routers.',
   'NetFlow exports flow records summarizing conversations by 5-tuple (src/dst IP, src/dst port, protocol). sFlow samples packets instead. SNMP provides device metrics but not per-flow detail.',
   true)
on conflict (id) do nothing;

-- Q15 — Tier 2 — Firewalls
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777715'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, '33333333-3333-4333-8333-333333333307'::uuid, 'generated', 'multiple_choice', 2,
   'What is the key difference between an implicit deny and an explicit deny in a firewall rule set?',
   'An implicit deny is the automatic default rule at the end; an explicit deny is a manually written rule.',
   'Most firewalls append an invisible implicit deny-all at the end of the rule set. An explicit deny is a rule the administrator intentionally writes, often for logging or to block specific traffic before the implicit deny.',
   true)
on conflict (id) do nothing;

-- Q16 — Tier 2 — Troubleshooting
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777716'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 2,
   'A technician suspects a duplex mismatch between a switch port and a server NIC. Which symptom is most characteristic of this issue?',
   'Late collisions and poor throughput are classic signs of a duplex mismatch.',
   'When one side is full-duplex and the other half-duplex, the half-duplex side detects collisions while the full-duplex side does not back off. This causes late collisions, FCS errors, and degraded performance.',
   true)
on conflict (id) do nothing;

-- Q17 — Tier 3 — OSI Model
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777717'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333301'::uuid, 'generated', 'multiple_choice', 3,
   'Which OSI layer establishes, manages, and terminates sessions between applications, including dialog control and synchronization?',
   'The Session layer (Layer 5) manages application sessions.',
   'Layer 5 handles session establishment, maintenance, and teardown. It provides dialog control (half-duplex or full-duplex) and synchronization checkpoints for long data transfers. NetBIOS and RPC operate at this layer.',
   true)
on conflict (id) do nothing;

-- Q18 — Tier 3 — TCP/IP
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777718'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 3,
   'A host sends a packet to a destination on a different subnet. The source MAC in the frame leaving the host belongs to which device?',
   'The source MAC is the sending host NIC; the destination MAC is the default gateway.',
   'When traffic crosses subnets, the host frames the packet with its own source MAC and the default gateway router MAC as destination. The router then re-frames with new Layer 2 addresses for the next hop.',
   true)
on conflict (id) do nothing;

-- Q19 — Tier 3 — Subnetting
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777719'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'generated', 'multiple_choice', 3,
   'Given the IP address 172.16.45.130/26, what is the network address of this subnet?',
   'The network address is 172.16.45.128.',
   'A /26 has a block size of 64. The subnets in the fourth octet are .0, .64, .128, .192. The address .130 falls in the .128 block, so the network address is 172.16.45.128.',
   true)
on conflict (id) do nothing;

-- Q20 — Tier 3 — Ethernet
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777720'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 3,
   'Link Aggregation Control Protocol (LACP) is defined by which IEEE standard?',
   'LACP is defined by IEEE 802.3ad (now part of 802.1AX).',
   'LACP dynamically negotiates bundling multiple physical links into one logical link for increased bandwidth and redundancy. Both sides must support and enable LACP for negotiation to succeed.',
   true)
on conflict (id) do nothing;

-- Q21 — Tier 3 — Wireless
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777721'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333305'::uuid, 'generated', 'multiple_choice', 3,
   'An administrator deploys a wireless network and notices co-channel interference. What is the recommended approach for 2.4 GHz channel assignment to minimize overlap?',
   'Use non-overlapping channels 1, 6, and 11.',
   'In the 2.4 GHz band, channels 1, 6, and 11 are the only three that do not overlap each other. Assigning adjacent APs to different non-overlapping channels minimizes co-channel interference.',
   true)
on conflict (id) do nothing;

-- Q22 — Tier 3 — Monitoring
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777722'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222203'::uuid, '33333333-3333-4333-8333-333333333306'::uuid, 'generated', 'multiple_choice', 3,
   'An administrator needs to capture and analyze all traffic on a specific switch port for troubleshooting. Which switch feature should be configured?',
   'Port mirroring (SPAN) copies traffic from one port to a monitoring port.',
   'Switched Port Analyzer (SPAN) or port mirroring duplicates traffic from a source port or VLAN to a destination port where a packet analyzer can capture it. This does not affect normal traffic flow on the source port.',
   true)
on conflict (id) do nothing;

-- Q23 — Tier 3 — Firewalls
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777723'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, '33333333-3333-4333-8333-333333333307'::uuid, 'generated', 'multiple_choice', 3,
   'A next-generation firewall (NGFW) can inspect encrypted HTTPS traffic by performing TLS interception. What must be deployed on client machines for this to work transparently?',
   'The firewall CA certificate must be trusted by client machines.',
   'TLS interception (SSL inspection) requires the firewall to act as a man-in-the-middle, re-signing certificates with its own CA. Clients must trust this CA certificate to avoid browser warnings.',
   true)
on conflict (id) do nothing;

-- Q24 — Tier 3 — Troubleshooting
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777724'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 3,
   'A user reports they can access internal resources but cannot reach any external websites. Their IP configuration shows a valid IP, subnet mask, and DNS server, but the default gateway field is blank. What is the most likely cause?',
   'Missing default gateway prevents traffic from being routed off the local subnet.',
   'Without a default gateway, the host has no next-hop for traffic destined outside its subnet. Local resources on the same subnet work because they do not require routing. DHCP misconfiguration or a static IP setup error are common causes.',
   true)
on conflict (id) do nothing;

-- Q25 — Tier 4 — OSI Model / TCP-IP (scenario)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777725'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333302'::uuid, 'generated', 'multiple_choice', 4,
   'A network engineer captures traffic and sees TCP retransmissions with exponentially increasing delays between attempts. The server is reachable via ICMP. Which mechanism is most likely responsible for the increasing delays?',
   'TCP exponential backoff increases retransmission intervals after each failed attempt.',
   'TCP uses exponential backoff for retransmissions: each successive retry doubles the wait time. This prevents congestion collapse. If ICMP works but TCP does not complete, a stateful firewall, application crash, or port filter may be blocking the specific TCP session.',
   true)
on conflict (id) do nothing;

-- Q26 — Tier 4 — Subnetting (scenario)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777726'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222201'::uuid, '33333333-3333-4333-8333-333333333303'::uuid, 'generated', 'multiple_choice', 4,
   'A company has been assigned 10.20.0.0/22 and needs to create 4 equal subnets. What prefix length should each subnet use, and how many usable hosts does each provide?',
   'Each subnet is a /24 with 254 usable hosts.',
   'A /22 has 1024 addresses. Dividing into 4 equal subnets requires 2 additional bits, yielding /24 subnets (256 addresses each, 254 usable). The subnets are 10.20.0.0/24, 10.20.1.0/24, 10.20.2.0/24, and 10.20.3.0/24.',
   true)
on conflict (id) do nothing;

-- Q27 — Tier 4 — Wireless / Security (scenario)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777727'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222204'::uuid, '33333333-3333-4333-8333-333333333307'::uuid, 'generated', 'multiple_choice', 4,
   'A security analyst discovers an unauthorized wireless access point connected to a switch port in a conference room. The rogue AP is bridging wireless clients onto the corporate LAN. What is the most effective immediate mitigation?',
   'Disable the switch port the rogue AP is connected to.',
   'Shutting down the switch port immediately isolates the rogue AP from the network. Long-term, 802.1X port-based authentication and wireless intrusion detection/prevention systems (WIDS/WIPS) should be deployed to prevent recurrence.',
   true)
on conflict (id) do nothing;

-- Q28 — Tier 4 — Monitoring / Operations (scenario)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777728'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222203'::uuid, '33333333-3333-4333-8333-333333333306'::uuid, 'generated', 'multiple_choice', 4,
   'After a core switch upgrade, SNMP polling from the NMS returns "no such object" errors for interface counters that previously worked. The switch is reachable and responds to SNMP. What is the most likely cause?',
   'The new firmware may use different MIB OIDs or require an updated MIB file on the NMS.',
   'Firmware upgrades can change or deprecate SNMP OIDs. The NMS needs the correct MIB definitions matching the new firmware. Verifying the MIB version and re-importing updated MIBs typically resolves "no such object" errors.',
   true)
on conflict (id) do nothing;

-- Q29 — Tier 4 — Troubleshooting (scenario)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777729'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222205'::uuid, '33333333-3333-4333-8333-333333333308'::uuid, 'generated', 'multiple_choice', 4,
   'Multiple VLANs share a single trunk link between two switches. Users on VLAN 20 report no connectivity, but VLAN 10 and VLAN 30 work fine. The trunk is up and passing traffic. What should the administrator check first?',
   'Verify that VLAN 20 is allowed on the trunk link on both switches.',
   'Trunk links can be configured to allow only specific VLANs. If VLAN 20 was pruned or not added to the allowed list on either end, its traffic will not traverse the trunk even though other VLANs work normally.',
   true)
on conflict (id) do nothing;

-- Q30 — Tier 4 — Ethernet / Troubleshooting (scenario)
insert into questions (id, certification_id, domain_id, topic_id, source_type, question_type, difficulty_tier, prompt, short_explanation, long_explanation, is_active) values
  ('77777777-7777-4777-8777-777777777730'::uuid, '11111111-1111-4111-8111-111111111101'::uuid, '22222222-2222-4222-8222-222222222202'::uuid, '33333333-3333-4333-8333-333333333304'::uuid, 'generated', 'multiple_choice', 4,
   'A network experiences a broadcast storm after a new switch is added. STP was disabled on the new switch. After re-enabling STP, the storm stops but one uplink enters a blocking state. Why is this expected behavior?',
   'STP intentionally blocks redundant paths to prevent loops.',
   'Spanning Tree Protocol detects loops and places redundant ports into blocking state. This is by design: only one active path exists between any two switches, preventing broadcast storms. The blocked port becomes a backup that activates if the primary path fails.',
   true)
on conflict (id) do nothing;

-- ============================================================
-- ANSWER OPTIONS (4 per question, 120 total)
-- ============================================================

-- Q01 answers
insert into answer_options (question_id, label, option_text, is_correct, sort_order) values
  ('77777777-7777-4777-8777-777777777701'::uuid, 'A', 'Application (Layer 7)', false, 1),
  ('77777777-7777-4777-8777-777777777701'::uuid, 'B', 'Session (Layer 5)', false, 2),
  ('77777777-7777-4777-8777-777777777701'::uuid, 'C', 'Presentation (Layer 6)', true, 3),
  ('77777777-7777-4777-8777-777777777701'::uuid, 'D', 'Transport (Layer 4)', false, 4),
-- Q02 answers
  ('77777777-7777-4777-8777-777777777702'::uuid, 'A', 'DHCP', false, 1),
  ('77777777-7777-4777-8777-777777777702'::uuid, 'B', 'DNS', true, 2),
  ('77777777-7777-4777-8777-777777777702'::uuid, 'C', 'SMTP', false, 3),
  ('77777777-7777-4777-8777-777777777702'::uuid, 'D', 'SNMP', false, 4),
-- Q03 answers
  ('77777777-7777-4777-8777-777777777703'::uuid, 'A', 'Coaxial cable', false, 1),
  ('77777777-7777-4777-8777-777777777703'::uuid, 'B', 'Fiber optic cable', true, 2),
  ('77777777-7777-4777-8777-777777777703'::uuid, 'C', 'Cat 6 UTP', false, 3),
  ('77777777-7777-4777-8777-777777777703'::uuid, 'D', 'Cat 5e STP', false, 4),
-- Q04 answers
  ('77777777-7777-4777-8777-777777777704'::uuid, 'A', '2.4 GHz', true, 1),
  ('77777777-7777-4777-8777-777777777704'::uuid, 'B', '5 GHz', false, 2),
  ('77777777-7777-4777-8777-777777777704'::uuid, 'C', '6 GHz', false, 3),
  ('77777777-7777-4777-8777-777777777704'::uuid, 'D', '60 GHz', false, 4),
-- Q05 answers
  ('77777777-7777-4777-8777-777777777705'::uuid, 'A', 'Secure Network Management Protocol', false, 1),
  ('77777777-7777-4777-8777-777777777705'::uuid, 'B', 'Simple Network Management Protocol', true, 2),
  ('77777777-7777-4777-8777-777777777705'::uuid, 'C', 'Standard Network Monitoring Protocol', false, 3),
  ('77777777-7777-4777-8777-777777777705'::uuid, 'D', 'System Network Messaging Protocol', false, 4),
-- Q06 answers
  ('77777777-7777-4777-8777-777777777706'::uuid, 'A', 'Encrypt traffic between VLANs', false, 1),
  ('77777777-7777-4777-8777-777777777706'::uuid, 'B', 'Filter traffic by permitting or denying packets', true, 2),
  ('77777777-7777-4777-8777-777777777706'::uuid, 'C', 'Assign IP addresses to hosts', false, 3),
  ('77777777-7777-4777-8777-777777777706'::uuid, 'D', 'Aggregate multiple physical links', false, 4),
-- Q07 answers
  ('77777777-7777-4777-8777-777777777707'::uuid, 'A', 'traceroute', false, 1),
  ('77777777-7777-4777-8777-777777777707'::uuid, 'B', 'nslookup', false, 2),
  ('77777777-7777-4777-8777-777777777707'::uuid, 'C', 'ping', true, 3),
  ('77777777-7777-4777-8777-777777777707'::uuid, 'D', 'netstat', false, 4),
-- Q08 answers
  ('77777777-7777-4777-8777-777777777708'::uuid, 'A', '255.0.0.0', false, 1),
  ('77777777-7777-4777-8777-777777777708'::uuid, 'B', '255.255.0.0', true, 2),
  ('77777777-7777-4777-8777-777777777708'::uuid, 'C', '255.255.255.0', false, 3),
  ('77777777-7777-4777-8777-777777777708'::uuid, 'D', '255.255.128.0', false, 4),
-- Q09 answers
  ('77777777-7777-4777-8777-777777777709'::uuid, 'A', 'Layer 1 – Physical', false, 1),
  ('77777777-7777-4777-8777-777777777709'::uuid, 'B', 'Layer 2 – Data Link', true, 2),
  ('77777777-7777-4777-8777-777777777709'::uuid, 'C', 'Layer 3 – Network', false, 3),
  ('77777777-7777-4777-8777-777777777709'::uuid, 'D', 'Layer 7 – Application', false, 4),
-- Q10 answers
  ('77777777-7777-4777-8777-777777777710'::uuid, 'A', 'TCP', false, 1),
  ('77777777-7777-4777-8777-777777777710'::uuid, 'B', 'UDP', true, 2),
  ('77777777-7777-4777-8777-777777777710'::uuid, 'C', 'SCTP', false, 3),
  ('77777777-7777-4777-8777-777777777710'::uuid, 'D', 'ICMP', false, 4)
on conflict (question_id, label) do nothing;

-- Q11 answers
insert into answer_options (question_id, label, option_text, is_correct, sort_order) values
  ('77777777-7777-4777-8777-777777777711'::uuid, 'A', '/26 (62 hosts)', false, 1),
  ('77777777-7777-4777-8777-777777777711'::uuid, 'B', '/27 (30 hosts)', true, 2),
  ('77777777-7777-4777-8777-777777777711'::uuid, 'C', '/28 (14 hosts)', false, 3),
  ('77777777-7777-4777-8777-777777777711'::uuid, 'D', '/29 (6 hosts)', false, 4),
-- Q12 answers
  ('77777777-7777-4777-8777-777777777712'::uuid, 'A', 'Lower purchase cost', false, 1),
  ('77777777-7777-4777-8777-777777777712'::uuid, 'B', 'VLANs, QoS, port security, and monitoring', true, 2),
  ('77777777-7777-4777-8777-777777777712'::uuid, 'C', 'Faster switching speeds', false, 3),
  ('77777777-7777-4777-8777-777777777712'::uuid, 'D', 'Built-in wireless access point', false, 4),
-- Q13 answers
  ('77777777-7777-4777-8777-777777777713'::uuid, 'A', 'WEP with shared key', false, 1),
  ('77777777-7777-4777-8777-777777777713'::uuid, 'B', 'MAC address filtering', false, 2),
  ('77777777-7777-4777-8777-777777777713'::uuid, 'C', '802.1X with EAP', true, 3),
  ('77777777-7777-4777-8777-777777777713'::uuid, 'D', 'Captive portal with LDAP', false, 4),
-- Q14 answers
  ('77777777-7777-4777-8777-777777777714'::uuid, 'A', 'SNMP', false, 1),
  ('77777777-7777-4777-8777-777777777714'::uuid, 'B', 'Syslog', false, 2),
  ('77777777-7777-4777-8777-777777777714'::uuid, 'C', 'NetFlow', true, 3),
  ('77777777-7777-4777-8777-777777777714'::uuid, 'D', 'NTP', false, 4),
-- Q15 answers
  ('77777777-7777-4777-8777-777777777715'::uuid, 'A', 'Implicit deny is written by the admin; explicit deny is automatic', false, 1),
  ('77777777-7777-4777-8777-777777777715'::uuid, 'B', 'Implicit deny is the automatic default; explicit deny is manually configured', true, 2),
  ('77777777-7777-4777-8777-777777777715'::uuid, 'C', 'They are identical in function and placement', false, 3),
  ('77777777-7777-4777-8777-777777777715'::uuid, 'D', 'Explicit deny only applies to outbound traffic', false, 4),
-- Q16 answers
  ('77777777-7777-4777-8777-777777777716'::uuid, 'A', 'DNS resolution failures', false, 1),
  ('77777777-7777-4777-8777-777777777716'::uuid, 'B', 'Late collisions and degraded throughput', true, 2),
  ('77777777-7777-4777-8777-777777777716'::uuid, 'C', 'DHCP lease exhaustion', false, 3),
  ('77777777-7777-4777-8777-777777777716'::uuid, 'D', 'Spanning tree topology changes', false, 4),
-- Q17 answers
  ('77777777-7777-4777-8777-777777777717'::uuid, 'A', 'Transport (Layer 4)', false, 1),
  ('77777777-7777-4777-8777-777777777717'::uuid, 'B', 'Session (Layer 5)', true, 2),
  ('77777777-7777-4777-8777-777777777717'::uuid, 'C', 'Presentation (Layer 6)', false, 3),
  ('77777777-7777-4777-8777-777777777717'::uuid, 'D', 'Application (Layer 7)', false, 4),
-- Q18 answers
  ('77777777-7777-4777-8777-777777777718'::uuid, 'A', 'The sending host', true, 1),
  ('77777777-7777-4777-8777-777777777718'::uuid, 'B', 'The default gateway router', false, 2),
  ('77777777-7777-4777-8777-777777777718'::uuid, 'C', 'The destination server', false, 3),
  ('77777777-7777-4777-8777-777777777718'::uuid, 'D', 'The DNS server', false, 4),
-- Q19 answers
  ('77777777-7777-4777-8777-777777777719'::uuid, 'A', '172.16.45.0', false, 1),
  ('77777777-7777-4777-8777-777777777719'::uuid, 'B', '172.16.45.64', false, 2),
  ('77777777-7777-4777-8777-777777777719'::uuid, 'C', '172.16.45.128', true, 3),
  ('77777777-7777-4777-8777-777777777719'::uuid, 'D', '172.16.45.192', false, 4),
-- Q20 answers
  ('77777777-7777-4777-8777-777777777720'::uuid, 'A', 'IEEE 802.1Q', false, 1),
  ('77777777-7777-4777-8777-777777777720'::uuid, 'B', 'IEEE 802.3ad', true, 2),
  ('77777777-7777-4777-8777-777777777720'::uuid, 'C', 'IEEE 802.1X', false, 3),
  ('77777777-7777-4777-8777-777777777720'::uuid, 'D', 'IEEE 802.11ac', false, 4)
on conflict (question_id, label) do nothing;

-- Q21 answers
insert into answer_options (question_id, label, option_text, is_correct, sort_order) values
  ('77777777-7777-4777-8777-777777777721'::uuid, 'A', 'Use channels 1, 3, and 5', false, 1),
  ('77777777-7777-4777-8777-777777777721'::uuid, 'B', 'Use channels 1, 6, and 11', true, 2),
  ('77777777-7777-4777-8777-777777777721'::uuid, 'C', 'Use channels 2, 7, and 12', false, 3),
  ('77777777-7777-4777-8777-777777777721'::uuid, 'D', 'Use only channel 6 for all APs', false, 4),
-- Q22 answers
  ('77777777-7777-4777-8777-777777777722'::uuid, 'A', 'VLAN trunking', false, 1),
  ('77777777-7777-4777-8777-777777777722'::uuid, 'B', 'Port mirroring (SPAN)', true, 2),
  ('77777777-7777-4777-8777-777777777722'::uuid, 'C', 'Link aggregation', false, 3),
  ('77777777-7777-4777-8777-777777777722'::uuid, 'D', 'Port security with sticky MAC', false, 4),
-- Q23 answers
  ('77777777-7777-4777-8777-777777777723'::uuid, 'A', 'The RADIUS server shared secret', false, 1),
  ('77777777-7777-4777-8777-777777777723'::uuid, 'B', 'The firewall CA certificate in the client trust store', true, 2),
  ('77777777-7777-4777-8777-777777777723'::uuid, 'C', 'A VPN client on every workstation', false, 3),
  ('77777777-7777-4777-8777-777777777723'::uuid, 'D', 'DNS-over-HTTPS enabled in the browser', false, 4),
-- Q24 answers
  ('77777777-7777-4777-8777-777777777724'::uuid, 'A', 'Incorrect DNS server address', false, 1),
  ('77777777-7777-4777-8777-777777777724'::uuid, 'B', 'Duplicate IP address on the LAN', false, 2),
  ('77777777-7777-4777-8777-777777777724'::uuid, 'C', 'Missing default gateway', true, 3),
  ('77777777-7777-4777-8777-777777777724'::uuid, 'D', 'Expired DHCP lease', false, 4),
-- Q25 answers
  ('77777777-7777-4777-8777-777777777725'::uuid, 'A', 'TCP sliding window adjustment', false, 1),
  ('77777777-7777-4777-8777-777777777725'::uuid, 'B', 'TCP exponential backoff', true, 2),
  ('77777777-7777-4777-8777-777777777725'::uuid, 'C', 'ICMP redirect messages', false, 3),
  ('77777777-7777-4777-8777-777777777725'::uuid, 'D', 'ARP cache timeout', false, 4),
-- Q26 answers
  ('77777777-7777-4777-8777-777777777726'::uuid, 'A', '/23 with 510 usable hosts each', false, 1),
  ('77777777-7777-4777-8777-777777777726'::uuid, 'B', '/24 with 254 usable hosts each', true, 2),
  ('77777777-7777-4777-8777-777777777726'::uuid, 'C', '/25 with 126 usable hosts each', false, 3),
  ('77777777-7777-4777-8777-777777777726'::uuid, 'D', '/26 with 62 usable hosts each', false, 4),
-- Q27 answers
  ('77777777-7777-4777-8777-777777777727'::uuid, 'A', 'Change the SSID of the corporate network', false, 1),
  ('77777777-7777-4777-8777-777777777727'::uuid, 'B', 'Disable the switch port the rogue AP is connected to', true, 2),
  ('77777777-7777-4777-8777-777777777727'::uuid, 'C', 'Enable WPA3 on all corporate APs', false, 3),
  ('77777777-7777-4777-8777-777777777727'::uuid, 'D', 'Reboot the core switch', false, 4),
-- Q28 answers
  ('77777777-7777-4777-8777-777777777728'::uuid, 'A', 'SNMP community string was changed', false, 1),
  ('77777777-7777-4777-8777-777777777728'::uuid, 'B', 'The NMS MIB definitions do not match the new firmware OIDs', true, 2),
  ('77777777-7777-4777-8777-777777777728'::uuid, 'C', 'The switch no longer supports SNMP', false, 3),
  ('77777777-7777-4777-8777-777777777728'::uuid, 'D', 'A firewall is blocking UDP port 161', false, 4),
-- Q29 answers
  ('77777777-7777-4777-8777-777777777729'::uuid, 'A', 'Replace the trunk cable', false, 1),
  ('77777777-7777-4777-8777-777777777729'::uuid, 'B', 'Verify VLAN 20 is in the trunk allowed list on both switches', true, 2),
  ('77777777-7777-4777-8777-777777777729'::uuid, 'C', 'Reboot both switches', false, 3),
  ('77777777-7777-4777-8777-777777777729'::uuid, 'D', 'Disable STP on the trunk ports', false, 4),
-- Q30 answers
  ('77777777-7777-4777-8777-777777777730'::uuid, 'A', 'STP is malfunctioning and should be disabled again', false, 1),
  ('77777777-7777-4777-8777-777777777730'::uuid, 'B', 'STP blocks redundant paths to prevent loops', true, 2),
  ('77777777-7777-4777-8777-777777777730'::uuid, 'C', 'The blocked port has a bad cable', false, 3),
  ('77777777-7777-4777-8777-777777777730'::uuid, 'D', 'The switch needs a firmware update to support STP', false, 4)
on conflict (question_id, label) do nothing;

  end if;
end;
$seed30$;
