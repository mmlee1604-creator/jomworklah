const evidenceLegend = [
  'No evidence in profile',
  'Mentioned without supporting details',
  'Coursework or introductory training',
  'Demonstrated in a project',
  'Demonstrated in substantial work',
  'Independently verified or assessed evidence'
];

const locations = ['Kuala Lumpur', 'Selangor', 'Penang', 'Johor', 'Perak', 'Remote'];
const learningModes = ['Online', 'In person', 'Hybrid'];
const budgets = ['RM0–RM500', 'RM501–RM1,500', 'Flexible'];
const learningHours = [3, 5, 8, 12];
const interests = {
  data: 'Data & analytics', technology: 'Technology', business: 'Business & operations',
  creative: 'Creative & marketing', automotive: 'Automotive', mechanical: 'Mechanical',
  electronics: 'Electronics'
};

const mbtiGroups = {
  analyst: { label: 'Analyst', color: '#7a56b8', soft: '#efe9fa' },
  diplomat: { label: 'Diplomat', color: '#1c8a63', soft: '#e2f4ea' },
  sentinel: { label: 'Sentinel', color: '#2e6f9e', soft: '#e3eef7' },
  explorer: { label: 'Explorer', color: '#b57b12', soft: '#fbf0d7' }
};

// The 16 MBTI types. Illustrations live in assets/mbti/<code>.png.
const mbtiTypes = [
  ['INTJ', 'Architect', 'analyst', 'Plans the long game'],
  ['INTP', 'Logician', 'analyst', 'Follows the curious thread'],
  ['ENTJ', 'Commander', 'analyst', 'Takes charge of the plan'],
  ['ENTP', 'Debater', 'analyst', 'Challenges every assumption'],
  ['INFJ', 'Advocate', 'diplomat', 'Quietly driven by purpose'],
  ['INFP', 'Mediator', 'diplomat', 'Guided by personal values'],
  ['ENFJ', 'Protagonist', 'diplomat', 'Helps others move forward'],
  ['ENFP', 'Campaigner', 'diplomat', 'Spots possibility everywhere'],
  ['ISTJ', 'Logistician', 'sentinel', 'Keeps the details right'],
  ['ISFJ', 'Defender', 'sentinel', 'Looks after the team'],
  ['ESTJ', 'Executive', 'sentinel', 'Runs the operation'],
  ['ESFJ', 'Consul', 'sentinel', 'Brings people together'],
  ['ISTP', 'Virtuoso', 'explorer', 'Learns by taking it apart'],
  ['ISFP', 'Adventurer', 'explorer', 'Finds beauty in the everyday'],
  ['ESTP', 'Entrepreneur', 'explorer', 'Acts first, adjusts fast'],
  ['ESFP', 'Entertainer', 'explorer', 'Brings energy to the room']
].map(([code, name, group, tagline]) => ({ code, name, group, tagline }));

const skills = [
  ['excel', 'Excel', 'Digital', 'Organise, analyse and present information using spreadsheets.'],
  ['python', 'Python', 'Technical', 'Write scripts for automation, cleaning or analysis.'],
  ['sql', 'SQL', 'Technical', 'Query and work with relational databases.'],
  ['data-viz', 'Data Visualisation', 'Analytical', 'Turn data into clear charts and dashboards.'],
  ['web', 'HTML/CSS', 'Technical', 'Build and style accessible pages for the web.'],
  ['javascript', 'JavaScript', 'Technical', 'Add behaviour and interactivity to web pages.'],
  ['communication', 'Communication', 'Communication', 'Explain findings clearly and adapt to different audiences.'],
  ['teamwork', 'Teamwork', 'Teamwork', 'Coordinate work and contribute to shared outcomes.'],
  ['troubleshoot', 'Troubleshooting', 'Analytical', 'Identify causes of problems and test fixes systematically.'],
  ['reporting', 'Reporting', 'Analytical', 'Summarise progress, results and decisions clearly.'],
  ['marketing', 'Digital Marketing', 'Digital', 'Plan, measure and improve digital campaigns.'],
  ['content', 'Content Writing', 'Communication', 'Write clear audience-focused communications.'],
  ['tools', 'Mechanical Tools', 'Technical', 'Identify and use the appropriate tools for basic mechanical tasks.'],
  ['auto', 'Automotive Maintenance', 'Technical', 'Follow routine service and inspection procedures under supervision.'],
  ['electrical', 'Basic Electrical', 'Technical', 'Recognise basic electrical components and circuit behaviour.'],
  ['safety', 'Safety Practices', 'Technical', 'Identify hazards and follow appropriate workplace safety procedures.'],
  ['sensors', 'Sensors', 'Technical', 'Recognise basic sensors and interpret simple readings under supervision.'],
  ['networking', 'Computer Networking', 'Digital', 'Identify basic network components and common connectivity issues.']
].map(([id, name, category, description]) => ({ id, name, category, description }));

