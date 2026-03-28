export const player = {
  name: 'Aerin Vale',
  level: 7,
  xp: 1840,
  hp: 82,
  maxHp: 100,
  dailyStreak: 12,
  currentHunt: 'Routing Leviathan',
};

export const hunts = [
  {
    id: 'routing-leviathan',
    title: 'Routing Leviathan',
    type: 'legendary',
    domain: 'Network+ · Routing & Switching',
    progress: 82,
    description: 'Gather enough wisdom from prep creatures and mini-bosses to face the legendary domain encounter.',
  },
  {
    id: 'ports-stalker',
    title: 'Ports Stalker',
    type: 'mini-boss',
    domain: 'Network+ · Ports & Protocols',
    progress: 65,
    description: 'Short concept cluster designed to validate common protocols and port usage.',
  },
  {
    id: 'subnet-scout',
    title: 'Subnet Scout',
    type: 'encounter',
    domain: 'Network+ · IP Addressing',
    progress: 100,
    description: 'Completed prep encounter that dropped knowledge trophies for subnetting fundamentals.',
  },
];

export const battle = {
  enemy: 'Routing Leviathan',
  enemyType: 'Legendary domain boss',
  enemyHp: 380,
  enemyMaxHp: 1000,
  questionIndex: 11,
  totalQuestions: 20,
  question: 'Which routing protocol uses Dijkstra’s SPF algorithm to compute best paths in a link-state topology?',
  answers: [
    'RIP',
    'OSPF',
    'EIGRP',
    'BGP',
  ],
  trophyHint: 'Link-state protocols build a full network view before computing shortest paths.',
  mentorHint: 'Think shortest path first, not distance-vector updates.',
};

export const dashboardStats = [
  { label: 'Readiness', value: '82%' },
  { label: 'Daily Streak', value: '12' },
  { label: 'Questions Cleared', value: '418' },
];

export const weakTopics = [
  'Dynamic routing convergence',
  'Wireless security standards',
  'Troubleshooting layered outages',
];

export const strongTopics = [
  'OSI model',
  'Ports and protocols',
  'IP addressing basics',
];

export const adminImports = [
  { name: 'Network+ guide v3', source: 'Purchased PDF', status: 'Approved', questions: 184 },
  { name: 'Routing practice bank', source: 'Generated', status: 'Needs review', questions: 72 },
  { name: 'Wireless addendum', source: 'Purchased DOCX', status: 'Imported', questions: 46 },
];
