// Keywords (English + Malay) used to decide which skills a course teaches.
// Matching is case-insensitive and anchored at the start of a word, so "elektrik" also matches
// "elektrikal". A trailing "!" means the whole word only (short terms like "sql", "css").
// Edit freely, then re-run `node scripts/map-course-skills.mjs`.
export const skillKeywords = {
  excel: ['excel', 'spreadsheet', 'hamparan elektronik', 'microsoft office', 'ms office'],
  python: ['python', 'pengaturcaraan python'],
  sql: ['sql!', 'mysql', 'pangkalan data', 'database', 'postgresql'],
  'data-viz': ['visualisasi data', 'data visuali', 'dashboard', 'power bi', 'tableau', 'analitik data', 'data analy', 'analisis data'],
  web: ['html!', 'css!', 'laman web', 'web design', 'reka bentuk web', 'pembangunan web', 'web development', 'website', 'web developer'],
  javascript: ['javascript', 'node.js', 'react!', 'jquery'],
  communication: ['komunikasi', 'communication', 'public speaking', 'pengucapan awam', 'presentation', 'pembentangan'],
  teamwork: ['kerja berpasukan', 'kerja pasukan', 'teamwork', 'team work', 'berpasukan'],
  troubleshoot: ['penyelesaian masalah', 'menyelesaikan masalah', 'troubleshoot', 'diagnos', 'mengesan kerosakan', 'pembaikan', 'repair'],
  reporting: ['pelaporan', 'penyediaan laporan', 'menulis laporan', 'report writing', 'reporting', 'dokumentasi'],
  marketing: ['pemasaran', 'marketing', 'media sosial', 'social media', 'jenama', 'branding', 'e-dagang', 'e-commerce'],
  content: ['penulisan kandungan', 'content writing', 'copywriting', 'penulisan kreatif', 'kandungan digital', 'penulisan', 'pembuatan video', 'multimedia'],
  tools: ['alat tangan', 'peralatan tangan', 'perkakas', 'hand tool', 'power tool', 'kerja bengkel', 'bengkel', 'pemesinan', 'machining', 'kimpalan', 'welding', 'pertukangan'],
  auto: ['automotif', 'automotive', 'kenderaan', 'vehicle', 'motosikal', 'motorcycle', 'enjin', 'engine!', 'engines!', 'kereta'],
  electrical: ['elektrik', 'electrical', 'litar', 'circuit', 'pendawaian', 'wiring', 'voltan', 'kuasa elektrik', 'elektronik', 'electronic'],
  safety: ['keselamatan', 'safety', 'osha', 'niosh', 'k3!', 'keselamatan dan kesihatan', 'ppe!', 'bahaya', 'hazard'],
  sensors: ['sensor', 'pengesan', 'instrumentasi', 'instrumentation', 'mekatronik', 'mechatronic', 'automasi', 'automation', 'plc!', 'pengawal logik'],
  networking: ['rangkaian komputer', 'rangkaian data', 'networking', 'computer network', 'ccna', 'cisco', 'tcp/ip', 'pentadbiran rangkaian', 'sistem rangkaian']
};

// General-purpose skills appear in almost every course description, so for these only the
// course NAME counts. Specialist skills may also match on description/career text.
export const nameOnlySkills = new Set(['communication', 'teamwork', 'troubleshoot']);

const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const matchers = Object.fromEntries(Object.entries(skillKeywords).map(([skillId, words]) => [
  skillId,
  words.map(word => {
    const exact = word.endsWith('!');
    const core = exact ? word.slice(0, -1) : word;
    return { word: core, pattern: new RegExp(`(?<![a-z0-9])${escape(core)}${exact ? '(?![a-z0-9])' : ''}`, 'i') };
  })
]));