const personas = {
  aina: {
    name: 'Aina Rahman', initials: 'AR', headline: 'IT diploma graduate', photo: 'personas/aina.jpg',
    qualification: 'Diploma', field: 'Information Technology', location: 'Selangor',
    experience: 'Helped a campus society maintain monthly reports and supported a small office with part-time administrative work.',
    projects: 'Built a campus attendance spreadsheet and report. Created a basic responsive site and practised Python in coursework.',
    interests: ['data', 'technology'], budget: budgets[0], hours: 5, mode: 'Online', mbti: 'INFJ',
    scores: { excel: 4, python: 2, sql: 1, 'data-viz': 1, web: 3, communication: 3, teamwork: 4, troubleshoot: 2, reporting: 3, marketing: 1 }
  },
  amir: {
    name: 'Amir Hakim', initials: 'AH', headline: 'SPM leaver with workshop experience', photo: 'personas/amir.jpg',
    qualification: 'SPM', field: 'General studies', location: 'Perak',
    experience: 'Assisted at a family motorcycle workshop in Perak under supervision, organising tools and helping document service jobs.',
    projects: 'Prepared a routine service checklist, logged recurring faults and observed basic electrical and sensor checks.',
    interests: ['automotive', 'mechanical', 'electronics'], budget: budgets[0], hours: 8, mode: 'In person', mbti: 'ISTP',
    scores: { tools: 4, troubleshoot: 3, auto: 3, electrical: 2, safety: 2, sensors: 1, communication: 3, teamwork: 3, excel: 1, sql: 0 }
  }
};

