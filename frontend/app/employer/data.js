/* Illustrative employer-side data.
   Skill ids, role ids and the two demo personas mirror js/mock-data.js so the
   candidate site and the employer site always tell the same story. */

export const locations = ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Remote'];
export const qualifications = ['SPM', 'Certificate', 'Diploma', 'Degree', 'Other'];

export const skills = {
  excel: { name: 'Excel', category: 'Digital' },
  python: { name: 'Python', category: 'Technical' },
  sql: { name: 'SQL', category: 'Technical' },
  'data-viz': { name: 'Data Visualisation', category: 'Analytical' },
  web: { name: 'HTML/CSS', category: 'Technical' },
  javascript: { name: 'JavaScript', category: 'Technical' },
  communication: { name: 'Communication', category: 'Communication' },
  teamwork: { name: 'Teamwork', category: 'Teamwork' },
  troubleshoot: { name: 'Troubleshooting', category: 'Analytical' },
  reporting: { name: 'Reporting', category: 'Analytical' },
  marketing: { name: 'Digital Marketing', category: 'Digital' },
  content: { name: 'Content Writing', category: 'Communication' },
  tools: { name: 'Mechanical Tools', category: 'Technical' },
  auto: { name: 'Automotive Maintenance', category: 'Technical' },
  electrical: { name: 'Basic Electrical', category: 'Technical' },
  safety: { name: 'Safety Practices', category: 'Technical' },
  sensors: { name: 'Sensors', category: 'Technical' },
  networking: { name: 'Computer Networking', category: 'Digital' }
};

/* Requirements use the same shape as jobs[].requirements in js/mock-data.js:
   [skillId, expected level 0-5, weight]. */
export const roles = [
  {
    id: 'junior-data-analyst', title: 'Junior Data Analyst', sector: 'Technology & Data',
    location: 'Kuala Lumpur', tags: ['data', 'technology'],
    summary: 'Turn raw data into reports that help teams make day-to-day decisions.',
    requirements: [
      { skillId: 'excel', level: 4, weight: 0.2 },
      { skillId: 'sql', level: 4, weight: 0.3 },
      { skillId: 'python', level: 3, weight: 0.15 },
      { skillId: 'data-viz', level: 4, weight: 0.25 },
      { skillId: 'communication', level: 3, weight: 0.1 }
    ]
  },
  {
    id: 'business-intelligence-analyst', title: 'Business Intelligence Analyst', sector: 'Technology & Data',
    location: 'Selangor', tags: ['data', 'business'],
    summary: 'Translate business questions into metrics, dashboards and regular performance reports.',
    requirements: [
      { skillId: 'sql', level: 4, weight: 0.3 },
      { skillId: 'data-viz', level: 5, weight: 0.25 },
      { skillId: 'reporting', level: 4, weight: 0.2 },
      { skillId: 'excel', level: 4, weight: 0.15 },
      { skillId: 'communication', level: 4, weight: 0.1 }
    ]
  },
  {
    id: 'frontend-web-developer', title: 'Frontend Web Developer', sector: 'Web & Software',
    location: 'Kuala Lumpur', tags: ['technology', 'creative'],
    summary: 'Build responsive interfaces and make websites usable across devices.',
    requirements: [
      { skillId: 'web', level: 4, weight: 0.35 },
      { skillId: 'javascript', level: 4, weight: 0.25 },
      { skillId: 'troubleshoot', level: 3, weight: 0.15 },
      { skillId: 'teamwork', level: 3, weight: 0.15 },
      { skillId: 'communication', level: 3, weight: 0.1 }
    ]
  },
  {
    id: 'digital-marketing-executive', title: 'Digital Marketing Executive', sector: 'Marketing & Media',
    location: 'Kuala Lumpur', tags: ['creative', 'business'],
    summary: 'Plan content and track how digital campaigns perform.',
    requirements: [
      { skillId: 'marketing', level: 4, weight: 0.35 },
      { skillId: 'content', level: 4, weight: 0.2 },
      { skillId: 'reporting', level: 3, weight: 0.15 },
      { skillId: 'excel', level: 3, weight: 0.15 },
      { skillId: 'communication', level: 3, weight: 0.15 }
    ]
  },
  {
    id: 'operations-coordinator', title: 'Operations Coordinator', sector: 'Business Operations',
    location: 'Johor', tags: ['business', 'data'],
    summary: 'Keep daily work organised through scheduling, tracking and reporting.',
    requirements: [
      { skillId: 'excel', level: 5, weight: 0.25 },
      { skillId: 'reporting', level: 4, weight: 0.25 },
      { skillId: 'teamwork', level: 4, weight: 0.2 },
      { skillId: 'communication', level: 4, weight: 0.2 },
      { skillId: 'troubleshoot', level: 3, weight: 0.1 }
    ]
  },
  {
    id: 'automotive-technician', title: 'Automotive Technician', sector: 'Automotive & TVET',
    location: 'Perak', tags: ['automotive', 'mechanical', 'electronics'],
    summary: 'Inspect vehicles, support routine servicing and document diagnostic work.',
    requirements: [
      { skillId: 'tools', level: 4, weight: 0.2 },
      { skillId: 'auto', level: 3, weight: 0.25 },
      { skillId: 'safety', level: 4, weight: 0.2 },
      { skillId: 'electrical', level: 4, weight: 0.15 },
      { skillId: 'troubleshoot', level: 4, weight: 0.1 },
      { skillId: 'sensors', level: 3, weight: 0.1 }
    ]
  }
];