// Employer names are illustrative examples of Malaysian employers that recruit TVET talent, not endorsements.
const jobs = [
  {
    id: 'junior-data-analyst', title: 'Junior Data Analyst', category: 'Technology', sector: 'Technology & Data', icon: 'chart',
    summary: 'Turn raw data into reports that help teams make day-to-day decisions.',
    responsibilities: ['Clean and check datasets', 'Build reports and simple dashboards', 'Present findings to colleagues'],
    qualification: 'A relevant diploma, degree or demonstrated equivalent skills. Employers set their own criteria.',
    progression: ['Junior Data Analyst', 'Data Analyst', 'Analytics Lead'],
    requirements: [['excel',4,.20], ['sql',4,.30], ['python',3,.15], ['data-viz',4,.25], ['communication',3,.10]],
    tags: ['data', 'technology'], employers: ['petronas', 'maybank', 'grab'], project: ['Analyse a public Malaysian dataset and build a one-page dashboard.', 'Write a short analysis explaining three findings and one limitation.']
  },
  {
    id: 'business-intelligence-analyst', title: 'Business Intelligence Analyst', category: 'Technology', sector: 'Technology & Data', icon: 'chart',
    summary: 'Translate business questions into metrics, dashboards and regular performance reports.',
    responsibilities: ['Define operational metrics', 'Build reusable dashboards', 'Check and document data quality'],
    qualification: 'Relevant analytics or business studies and a portfolio of reporting work are typical examples.',
    progression: ['BI Associate', 'BI Analyst', 'BI Lead'],
    requirements: [['sql',4,.30], ['data-viz',5,.25], ['reporting',4,.20], ['excel',4,.15], ['communication',4,.10]],
    tags: ['data', 'business'], employers: ['cimb', 'touchngo', 'shopee'], project: ['Build an operations dashboard from a fictional sales dataset.', 'Document how each metric is calculated and checked.']
  },
  {
    id: 'frontend-web-developer', title: 'Frontend Web Developer', category: 'Technology', sector: 'Web & Software', icon: 'code',
    summary: 'Build responsive interfaces and make websites usable across devices.',
    responsibilities: ['Implement website layouts', 'Build interactive forms', 'Test accessibility and responsive behaviour'],
    qualification: 'A relevant qualification or a demonstrable web portfolio is a typical starting point.',
    progression: ['Junior Frontend Developer', 'Frontend Developer', 'UI Engineer'],
    requirements: [['web',4,.35], ['javascript',4,.25], ['troubleshoot',3,.15], ['teamwork',3,.15], ['communication',3,.10]],
    tags: ['technology', 'creative'], employers: ['grab', 'shopee', 'touchngo'], project: ['Build a responsive portfolio with an accessible form.', 'Test it with a keyboard and on a narrow screen, then record your fixes.']
  },
  {
    id: 'it-support-technician', title: 'IT Support Technician', category: 'Technology', sector: 'IT Services', icon: 'monitor',
    summary: 'Help people solve device and connectivity issues and document recurring problems.',
    responsibilities: ['Diagnose basic incidents', 'Set up workstations', 'Maintain support documentation'],
    qualification: 'A relevant certificate or diploma and practical troubleshooting examples can support an application.',
    progression: ['IT Support Technician', 'Support Specialist', 'Systems Administrator'],
    requirements: [['troubleshoot',4,.30], ['networking',3,.15], ['communication',4,.25], ['teamwork',3,.20], ['electrical',2,.10]],
    tags: ['technology', 'electronics'], employers: ['tm', 'celcomdigi', 'maxis'], project: ['Create a troubleshooting knowledge base for three common support tickets.', 'Include reproducible checks, outcomes and escalation notes.']
  },
  {
    id: 'digital-marketing-executive', title: 'Digital Marketing Executive', category: 'Creative', sector: 'Marketing & Media', icon: 'spark',
    summary: 'Plan content and track how digital campaigns perform.',
    responsibilities: ['Plan social content', 'Review campaign metrics', 'Report and test improvements'],
    qualification: 'A communications or business qualification, or sample campaigns showing practical skills.',
    progression: ['Digital Marketing Assistant', 'Digital Marketing Executive', 'Campaign Lead'],
    requirements: [['marketing',4,.35], ['content',4,.20], ['reporting',3,.15], ['excel',3,.15], ['communication',3,.15]],
    tags: ['creative', 'business'], employers: ['shopee', 'lazada', 'astro'], project: ['Draft a two-week sample campaign for a fictional local business.', 'Analyse the example campaign results and explain what you would change.']
  },
  {
    id: 'operations-coordinator', title: 'Operations Coordinator', category: 'Business', sector: 'Business Operations', icon: 'briefcase',
    summary: 'Keep daily work organised through scheduling, tracking and reporting.',
    responsibilities: ['Maintain operational trackers', 'Coordinate handoffs and schedules', 'Flag delays and report progress'],
    qualification: 'Business or administrative studies and examples of organised project work can be relevant.',
    progression: ['Operations Assistant', 'Operations Coordinator', 'Operations Lead'],
    requirements: [['excel',5,.25], ['reporting',4,.25], ['teamwork',4,.20], ['communication',4,.20], ['troubleshoot',3,.10]],
    tags: ['business', 'data'], employers: ['dhl', 'posmalaysia', 'simedarby'], project: ['Build a stock or service tracker for a fictional small business.', 'Summarise late handoffs and propose a change to the process.']
  },
  {
    id: 'automotive-technician', title: 'Automotive Technician', category: 'Engineering', sector: 'Automotive & TVET', icon: 'wrench',
    summary: 'Inspect vehicles, support routine servicing and document diagnostic work.',
    responsibilities: ['Perform supervised service checks', 'Record symptoms and observations', 'Follow workshop safety procedures'],
    qualification: 'Employers may require a relevant SKM or equivalent training. Check qualification and supervision requirements for the work.',
    progression: ['Workshop Assistant', 'Automotive Technician', 'Diagnostic Technician'],
    requirements: [['tools',4,.20], ['auto',3,.25], ['safety',4,.20], ['electrical',4,.15], ['troubleshoot',4,.10], ['sensors',3,.10]],
    tags: ['automotive', 'mechanical', 'electronics'], employers: ['perodua', 'proton', 'toyota'], project: ['With a qualified supervisor, observe a routine diagnostic exercise and record the symptoms and checks.', 'Prepare a service checklist for supervisor review, including hazards and when to stop and escalate.']
  },
  {
    id: 'industrial-maintenance-technician', title: 'Industrial Maintenance Technician', category: 'Engineering', sector: 'Manufacturing & TVET', icon: 'wrench',
    summary: 'Support preventive maintenance and document equipment issues in a manufacturing setting.',
    responsibilities: ['Assist preventive maintenance', 'Record faults and inspection results', 'Follow site safety and escalation rules'],
    qualification: 'A relevant SKM or technical diploma may be expected. Confirm the training and authorisation needed for practical work.',
    progression: ['Maintenance Assistant', 'Maintenance Technician', 'Maintenance Supervisor'],
    requirements: [['tools',4,.20], ['safety',5,.25], ['electrical',4,.20], ['sensors',3,.15], ['troubleshoot',4,.15], ['teamwork',3,.05]],
    tags: ['mechanical', 'electronics'], employers: ['topglove', 'infineon', 'daikin'], project: ['Draw a preventive maintenance schedule for sample equipment.', 'With a supervisor, review a simulated inspection log and identify escalation points.']
  }
].map(job => ({
  ...job,
  requirements: job.requirements.map(([skillId, level, weight]) => ({ skillId, level, weight }))
}));