/* Twelve profiles. `shared` mirrors candidate consent: only shared profiles are
   listed and only their detail routes exist. */
export const candidates = [
  {
    id: 'aina-rahman', name: 'Aina Rahman', initials: 'AR', photo: '/assets/personas/aina.jpg',
    headline: 'IT diploma graduate', qualification: 'Diploma', field: 'Information Technology',
    location: 'Selangor', availability: 'Available now',
    interests: ['data', 'technology'], shared: true,
    scores: { excel: 4, python: 2, sql: 1, 'data-viz': 1, web: 3, communication: 3, teamwork: 4, troubleshoot: 2, reporting: 3, marketing: 1 },
    evidence: [
      { skillId: 'excel', level: 4, source: 'Campus society attendance spreadsheet and monthly report', verified: true },
      { skillId: 'reporting', level: 3, source: 'Monthly committee reports for a campus society' },
      { skillId: 'teamwork', level: 4, source: 'Society committee work with a supervisor reference', verified: true },
      { skillId: 'web', level: 3, source: 'Responsive coursework site built in a web module' },
      { skillId: 'communication', level: 3, source: 'Part-time office administration' },
      { skillId: 'python', level: 2, source: 'Coursework practice exercises' }
    ],
    portfolio: [
      { title: 'Campus attendance report', type: 'Project', skills: ['excel', 'reporting'] },
      { title: 'Responsive coursework site', type: 'Coursework', skills: ['web'] },
      { title: 'Python practice notebook', type: 'Practice', skills: ['python'] }
    ],
    roadmap: { phase: 2, done: 5, total: 9 }
  },
  {
    id: 'amir-hakim', name: 'Amir Hakim', initials: 'AH', photo: '/assets/personas/amir.jpg',
    headline: 'SPM leaver with workshop experience', qualification: 'SPM', field: 'General studies',
    location: 'Perak', availability: 'Available now',
    interests: ['automotive', 'mechanical', 'electronics'], shared: true,
    scores: { tools: 4, troubleshoot: 3, auto: 3, electrical: 2, safety: 2, sensors: 1, communication: 3, teamwork: 3, excel: 1, sql: 0 },
    evidence: [
      { skillId: 'tools', level: 4, source: 'Family motorcycle workshop, working under supervision', verified: true },
      { skillId: 'auto', level: 3, source: 'Routine service support and job documentation' },
      { skillId: 'troubleshoot', level: 3, source: 'Recurring fault log kept for the workshop' },
      { skillId: 'safety', level: 2, source: 'Workshop induction and supervised practice' },
      { skillId: 'communication', level: 3, source: 'Documented service jobs for customers' },
      { skillId: 'electrical', level: 2, source: 'Observed basic electrical and sensor checks' }
    ],
    portfolio: [
      { title: 'Routine service checklist', type: 'Project', skills: ['tools', 'auto', 'safety'] },
      { title: 'Recurring fault log', type: 'Practice', skills: ['troubleshoot'] }
    ],
    roadmap: { phase: 1, done: 3, total: 8 }
  },
  {
    id: 'nurul-izzah', name: 'Nurul Izzah', initials: 'NI', photo: '/assets/personas/nurul-izzah.jpg',
    headline: 'Business administration diploma, operations focus', qualification: 'Diploma', field: 'Business administration',
    location: 'Johor', availability: 'Available now',
    interests: ['business', 'data'], shared: true,
    scores: { excel: 5, reporting: 4, teamwork: 4, communication: 3, troubleshoot: 3, marketing: 2, content: 2, sql: 1, python: 0, 'data-viz': 2 },
    evidence: [
      { skillId: 'excel', level: 5, source: 'Stock and delivery tracker maintained for a family shop', verified: true },
      { skillId: 'reporting', level: 4, source: 'Weekly stock summary shared with the shop owner' },
      { skillId: 'teamwork', level: 4, source: 'Coordinated weekend shifts for four staff' },
      { skillId: 'troubleshoot', level: 3, source: 'Resolved late-delivery handoffs and recorded causes' },
      { skillId: 'communication', level: 3, source: 'Supplier follow-ups by phone and message' },
      { skillId: 'data-viz', level: 2, source: 'Simple charts in the monthly summary' }
    ],
    portfolio: [
      { title: 'Stock and delivery tracker', type: 'Project', skills: ['excel', 'reporting'] },
      { title: 'Shift handover notes', type: 'Practice', skills: ['communication', 'teamwork'] }
    ],
    roadmap: { phase: 3, done: 7, total: 10 }
  },
  {
    id: 'daniel-tan', name: 'Daniel Tan', initials: 'DT', photo: '/assets/personas/daniel-tan.jpg',
    headline: 'Computer science degree, frontend projects', qualification: 'Degree', field: 'Computer science',
    location: 'Kuala Lumpur', availability: '1 month notice',
    interests: ['technology', 'creative'], shared: true,
    scores: { web: 5, javascript: 4, troubleshoot: 3, teamwork: 3, communication: 3, sql: 2, python: 2, excel: 2, reporting: 2, 'data-viz': 1 },
    evidence: [
      { skillId: 'web', level: 5, source: 'Three responsive sites shipped for campus clubs', verified: true },
      { skillId: 'javascript', level: 4, source: 'Interactive booking form for a student event' },
      { skillId: 'troubleshoot', level: 3, source: 'Accessibility and cross-browser fixes documented in a changelog' },
      { skillId: 'teamwork', level: 3, source: 'Four-person coursework team, frontend lead' },
      { skillId: 'communication', level: 3, source: 'Presented a project demo to a module panel' },
      { skillId: 'sql', level: 2, source: 'Coursework queries against a sample database' }
    ],
    portfolio: [
      { title: 'Club booking interface', type: 'Project', skills: ['web', 'javascript'] },
      { title: 'Accessibility fix log', type: 'Practice', skills: ['troubleshoot'] }
    ],
    roadmap: { phase: 2, done: 4, total: 8 }
  },
  {
    id: 'priya-selvam', name: 'Priya Selvam', initials: 'PS', photo: '/assets/personas/priya-selvam.jpg',
    headline: 'Statistics diploma, reporting and dashboards', qualification: 'Diploma', field: 'Statistics',
    location: 'Penang', availability: 'Available now',
    interests: ['data', 'business'], shared: true,
    scores: { sql: 4, 'data-viz': 5, reporting: 4, excel: 4, communication: 3, python: 3, teamwork: 3, troubleshoot: 2, marketing: 1, web: 1 },
    evidence: [
      { skillId: 'sql', level: 4, source: 'Reporting queries written for a campus survey dataset', verified: true },
      { skillId: 'data-viz', level: 5, source: 'Public dataset dashboard submitted as a portfolio piece', verified: true },
      { skillId: 'reporting', level: 4, source: 'Monthly analysis notes for a student research group' },
      { skillId: 'excel', level: 4, source: 'Survey cleaning and pivot summaries' },
      { skillId: 'python', level: 3, source: 'Cleaning scripts for coursework data' },
      { skillId: 'communication', level: 3, source: 'Presented three findings and one limitation to a panel' }
    ],
    portfolio: [
      { title: 'Malaysian public dataset dashboard', type: 'Project', skills: ['data-viz', 'sql'] },
      { title: 'Survey cleaning notes', type: 'Practice', skills: ['excel', 'python'] }
    ],
    roadmap: { phase: 3, done: 8, total: 10 }
  },
  {
    id: 'hafiz-rahman', name: 'Hafiz Rahman', initials: 'HR', photo: '/assets/personas/hafiz-rahman.jpg',
    headline: 'SPM leaver, two years of workshop support', qualification: 'SPM', field: 'Automotive',
    location: 'Perak', availability: 'Available now',
    interests: ['automotive', 'mechanical'], shared: true,
    scores: { auto: 4, tools: 4, safety: 4, electrical: 3, troubleshoot: 4, sensors: 2, teamwork: 3, communication: 2, excel: 1, reporting: 1 },
    evidence: [
      { skillId: 'auto', level: 4, source: 'Two years of supervised servicing at a workshop', verified: true },
      { skillId: 'tools', level: 4, source: 'Daily tool setup and maintenance checks' },
      { skillId: 'safety', level: 4, source: 'Completed workshop safety induction and monthly drills', verified: true },
      { skillId: 'troubleshoot', level: 4, source: 'Diagnostic notes for repeat brake and wiring faults' },
      { skillId: 'electrical', level: 3, source: 'Supervised battery and circuit checks' },
      { skillId: 'sensors', level: 2, source: 'Observed sensor testing on two vehicle models' }
    ],
    portfolio: [
      { title: 'Routine servicing log', type: 'Project', skills: ['auto', 'tools', 'safety'] },
      { title: 'Brake fault notes', type: 'Practice', skills: ['troubleshoot'] }
    ],
    roadmap: { phase: 2, done: 6, total: 9 }
  },
  {
    id: 'mei-ling-chong', name: 'Mei Ling Chong', initials: 'MC', photo: '/assets/personas/mei-ling-chong.jpg',
    headline: 'Marketing degree, campaign and content work', qualification: 'Degree', field: 'Marketing',
    location: 'Selangor', availability: 'Available now',
    interests: ['creative', 'business'], shared: true,
    scores: { marketing: 4, content: 4, reporting: 3, excel: 3, communication: 4, teamwork: 3, 'data-viz': 2, web: 2, sql: 1, python: 0 },
    evidence: [
      { skillId: 'marketing', level: 4, source: 'Two-week campaign run for a campus society', verified: true },
      { skillId: 'content', level: 4, source: 'Social posts and newsletter copy for a student club' },
      { skillId: 'reporting', level: 3, source: 'Campaign results summary with reach and engagement' },
      { skillId: 'excel', level: 3, source: 'Campaign tracker with weekly totals' },
      { skillId: 'communication', level: 4, source: 'Presented campaign results to a module panel' },
      { skillId: 'data-viz', level: 2, source: 'Simple engagement charts in the summary' }
    ],
    portfolio: [
      { title: 'Two-week campus campaign', type: 'Project', skills: ['marketing', 'content'] },
      { title: 'Campaign results summary', type: 'Project', skills: ['reporting', 'excel'] }
    ],
    roadmap: { phase: 1, done: 2, total: 8 }
  },
  {
    id: 'arun-kumar', name: 'Arun Kumar', initials: 'AK', photo: '/assets/personas/arun-kumar.jpg',
    headline: 'IT support certificate, helpdesk practice', qualification: 'Certificate', field: 'IT support',
    location: 'Kuala Lumpur', availability: 'Available now',
    interests: ['technology', 'electronics'], shared: true,
    scores: { troubleshoot: 4, networking: 3, communication: 4, teamwork: 3, electrical: 2, excel: 2, web: 2, javascript: 1, sql: 1, reporting: 2 },
    evidence: [
      { skillId: 'troubleshoot', level: 4, source: 'Helpdesk practice on 40 simulated tickets', verified: true },
      { skillId: 'networking', level: 3, source: 'Connectivity checks and router setup in a lab' },
      { skillId: 'communication', level: 4, source: 'Ticket notes written for non-technical users' },
      { skillId: 'teamwork', level: 3, source: 'Escalation handoffs with a lab partner' },
      { skillId: 'electrical', level: 2, source: 'Supervised component and power checks' },
      { skillId: 'reporting', level: 2, source: 'Weekly ticket summary for the lab supervisor' }
    ],
    portfolio: [
      { title: 'Troubleshooting knowledge base', type: 'Project', skills: ['troubleshoot', 'communication'] },
      { title: 'Ticket summary report', type: 'Practice', skills: ['reporting'] }
    ],
    roadmap: { phase: 2, done: 5, total: 8 }
  },
  {
    id: 'siti-nabilah', name: 'Siti Nabilah', initials: 'SN', photo: '/assets/personas/siti-nabilah.jpg',
    headline: 'Operations diploma, scheduling and reporting', qualification: 'Diploma', field: 'Operations management',
    location: 'Johor', availability: '2 months notice',
    interests: ['business', 'data'], shared: true,
    scores: { excel: 5, reporting: 4, teamwork: 4, communication: 3, troubleshoot: 3, 'data-viz': 2, sql: 2, marketing: 1, content: 1, python: 0 },
    evidence: [
      { skillId: 'excel', level: 5, source: 'Service tracker used daily by a five-person team', verified: true },
      { skillId: 'reporting', level: 4, source: 'Weekly operations summary for a warehouse supervisor' },
      { skillId: 'teamwork', level: 4, source: 'Shift planning for a small warehouse team' },
      { skillId: 'troubleshoot', level: 3, source: 'Documented causes of late dispatches' },
      { skillId: 'communication', level: 3, source: 'Coordinated handoffs between drivers and the office' },
      { skillId: 'sql', level: 2, source: 'Coursework queries on a sample stock database' }
    ],
    portfolio: [
      { title: 'Daily service tracker', type: 'Project', skills: ['excel', 'reporting'] },
      { title: 'Late dispatch review', type: 'Project', skills: ['troubleshoot', 'reporting'] }
    ],
    roadmap: { phase: 3, done: 6, total: 9 }
  },
  {
    id: 'jason-lee', name: 'Jason Lee', initials: 'JL', photo: '/assets/personas/jason-lee.jpg',
    headline: 'Web development diploma, self-taught JavaScript', qualification: 'Diploma', field: 'Web development',
    location: 'Remote', availability: 'Available now',
    interests: ['technology', 'creative'], shared: true,
    scores: { web: 4, javascript: 4, troubleshoot: 3, teamwork: 2, communication: 2, excel: 2, sql: 2, python: 1, 'data-viz': 1, reporting: 1 },
    evidence: [
      { skillId: 'web', level: 4, source: 'Three personal sites with responsive layouts', verified: true },
      { skillId: 'javascript', level: 4, source: 'Small quiz app and a filterable list built from scratch' },
      { skillId: 'troubleshoot', level: 3, source: 'Debug notes kept for each project' },
      { skillId: 'teamwork', level: 2, source: 'Two short freelance collaborations' },
      { skillId: 'communication', level: 2, source: 'Written handover notes for clients' },
      { skillId: 'sql', level: 2, source: 'Coursework database exercises' }
    ],
    portfolio: [
      { title: 'Quiz app', type: 'Project', skills: ['javascript', 'web'] },
      { title: 'Filterable list', type: 'Project', skills: ['javascript'] }
    ],
    roadmap: { phase: 1, done: 2, total: 7 }
  },
  {
    id: 'farah-adila', name: 'Farah Adila', initials: 'FA', photo: '/assets/personas/farah-adila.jpg',
    headline: 'Data analytics degree, dashboard portfolio', qualification: 'Degree', field: 'Data analytics',
    location: 'Selangor', availability: 'Available now',
    interests: ['data', 'technology'], shared: false,
    scores: { sql: 5, 'data-viz': 5, python: 4, excel: 5, communication: 4, reporting: 4, teamwork: 3, troubleshoot: 3, web: 1, marketing: 1 },
    evidence: [
      { skillId: 'sql', level: 5, source: 'Analytics coursework and a capstone query set', verified: true },
      { skillId: 'data-viz', level: 5, source: 'Three dashboards in a public portfolio', verified: true },
      { skillId: 'python', level: 4, source: 'Analysis notebooks for two coursework projects' },
      { skillId: 'excel', level: 5, source: 'Cleaning and modelling workbooks' },
      { skillId: 'communication', level: 4, source: 'Capstone presentation to an industry panel' }
    ],
    portfolio: [
      { title: 'Sales dashboard', type: 'Project', skills: ['data-viz', 'sql'] },
      { title: 'Analysis notebook', type: 'Project', skills: ['python'] }
    ],
    roadmap: { phase: 4, done: 10, total: 10 }
  },
  {
    id: 'kumaravel-murugan', name: 'Kumaravel Murugan', initials: 'KM', photo: '/assets/personas/kumaravel-murugan.jpg',
    headline: 'SPM leaver, industrial maintenance training', qualification: 'SPM', field: 'General studies',
    location: 'Penang', availability: 'Available now',
    interests: ['mechanical', 'electronics'], shared: false,
    scores: { tools: 5, safety: 5, electrical: 4, sensors: 3, troubleshoot: 4, auto: 2, teamwork: 3, communication: 2, excel: 1, reporting: 1 },
    evidence: [
      { skillId: 'tools', level: 5, source: 'Two years of supervised maintenance work', verified: true },
      { skillId: 'safety', level: 5, source: 'Site safety certification and drills', verified: true },
      { skillId: 'electrical', level: 4, source: 'Supervised panel and circuit checks' },
      { skillId: 'troubleshoot', level: 4, source: 'Fault log for conveyor stoppages' },
      { skillId: 'sensors', level: 3, source: 'Sensor replacement under supervision' }
    ],
    portfolio: [
      { title: 'Preventive maintenance schedule', type: 'Project', skills: ['tools', 'safety'] },
      { title: 'Conveyor fault log', type: 'Practice', skills: ['troubleshoot'] }
    ],
    roadmap: { phase: 2, done: 4, total: 9 }
  }
];

export const sharedCandidates = candidates.filter(candidate => candidate.shared);

export function getRole(id) {
  return roles.find(role => role.id === id) || roles[0];
}

export function getCandidate(id) {
  return sharedCandidates.find(candidate => candidate.id === id) || null;
}

export function skillName(id) {
  return skills[id]?.name || id;
}