const providers = {
  elatih: { name: 'HRD Corp e-LATiH', url: 'https://elatih.hrdcorp.gov.my/' },
  tvet: { name: 'UP_TVET', url: 'https://mohon.tvet.gov.my/' },
  future: { name: 'MYFutureJobs / PERKESO', url: 'https://myfuturejobs.gov.my/training-programmes/' },
  mahir: { name: 'MyMahir · TalentCorp', url: 'https://www.mymahir.my/' },
  spike: { name: 'MySPIKE / NOSS', url: 'https://myspike.tvet.gov.my/platform/pekerja' }
};

const courses = [
  ['sql-foundations', 'SQL Foundations', 'elatih', ['sql'], 'Online', 'Online', 2, 4],
  ['dashboard-design', 'Data Analysis & Dashboard Design', 'mahir', ['data-viz', 'excel', 'python'], 'Online', 'Online', 3, 5],
  ['frontend-basics', 'Responsive Websites & JavaScript', 'elatih', ['web', 'javascript'], 'Online', 'Online', 3, 6],
  ['it-support', 'IT Support & Network Fundamentals', 'future', ['networking', 'troubleshoot'], 'Hybrid', 'Kuala Lumpur', 3, 6],
  ['campaign-measurement', 'Digital Campaign Measurement', 'mahir', ['marketing', 'content', 'reporting'], 'Online', 'Online', 2, 4],
  ['workplace-reporting', 'Workplace Communication & Reporting', 'future', ['communication', 'reporting', 'teamwork'], 'Hybrid', 'Selangor', 2, 4],
  ['vehicle-service', 'Vehicle Servicing & Diagnostics', 'tvet', ['auto', 'electrical', 'sensors', 'troubleshoot'], 'In person', 'Perak', 4, 8],
  ['workshop-safety', 'Workshop Safety Fundamentals', 'spike', ['safety', 'tools'], 'In person', 'Perak', 2, 4],
  ['industrial-systems', 'Industrial Electrical & Sensor Basics', 'tvet', ['electrical', 'sensors', 'safety'], 'In person', 'Penang', 4, 8],
  ['spreadsheet-workflows', 'Spreadsheet Workflows for Operations', 'elatih', ['excel', 'reporting'], 'Online', 'Online', 2, 3]
].map(([id, title, provider, skillIds, mode, location, minWeeks, maxWeeks]) => ({
  id, title, provider, skillIds, mode, location, minWeeks, maxWeeks, isIllustrative: true, fee: null
}));
