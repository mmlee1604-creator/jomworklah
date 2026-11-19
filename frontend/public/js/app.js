const icons = {
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6 6-6-6 6-6"/>',
  external: '<path d="M7 17 17 7M7 7h10v10"/>',
  upload: '<path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4m-8 1V4m-5 5 5-5 5 5"/>',
  file: '<path d="M6 3h8l4 4v14H6zm7 0v5h5M9 12h6m-6 4h6"/>',
  play: '<path d="m9 5 11 7-11 7z"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
  chart: '<path d="M4 4v16h16M8 15v-3m5 3V8m5 7V5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2 6-6 2 2-6z"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h5a3 3 0 1 0 0-6h-2a3 3 0 0 1 0-6h5"/>',
  stack: '<path d="m12 3 9 5-9 5-9-5zm-9 9 9 5 9-5M3 16l9 5 9-5"/>',
  book: '<path d="M12 6a13 13 0 0 0-9-2v14a13 13 0 0 1 9 2 13 13 0 0 1 9-2V4a13 13 0 0 0-9 2zm0 0v14"/>',
  flag: '<path d="M5 21V4m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3M3 13h18m-12 0v2h6v-2"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21v-2a8 8 0 0 1 16 0v2"/>',
  home: '<path d="m3 11 9-8 9 8m-2-2v11H5V9m5 11v-6h4v6"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  spark: '<path d="M12 3c0 5-4 9-9 9 5 0 9 4 9 9 0-5 4-9 9-9-5 0-9-4-9-9z"/>',
  code: '<path d="m8 6-6 6 6 6m8-12 6 6-6 6m-2-15-4 18"/>',
  monitor: '<path d="M3 4h18v13H3zm6 17h6m-3-4v4"/>',
  wrench: '<path d="M15 4a5 5 0 0 0-6 6L3 16a2.8 2.8 0 0 0 4 4l6-6a5 5 0 0 0 7-6l-4 4-4-4z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  map: '<path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2V6Z"/><path d="M9 4v14m6-12v14"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0z"/><circle cx="12" cy="10" r="2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>'
};

const nav = [
  ['dashboard', 'Overview', 'home'], ['skills', 'My Skills', 'chart'],
  ['careers', 'Explore Careers', 'compass'], ['gap', 'Skill Gap', 'target'],
  ['upskilling', 'Upskilling Hub', 'book'], ['roadmap', 'My Roadmap', 'route'],
  ['profile', 'My Profile', 'user'], ['atlas', 'Skills Atlas', 'map']
];
const onboardingViews = ['welcome', 'upload', 'profile-review'];
const storageKey = 'jomworklah-demo-v1';
const byId = id => document.getElementById(id);
const skillIndex = Object.fromEntries(skills.map(skill => [skill.id, skill]));
const courseIndex = Object.fromEntries(courses.map(course => [course.id, course]));
const jobIndex = Object.fromEntries(jobs.map(job => [job.id, job]));
const main = byId('main');
const modal = byId('modal');

function loadDemo() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    return saved?.version === 1 ? saved : {};
  } catch {
    return {};
  }
}

function emptyJourney() {
  return { started: false, preferences: {}, target: null, roadmap: null, added: [], completed: [] };
}

const saved = loadDemo();
const journeys = Object.fromEntries(Object.keys(personas).map(id => [id, { ...emptyJourney(), ...saved.journeys?.[id] }]));
const state = {
  view: 'welcome',
  persona: Object.hasOwn(personas, saved.persona) ? saved.persona : 'aina',
  profiles: Object.fromEntries(Object.entries(personas).map(([id, persona]) => [id, {
    ...persona, ...journeys[id].preferences, scores: { ...persona.scores }
  }])),
  file: null, fileError: '', processing: false, generation: false,
  skillCategory: 'All', radarSkill: null, careerSearch: '', careerCategory: 'All', careerSort: 'match',
  training: { view: 'suggested', skill: 'All', source: 'All', mode: 'All', location: 'All', budget: 'All', sort: 'relevance' }
};

const profile = () => state.profiles[state.persona];
const journey = () => journeys[state.persona];
const targetJob = () => jobIndex[journey().target];
const score = id => Number(profile().scores[id]) || 0;
const skillName = id => skillIndex[id].name;
let toastTimeout;
let modalTrigger;
let reviewReturn = 'welcome';

function persist() {
  try {
    localStorage.setItem(storageKey, JSON.stringify({ version: 1, persona: state.persona, journeys }));
  } catch {
    // The prototype also works in browsers that block file-origin storage.
  }
}

function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
}

function mbtiType(code) {
  return mbtiTypes.find(type => type.code === code) || mbtiTypes[0];
}

// 16-type illustrations extracted from the supplied 16personalities chart (assets/mbti).
function mbtiAvatar(code, size = 44) {
  const type = mbtiType(code);
  const height = Math.round(size * 158 / 176);
  return `<img class="mbti-avatar" src="assets/mbti/${type.code.toLowerCase()}.png" width="${size}" height="${height}" alt="" loading="lazy" decoding="async">`;
}

// Illustrative stand-in headshots for the two demo profiles (assets/personas).
function personaPhoto(id, size = 30) {
  const persona = personas[id];
  if (!persona || !persona.photo) return '';
  return `<img class="persona-photo" src="assets/${persona.photo}" width="${size}" height="${size}" alt="" decoding="async">`;
}

function mbtiSummary(type) {
  const group = mbtiGroups[type.group];
  return `<div class="mbti-current" style="--mbti-color:${group.color};--mbti-soft:${group.soft}">
    ${mbtiAvatar(type.code, 86)}
    <div>
      <p class="label">Selected type</p>
      <h3>${type.code} <span>${type.name}</span></h3>
      <p>${group.label} · ${type.tagline}</p>
    </div>
  </div>`;
}

function button(label, action, { style = 'primary', mark = '', value = '', attrs = '' } = {}) {
  return `<button type="button" class="button button-${style}" data-action="${action}" data-value="${escapeHTML(value)}" ${attrs}>${escapeHTML(label)}${mark ? icon(mark, 17) : ''}</button>`;
}

function goButton(label, view, style = 'primary', mark = 'arrow') {
  return button(label, 'go', { style, mark, value: view });
}

function notice(content, mark = 'info') {
  return `<p class="notice">${icon(mark, 17)}<span>${content}</span></p>`;
}

function title(label, heading, description, action = '') {
  return `<div class="page-heading">
    <div><p class="eyebrow"><span class="orange-dot"></span>${label}</p><h1>${heading}</h1>${description ? `<p class="lede">${description}</p>` : ''}</div>
    ${action}
  </div>`;
}

function emptyState(mark, heading, description, action = '') {
  return `<section class="panel empty-state"><span class="tile-icon">${icon(mark, 24)}</span><h2>${heading}</h2><p>${description}</p>${action}</section>`;
}

function selectOptions(items, selected) {
  return items.map(item => {
    const [value, label] = Array.isArray(item) ? item : [item, item];
    return `<option value="${escapeHTML(value)}"${String(value) === String(selected) ? ' selected' : ''}>${escapeHTML(label)}</option>`;
  }).join('');
}

function selectField(name, label, items, selected, attrs = '') {
  return `<label class="field"><span>${label}</span><select name="${name}" ${attrs}>${selectOptions(items, selected)}</select></label>`;
}

function chip(text, accent = false) {
  return `<span class="chip${accent ? ' chip-orange' : ''}">${escapeHTML(text)}</span>`;
}

function bar(value, maximum = 5, style = '') {
  return `<div class="bar ${style}" aria-hidden="true"><span style="--fill:${Math.max(0, Math.min(100, 100 * value / maximum))}%"></span></div>`;
}

function notify(message) {
  const toast = byId('toast');
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3400);
}

function openModal(heading, body, trigger = document.activeElement) {
  if (!modal.open) modalTrigger = trigger;
  modal.innerHTML = `<header class="modal-heading"><h2 id="modal-title">${heading}</h2><button class="icon-button" type="button" data-action="close" aria-label="Close dialog" autofocus>${icon('close')}</button></header>${body}`;
  if (!modal.open) modal.showModal();
  modal.querySelector('[autofocus]').focus();
}

function confirmation(heading, body, action, value, confirmLabel) {
  openModal(heading, `<p class="modal-description">${body}</p><div class="modal-actions">${button('Cancel', 'close', { style: 'secondary' })}${button(confirmLabel, action, { value })}</div>`);
}

function validView(view) {
  if (onboardingViews.includes(view)) return view === 'profile-review' && !journey().started && !state.reviewPending ? 'welcome' : view;
  return journey().started && nav.some(([id]) => id === view) ? view : 'welcome';
}

function showView(view, focus = true) {
  if (modal.open) modal.close();
  state.view = validView(view);
  draw();
  if (focus) {
    window.scrollTo(0, 0);
    main.focus({ preventScroll: true });
  }
}

function go(view) {
  const next = validView(view);
  if (location.hash !== '#' + next) {
    try {
      history.pushState(null, '', '#' + next);
    } catch {
      location.hash = next;
    }
  }
  showView(next);
}

function shell() {
  const landing = state.view === 'welcome';
  const workspace = !onboardingViews.includes(state.view);
  const logo = '<img src="assets/jomworklah-logo.svg" alt="JomWorkLah" width="187" height="42">';
  const links = nav.map(([id, label, mark]) => `<button type="button" class="nav-link${id === state.view ? ' selected' : ''}" data-action="go" data-value="${id}" ${id === state.view ? 'aria-current="page"' : ''}>${icon(mark, 19)}${label}</button>`).join('');
  byId('header').innerHTML = `<div class="header-inner content-width flex items-center justify-between">
    <button class="brand" type="button" data-action="go" data-value="welcome">${logo}</button>
    ${landing ? `<nav class="landing-nav flex items-center" aria-label="Main navigation"><a href="#why-it-matters" data-action="landing-section" data-value="why-it-matters">Why it matters</a><a href="#how-it-works" data-action="landing-section" data-value="how-it-works">How it works</a><a class="emp-entry" href="/employer">For employers</a>${button('Explore demo', 'persona', { style: 'plain', mark: 'external' })}</nav>` :
      `<div class="header-actions"><span class="demo-tag"><span class="orange-dot"></span>Demo mode</span>
        <button type="button" class="button button-secondary persona-chip" data-action="persona" aria-label="Change demo persona">${personaPhoto(state.persona, 30)}<span>${escapeHTML(personas[state.persona].name.split(' ')[0])} · Demo</span>${icon('down', 17)}</button>
        ${workspace ? `<button class="icon-button mobile-menu" type="button" data-action="menu" aria-label="Open navigation">${icon('menu')}</button>` : ''}</div>`}
    </div>`;
  byId('shell').className = workspace ? 'shell workspace' : 'shell';
  byId('sidebar').hidden = !workspace;
  byId('sidebar').innerHTML = workspace ? `<nav aria-label="Career workspace">${links}</nav>
    ${targetJob() ? `<div class="side-target"><span class="label">Target career</span><p>${escapeHTML(targetJob().title)}</p></div>` : ''}
    <div class="side-bottom">${goButton('Upload new resume', 'upload', 'plain', 'upload')}</div>` : '';
  byId('footer').innerHTML = `<div class="content-width footer-inner flex items-center justify-between"><button class="brand footer-brand" type="button" data-action="go" data-value="welcome">${logo}</button><span>Malaysia career navigator <span aria-hidden="true">·</span> Interactive prototype</span></div>`;
}

function landingView() {
  const steps = [
    ['chart', 'Identify your skills', 'Spot strengths from your education, work, hobbies and self-learning.'],
    ['compass', 'Explore career matches', 'See which Malaysian roles fit your skills, interests and qualifications, and why.'],
    ['target', 'Find your skill gaps', 'Compare your profile with a role’s requirements to see what to learn next.'],
    ['book', 'Find TVET pathways', 'Explore technical and vocational education and training. Check eligibility, fees and locations on official provider sites.'],
    ['route', 'Build your roadmap', 'Plan courses, practical projects and qualifications, then track your progress.']
  ];
  const dosm = 'https://www.dosm.gov.my/uploads/release-content/file_20260626114308.pdf';
  const oecd = 'https://www.oecd.org/en/publications/oecd-economic-surveys-malaysia-2026_9ab6b826-en/full-report/improving-skills-education-and-training_562c8471.html';
  const tvetLogos = [
    ['GIATMARA', 'giatmara', 118],
    ['Politeknik Malaysia', 'politeknik-malaysia', 203],
    ['Kolej Komuniti', 'kolej-komuniti', 61, 1.35],
    ['German-Malaysian Institute (GMI)', 'gmi', 79],
    ['TalentCorp', 'talentcorp', 221],
    ['Developer Kaki', 'developer-kaki', 108]
  ];
  /* The fourth value is an optical scale: compact stacked lockups need more height to read at marquee size. */
  const tvetLogo = ([name, file, width, scale = 1], duplicate) => `<li class="tvet-item"${duplicate ? ' aria-hidden="true"' : ''}><img src="assets/logos/${file}.png" alt="${duplicate ? '' : escapeHTML(name)}" width="${width}" height="48"${scale === 1 ? '' : ` style="height:calc(var(--tvet-logo-h) * ${scale})"`}></li>`;
  const tvetItems = tvetLogos.map(logo => tvetLogo(logo, false)).join('') + tvetLogos.map(logo => tvetLogo(logo, true)).join('');
  return `<div class="landing">
    <section class="hero content-width grid items-center">
      <div class="hero-copy">
        <p class="eyebrow"><span class="orange-dot"></span>Malaysia’s career navigator</p>
        <h1>Your skills have<br class="hero-break"> a future. <em>Jom find it.</em></h1>
        <p class="lede">Discover your strengths, explore Malaysian career paths and make a plan for what to learn next.</p>
        <div class="hero-actions">${goButton('Analyse My Resume', 'upload')}${button('Try with Demo Profile', 'persona', { style: 'secondary', mark: 'play' })}</div>
        ${notice('Prototype only. Your uploaded file stays on your device and is never read.', 'lock')}
      </div>
      <figure class="hero-figure">
        <div class="hero-map"><img src="assets/hero-technician.webp" alt="A student assembling a robotics kit beside a laptop showing training, campus and career paths" width="1100" height="825" fetchpriority="high"></div>
        <figcaption><span><b>Fig. 1A</b> · The career path</span><span>Malaysia</span></figcaption>
      </figure>
    </section>
    <section class="tvet-band" aria-labelledby="tvet-band-title">
      <h2 class="tvet-band-title" id="tvet-band-title">Terokai Institusi TVET dan Komuniti Kerjaya di Malaysia.</h2>
      <div class="tvet-strip" role="group" aria-label="Institusi TVET dan komuniti kerjaya di Malaysia">
        <ul class="tvet-track">${tvetItems}</ul>
      </div>
    </section>
    <section class="mission" id="why-it-matters" tabindex="-1" aria-labelledby="mission-title">
      <div class="content-width mission-layout">
        <div>
          <p class="label">Our mission</p>
          <h2 id="mission-title">Youth unemployment and skills mismatch in Malaysia</h2>
          <p class="lede">JomWorkLah helps Malaysian students, fresh graduates and young jobseekers connect what they know with career opportunities and practical training.</p>
        </div>
        <div class="mission-evidence">
          <div class="mission-stats">
            <article class="panel mission-stat"><p class="mission-number">9.6%</p><h3>Youth unemployment</h3><p>Among Malaysians aged 15–24 in 2025, compared with 3.0% nationwide.</p></article>
            <article class="panel mission-stat"><p class="mission-number">35.6%</p><h3>Skills mismatch</h3><p>Of tertiary-educated workers were in semi-skilled or low-skilled jobs in 2025.</p></article>
          </div>
          <p class="mission-context">The OECD points to gaps between education and industry needs, alongside a shortage of high-skilled jobs.</p>
          <ul class="mission-sources" aria-label="Research sources">
            <li><a href="${dosm}">DOSM labour force statistics ${icon('external', 13)}</a></li>
            <li><a href="${oecd}">OECD Malaysia survey ${icon('external', 13)}</a></li>
          </ul>
        </div>
      </div>
    </section>
    <section class="features content-width" id="how-it-works" tabindex="-1" aria-labelledby="features-title">
      <p class="label">How it works</p>
      <h2 id="features-title">Five steps from resume to roadmap</h2>
      <p class="lede">The demo uses sample profiles to show how the planned journey works, from skills assessment to career matches based on Malaysian labour-market data.</p>
      <ol class="feature-grid">${steps.map(([mark, heading, description], index) => `<li class="panel feature"><div class="feature-top"><span class="tile-icon">${icon(mark, 20)}</span><span class="label">Step ${index + 1}</span></div><h3>${heading}</h3><p>${description}</p></li>`).join('')}</ol>
      ${button('Explore demo', 'persona', { mark: 'arrow' })}
    </section>
  </div>`;
}

function uploadView() {
  return `<div class="onboarding content-width narrow">
    ${goButton('Back to welcome', 'welcome', 'plain', 'back')}
    ${title('Resume upload', 'Start with a resume', 'Upload a PDF or DOCX file to generate a sample skills profile.')}
    <section class="panel upload-panel">
      <label id="dropzone" class="dropzone" for="resume-file">
        <input id="resume-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" class="sr-only" aria-describedby="upload-status upload-note" ${state.processing ? 'disabled' : ''}>
        <span class="tile-icon">${icon('upload', 24)}</span>
        <strong>Drop your resume here or browse files</strong><span>PDF or DOCX · Up to 5 MB</span>
      </label>
      <div id="upload-status" aria-live="polite">${state.fileError ? `<p class="error">${escapeHTML(state.fileError)}</p>` : ''}${state.file ? `<div class="selected-file flex items-center">${icon('file')}<div><strong>${escapeHTML(state.file.name)}</strong><span>${state.file.size} · ${state.processing ? 'Preparing example' : 'Ready to analyse'}</span></div>${button('Remove', 'remove-file', { style: 'plain', attrs: state.processing ? 'disabled' : '' })}</div>` : ''}</div>
      <div class="button-row">
        ${button('Generate Demo Skills Profile', 'process-resume', { mark: 'arrow', attrs: state.file && !state.processing ? '' : 'disabled' })}
        ${button('Use Sample Resume (Aina)', 'sample-resume', { style: 'secondary', attrs: state.processing ? 'disabled' : '' })}
      </div>
      <p id="processing-message" class="loading-message" role="status" ${state.processing ? '' : 'hidden'}>${state.processing ? 'Demo simulation · Preparing a sample skills profile…' : ''}</p>
    </section>
    <div id="upload-note">${notice('The demo uses a prewritten sample profile. Choosing a file shares its name and size with this page for this session.', 'lock')}</div>
  </div>`;
}

function profileFields() {
  const p = profile();
  return `<section class="panel form-panel">
    <h2>Profile details</h2><p>Use fictional details for this demo. Text fields and skills stay in this session.</p>
    <div class="form-grid">
      <label class="field"><span>Demo name</span><input name="name" required maxlength="70" value="${escapeHTML(p.name)}"></label>
      ${selectField('qualification', 'Qualification', ['SPM', 'Certificate', 'Diploma', 'Degree', 'Other'], p.qualification)}
      <label class="field full"><span>Field of study</span><input name="field" maxlength="100" value="${escapeHTML(p.field)}"></label>
      <label class="field"><span>Experience summary</span><textarea rows="3" name="experience" maxlength="900">${escapeHTML(p.experience)}</textarea></label>
      <label class="field"><span>Example projects</span><textarea rows="3" name="projects" maxlength="900">${escapeHTML(p.projects)}</textarea></label>
    </div>
  </section>
  <section class="panel form-panel mbti-panel">
    <div class="mbti-head">
      <div><h2>MBTI personality</h2><p>Pick the avatar that matches your 16-type result. Scroll sideways for all 16 — it appears in the header, dashboard and profile.</p></div>
      <div class="mbti-scroll-controls">
        <button type="button" class="icon-button" data-action="mbti-scroll" data-value="-1" aria-label="Scroll personality types left">${icon('back', 18)}</button>
        <button type="button" class="icon-button" data-action="mbti-scroll" data-value="1" aria-label="Scroll personality types right">${icon('arrow', 18)}</button>
      </div>
    </div>
    <div id="mbti-current">${mbtiSummary(mbtiType(p.mbti))}</div>
    <div id="mbti-grid" class="mbti-grid" role="group" aria-label="Choose an MBTI personality type">${mbtiTypes.map(type => {
      const group = mbtiGroups[type.group];
      return `<button type="button" class="mbti-option" data-action="mbti" data-value="${type.code}" aria-pressed="${type.code === mbtiType(p.mbti).code}" style="--mbti-color:${group.color};--mbti-soft:${group.soft}">${mbtiAvatar(type.code, 76)}<span><strong>${type.code}</strong><small>${type.name}</small></span></button>`;
    }).join('')}</div>
    ${notice('Self-reported for this demo. The 16-type framework is a reflection prompt, not a career assessment.')}
  </section>
  <section class="panel form-panel">
    <h2>Career preferences</h2>
    <fieldset><legend>What are you interested in?</legend><div class="choice-row">${Object.entries(interests).map(([id, label]) => `<label class="choice"><input type="checkbox" name="interests" value="${id}" ${p.interests.includes(id) ? 'checked' : ''}><span>${label}</span></label>`).join('')}</div></fieldset>
    <div class="form-grid">
      ${selectField('location', 'Preferred work location', locations, p.location)}
      ${selectField('budget', 'Training budget', budgets, p.budget)}
      ${selectField('hours', 'Weekly learning time', learningHours.map(hours => [hours, hours + ' hours/week']), p.hours)}
      ${selectField('mode', 'Preferred learning method', learningModes, p.mode)}
    </div>
  </section>
  <section class="panel form-panel">
    <h2>Resume evidence</h2><p>Choose scores from 0 to 5. Each score represents the type of evidence in this illustrative profile.</p>
    <div class="evidence-edit">${skills.map(skill => `<div class="evidence-control"><label for="edit-${skill.id}">${skill.name}<small>${skill.category}</small></label><select id="edit-${skill.id}" name="skill-${skill.id}" aria-describedby="desc-${skill.id}" data-evidence>${selectOptions(evidenceLegend.map((description, value) => [value, value + ' · ' + description]), score(skill.id))}</select><span class="sr-only" id="desc-${skill.id}">${skill.description}</span></div>`).join('')}</div>
    ${notice('All scores are illustrative, including any sample score of 5.')}
  </section>`;
}

function reviewView() {
  return `<div class="onboarding content-width review-width">
    ${goButton(reviewReturn === 'upload' ? 'Back to upload' : 'Back to welcome', reviewReturn, 'plain', 'back')}
    ${title('Sample profile', 'Review your <em>demo profile.</em>', 'These example experiences and preferences drive the career matches. Adjust anything before continuing.')}
    <form id="profile-form">${profileFields()}<div class="button-row"><button type="submit" class="button button-primary">Save &amp; Continue${icon('arrow', 17)}</button>${button('Reset to Sample Profile', 'sample-reset', { style: 'secondary' })}</div></form>
  </div>`;
}

function gapsFor(job) {
  if (!job) return [];
  return job.requirements.map(requirement => {
    const current = score(requirement.skillId);
    const gap = Math.max(0, requirement.level - current);
    return { ...requirement, current, gap, priority: gap * requirement.weight };
  }).sort((a, b) => b.priority - a.priority || b.weight - a.weight || skillName(a.skillId).localeCompare(skillName(b.skillId)));
}

function compatibility(job) {
  const skillsMatch = Math.round(100 * job.requirements.reduce((sum, req) => sum + Math.min(score(req.skillId) / req.level, 1) * req.weight, 0));
  const interestMatch = job.tags.some(tag => profile().interests.includes(tag)) ? 100 : 50;
  return Math.round(.85 * skillsMatch + .15 * interestMatch);
}

function rankedJobs() {
  return jobs.map(job => ({ ...job, fit: compatibility(job) })).sort((a, b) => b.fit - a.fit || a.title.localeCompare(b.title));
}

function rankedCourses(job) {
  const gaps = gapsFor(job).filter(item => item.gap);
  return courses.map(course => ({
    ...course,
    relevance: gaps.filter(item => course.skillIds.includes(item.skillId)).reduce((sum, item) => sum + item.priority, 0)
  })).sort((a, b) => b.relevance - a.relevance
    || Number(b.mode === profile().mode) - Number(a.mode === profile().mode)
    || Number(b.location === profile().location) - Number(a.location === profile().location)
    || a.title.localeCompare(b.title));
}

function evidenceBars(entries) {
  return `<ul class="evidence-bars">${entries.map(skill => `<li tabindex="0" aria-label="${skill.name}, ${score(skill.id)} out of 5. ${evidenceLegend[score(skill.id)]}." title="${skill.description}"><div class="bar-label"><span>${skill.name}</span><strong>${score(skill.id)}<span> / 5</span></strong></div>${bar(score(skill.id))}</li>`).join('')}</ul>`;
}

const compactSkillNames = {
  'data-viz': 'Data viz', web: 'Web', communication: 'Comms', troubleshoot: 'Fault finding',
  marketing: 'Marketing', auto: 'Auto service', networking: 'Networking'
};

function radarGraphic(layout, selected) {
  const { width, height, radius, compact } = layout;
  const cx = width / 2;
  const cy = height / 2;
  const turn = 2 * Math.PI / skills.length;
  const point = (angle, distance) => [
    +(cx + Math.cos(angle) * distance).toFixed(2),
    +(cy + Math.sin(angle) * distance).toFixed(2)
  ];
  const axes = skills.map((skill, index) => {
    const angle = -Math.PI / 2 + index * turn;
    const value = score(skill.id);
    return { skill, angle, value, marker: point(angle, radius * value / 5) };
  });
  const rings = evidenceLegend.slice(1).map((_, index) => {
    const value = index + 1;
    return `<circle class="radar-ring${value === 5 ? ' radar-rim' : ''}" cx="${cx}" cy="${cy}" r="${radius * value / 5}"/>`;
  }).join('');
  const spokes = axes.map(({ angle }) => {
    const [x, y] = point(angle, radius);
    return `<line class="radar-spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>`;
  }).join('');
  const scale = evidenceLegend.map((_, index) => `<text x="${cx + 7}" y="${cy - radius * index / 5 + (index ? 0 : 12)}">${index}</text>`).join('');

  return `<svg class="radar-chart ${compact ? 'radar-compact' : 'radar-wide'}" viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <g pointer-events="none">${rings}${spokes}<polygon class="radar-area" points="${axes.map(({ marker }) => marker.join(',')).join(' ')}"/><g class="radar-scale">${scale}</g></g>
    ${axes.map(({ skill, angle, value, marker }) => {
      const [x, y] = point(angle, radius);
      const [labelX, labelY] = point(angle, radius + (compact ? 12 : 17));
      const side = Math.cos(angle);
      const anchor = side > .24 ? 'start' : side < -.24 ? 'end' : 'middle';
      const name = (compact && compactSkillNames[skill.id]) || skill.name;
      const lines = name.length > (compact ? 11 : 16) ? name.split(' ') : [name];
      const edge = radius + 4;
      const edgeA = point(angle - turn / 2, edge);
      const edgeB = point(angle + turn / 2, edge);
      const label = lines.map((line, index) => `<tspan x="${labelX}" y="${labelY + (index - (lines.length - 1) / 2) * (compact ? 12 : 15)}">${escapeHTML(line)}</tspan>`).join('');
      return `<g class="radar-axis${skill.id === selected ? ' is-active' : ''}" data-action="radar-skill" data-value="${skill.id}">
        <path class="radar-sector" d="M ${point(angle - turn / 2, 13).join(' ')} L ${edgeA.join(' ')} A ${edge} ${edge} 0 0 1 ${edgeB.join(' ')} L ${point(angle + turn / 2, 13).join(' ')} Z"/>
        <line class="radar-active-spoke" x1="${cx}" y1="${cy}" x2="${x}" y2="${y}"/>
        <circle class="radar-point${value ? '' : ' radar-zero-point'}" cx="${marker[0]}" cy="${marker[1]}" r="3.1"/>
        <text class="radar-axis-label" text-anchor="${anchor}" dominant-baseline="central">${label}</text>
      </g>`;
    }).join('')}
  </svg>`;
}

function radarDetail(skill) {
  const value = score(skill.id);
  return `<p class="label">${skill.category}</p>
    <h3>${skill.name}</h3>
    <p class="radar-value"><strong>${value}<span> / 5</span></strong><span>Resume evidence</span></p>
    <p class="radar-evidence">${evidenceLegend[value]}</p>
    <p class="radar-description">${skill.description}</p>`;
}

function skillsVisualizer() {
  const strongest = skills.reduce((best, skill) => score(skill.id) > score(best.id) ? skill : best);
  const selected = skillIndex[state.radarSkill] || strongest;
  return `<section class="panel dashboard-panel skill-visualizer" aria-labelledby="skill-visualizer-title">
    <h2 id="skill-visualizer-title">Skills visualizer</h2>
    <p>Choose an axis or pick a skill to see what its score means.</p>
    <div class="skill-visualizer-layout">
      <div class="radar-plot">
        ${radarGraphic({ width: 644, height: 416, radius: 156, compact: false }, selected.id)}
        ${radarGraphic({ width: 326, height: 290, radius: 98, compact: true }, selected.id)}
        <div id="radar-tooltip" class="radar-tooltip" aria-hidden="true" hidden></div>
      </div>
      <div class="radar-details">
        ${selectField('radar-skill', 'Inspect a skill', skills.map(skill => [skill.id, skill.name]), selected.id, 'id="radar-skill"')}
        <div class="radar-reading" id="radar-reading" aria-live="polite" aria-atomic="true">${radarDetail(selected)}</div>
      </div>
    </div>
  </section>`;
}

function highlightRadarSkill(id) {
  main.querySelectorAll('.radar-axis').forEach(axis => axis.classList.toggle('is-active', axis.dataset.value === id));
}

function selectRadarSkill(id) {
  state.radarSkill = id;
  byId('radar-skill').value = id;
  byId('radar-reading').innerHTML = radarDetail(skillIndex[id]);
  byId('radar-tooltip').hidden = true;
  highlightRadarSkill(id);
}

function showRadarTooltip(axis) {
  const { value: id } = axis.dataset;
  highlightRadarSkill(id);
  const tooltip = byId('radar-tooltip');
  tooltip.innerHTML = `<strong>${skillName(id)}</strong><span>${score(id)} / 5</span>`;
  tooltip.hidden = false;
  const marker = axis.querySelector('.radar-point').getBoundingClientRect();
  const plot = axis.closest('.radar-plot').getBoundingClientRect();
  const halfWidth = tooltip.offsetWidth / 2;
  const x = marker.left + marker.width / 2 - plot.left;
  tooltip.style.left = Math.min(plot.width - halfWidth, Math.max(halfWidth, x)) + 'px';
  tooltip.style.top = marker.top + marker.height / 2 - plot.top + 'px';
}

function fitRing(fit) {
  return `<div class="fit-ring" title="Profile compatibility (demo)"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27"/><circle cx="32" cy="32" r="27" pathLength="100" stroke-dasharray="${fit} 100"/></svg><span>${fit}%<span class="sr-only"> profile compatibility (demo)</span></span></div>`;
}

function miniCourse(course) {
  return `<article class="mini-course"><span class="tile-icon">${icon('book', 19)}</span><div><h3>${course.title}</h3><p>${providers[course.provider].name} · ${course.mode} · Example</p></div><button type="button" class="icon-button" data-action="course" data-value="${course.id}" aria-label="View ${course.title}">${icon('arrow', 17)}</button></article>`;
}

function dashboardView() {
  const best = rankedJobs()[0];
  const job = targetJob();
  const type = mbtiType(profile().mbti);
  const group = mbtiGroups[type.group];
  const known = skills.filter(skill => score(skill.id) > 0).sort((a, b) => score(b.id) - score(a.id));
  const focus = gapsFor(job).filter(item => item.gap).slice(0, 3);
  const recs = rankedCourses(job || best).filter(item => item.relevance).slice(0, 2);
  const progress = roadmapProgress();
  const metrics = [
    ['chart', 'Skills identified', known.length, 'skills', 'Scores above zero'],
    ['compass', 'Career paths', jobs.length, 'careers', 'Illustrative career matches'],
    ['target', 'Top career match', best.fit + '%', 'careers', best.title],
    ['route', 'Roadmap completion', progress.percent + '%', 'roadmap', `${progress.done} of ${progress.total} tasks complete`]
  ];
  return `
    ${title('Overview', 'Hi ' + escapeHTML(profile().name.trim().split(/\s+/)[0]) + ', here is your career overview', 'Your sample skills, the closest career matches and the next steps in your plan.', `<div class="heading-actions"><span class="persona-badge" style="--mbti-soft:${group.soft};--mbti-color:${group.color}" title="MBTI personality: ${type.code} · ${type.name}">${personaPhoto(state.persona, 30)}<span><strong>${type.code}</strong><small>${type.name}</small></span></span>${goButton('Explore Careers', 'careers')}</div>`)}
    <section class="metric-grid" aria-label="Career summary">${metrics.map(([mark, label, value, view, note]) => `<button type="button" class="panel metric" data-action="go" data-value="${view}"><span class="metric-label"><span class="tile-icon">${icon(mark, 17)}</span>${label}</span><strong>${value}</strong><span>${note}</span></button>`).join('')}</section>
    <div class="dashboard-grid">
      <section class="panel dashboard-panel"><div class="section-head"><h2>Your Skills at a Glance</h2>${goButton('All skills', 'skills', 'plain')}</div>${known.length ? evidenceBars(known.slice(0, 6)) : '<p>Enter evidence in your profile to see your strongest sample skills here.</p>'}</section>
      <section class="panel dashboard-panel top-match"><div class="section-head"><h2>Best Career Match</h2>${fitRing(best.fit)}</div><p class="label">${best.sector}</p><h3>${best.title}</h3><p>${best.summary}</p>${button('View Career', 'role', { value: best.id, mark: 'arrow' })}${notice('Profile compatibility uses illustrative evidence.')}</section>
      <section class="panel dashboard-panel"><div class="section-head"><h2>Recommended Upskilling</h2>${goButton('Training hub', 'upskilling', 'plain')}</div><p>Examples for ${(job || best).title}.</p>${recs.length ? recs.map(miniCourse).join('') : '<p>No training is suggested for the current evidence gaps.</p>'}</section>
      <section class="panel dashboard-panel"><div class="section-head"><h2>Next Step</h2>${goButton('My roadmap', 'roadmap', 'plain')}</div>
        ${progress.next ? `<p class="next-task">${progress.next.title}</p>${bar(progress.percent, 100)}` : `<p>${progress.total ? 'You completed all the tasks in your current roadmap.' : job ? 'Generate a learning roadmap for ' + job.title + '.' : 'Choose a target career to start your learning roadmap.'}</p>`}
        <h3 class="small-heading">Skills to Focus On</h3>${job ? `<div class="chips">${focus.length ? focus.map(item => chip(skillName(item.skillId), true)).join('') : chip('All sample requirements covered')}</div>${goButton('See skill gap', 'gap', 'plain')}` : '<p>Your priority skills will appear after you select a target.</p>'}
      </section>
    </div>`;
}

function skillsView() {
  const categories = [...new Set(skills.map(item => item.category))];
  const list = skills.filter(item => state.skillCategory === 'All' || state.skillCategory === item.category)
    .sort((a, b) => score(b.id) - score(a.id) || a.name.localeCompare(b.name));
  return `${title('My skills', 'Your skills and evidence scores', 'How your sample profile supports each skill, scored from 0 to 5.', goButton('Edit Profile', 'profile', 'secondary', 'user'))}
    ${skillsVisualizer()}
    <div class="dashboard-grid skills-grid">
      <section class="panel dashboard-panel">
        <h2>Resume evidence scores</h2>
        <div class="filter-chips" aria-label="Filter skills by category">${['All', ...categories].map(category => button(category, 'skill-category', { style: 'filter', value: category, attrs: `aria-pressed="${state.skillCategory === category}"` })).join('')}</div>
        ${evidenceBars(list)}
      </section>
      <div class="stacked">
        <section class="panel dashboard-panel"><h2>Skill categories</h2><p>Average score across the demo skills in each category.</p><ul class="evidence-bars">${categories.map(category => {
          const entries = skills.filter(skill => skill.category === category);
          const average = entries.reduce((sum, skill) => sum + score(skill.id), 0) / entries.length;
          return `<li><div class="bar-label"><span>${category}</span><strong>${average.toFixed(1)}<span> / 5</span></strong></div>${bar(average)}</li>`;
        }).join('')}</ul></section>
        <section class="panel dashboard-panel"><h2>How scores work</h2><ol class="legend">${evidenceLegend.map((item, index) => `<li><span>${index}</span>${item}</li>`).join('')}</ol>${notice('All scores are illustrative. A 5 describes the top of the scale.')}</section>
      </div>
    </div>`;
}

function jobCard(job, featured) {
  const gaps = gapsFor(job);
  const strengths = gaps.filter(item => !item.gap).map(item => skillName(item.skillId));
  const priority = gaps.filter(item => item.gap).slice(0, 2).map(item => skillName(item.skillId));
  const matched = strengths.length ? strengths : gaps.filter(item => item.current).slice(0, 2).map(item => skillName(item.skillId));
  const selected = targetJob()?.id === job.id;
  const interest = job.tags.some(tag => profile().interests.includes(tag));
  const reason = matched.length ? `Your profile shows evidence in ${matched.slice(0, 2).join(' and ')}.` : 'This role has limited overlap with your current evidence.';
  return `<article class="panel job-card${selected ? ' selected-card' : ''}">
    <div class="card-top"><span class="tile-icon">${icon(job.icon, 22)}</span>${selected ? chip('Your target', true) : featured ? chip('Top match', true) : ''}${fitRing(job.fit)}</div>
    <p class="label">${job.sector}</p><h2>${job.title}</h2><p>${job.summary}</p>
    <div class="card-details"><div><strong>Matching skills</strong><div class="chips">${matched.length ? matched.map(item => chip(item)).join('') : '<span>None in the sample profile</span>'}</div></div>
    <div><strong>Primary gaps</strong><div class="chips">${priority.length ? priority.map(item => chip(item, true)).join('') : chip('Sample requirements covered')}</div></div>
    <div><strong>Why this matches you</strong><p>${reason}${interest ? ' It also aligns with your interests.' : ''}</p></div></div>
    <div class="button-row">${button('Explore Role', 'role', { style: 'secondary', value: job.id })}${selected ? goButton('View Skill Gap', 'gap') : button('Choose as Target', 'target', { value: job.id, mark: 'arrow' })}</div>
  </article>`;
}

function updateCareerResults() {
  const ranked = rankedJobs();
  const featured = new Set(ranked.slice(0, 3).map(job => job.id));
  const results = ranked.filter(job => (state.careerCategory === 'All' || state.careerCategory === job.category) && job.title.toLowerCase().includes(state.careerSearch.trim().toLowerCase()));
  if (state.careerSort === 'name') results.sort((a, b) => a.title.localeCompare(b.title));
  byId('career-count').textContent = results.length + (results.length === 1 ? ' career path' : ' career paths');
  byId('career-results').innerHTML = results.length ? results.map(job => jobCard(job, featured.has(job.id))).join('') : emptyState('search', 'No matching careers', 'Try a different job title or reset your filters.', button('Reset filters', 'clear-careers', { style: 'secondary' }));
}

function careersView() {
  const categories = ['All', ...new Set(jobs.map(job => job.category))];
  return `${title('Career explorer', 'Career options in Malaysia', 'Compare example roles across Malaysian industries, then choose a target career.')}
    <div class="panel filter-bar">
      <label class="field search-field"><span>Search by job title</span><span class="search-input">${icon('search', 17)}<input type="search" name="career-search" value="${escapeHTML(state.careerSearch)}" placeholder="e.g. Data Analyst"></span></label>
      ${selectField('career-category', 'Industry', categories.map(item => [item, item === 'All' ? 'All industries' : item]), state.careerCategory)}
      ${selectField('career-sort', 'Sort by', [['match', 'Match score'], ['name', 'Name (A–Z)']], state.careerSort)}
    </div>
    <div class="result-line"><span id="career-count" class="label" aria-live="polite"></span><span>Profile compatibility (demo) uses skills and interests.</span></div>
    <div class="job-grid" id="career-results"></div>`;
}

function roleDetails(id) {
  const job = jobIndex[id];
  openModal(job.title, `<div class="modal-body">
    <div class="section-head"><p class="label">${job.sector}</p>${fitRing(compatibility(job))}</div><p>${job.summary}</p>
    <h3>Typical responsibilities</h3><ul>${job.responsibilities.map(item => `<li>${item}</li>`).join('')}</ul>
    <h3>Sample skill requirements</h3><div class="mini-requirements">${job.requirements.map(item => `<div><span>${skillName(item.skillId)}</span><strong>${item.level} / 5</strong></div>`).join('')}</div>
    <h3>Typical qualifications</h3><p>${job.qualification}</p>
    <h3>Example progression</h3><p>${job.progression.join(' → ')}</p>
  </div><div class="modal-actions">${button('Close', 'close', { style: 'secondary' })}${targetJob()?.id === id ? goButton('View Skill Gap', 'gap') : button('Choose as Target', 'target', { value: id, mark: 'arrow' })}</div>`);
}

function gapView() {
  const job = targetJob();
  if (!job) return `${title('Skill gap analysis', 'Skill gaps for your target career', '')}${emptyState('target', 'Choose a target career', 'Pick a career to compare your current evidence with the role’s sample requirements.', goButton('Explore Careers', 'careers'))}`;
  const gaps = gapsFor(job);
  const groups = [
    ['Strong skills', gaps.filter(item => item.gap === 0).length], ['Partial matches', gaps.filter(item => item.gap === 1).length],
    ['Priority gaps', gaps.filter(item => item.gap >= 2).length]
  ];
  const priorities = gaps.filter(item => item.gap > 0);
  return `${title('Skill gap analysis', 'Skill gaps for your target career', 'Your evidence compared with the sample requirements for <strong>' + job.title + '</strong>.', goButton('Change Career', 'careers', 'secondary', 'compass'))}
    <div class="gap-metrics">${groups.map(([heading, count]) => `<div class="panel gap-metric"><strong>${count}</strong><span>${heading}</span></div>`).join('')}</div>
    <section class="panel dashboard-panel">
      <div class="section-head"><h2>Current Evidence vs. Target</h2><span class="label">Scale 0–5</span></div>
      <div class="chart-legend"><span><i></i>Current evidence</span><span><i></i>Target requirement</span></div>
      <ol class="comparisons">${gaps.map(item => `<li><div class="comparison-name"><h3>${skillName(item.skillId)}</h3>${chip(!item.gap ? 'Strength' : item.gap === 1 ? 'Developing · gap 1' : 'Priority · gap ' + item.gap, item.gap >= 2)}</div>
        <div class="pair-bars"><div><span class="sr-only">Current evidence</span>${bar(item.current)}<span>${item.current} / 5</span></div><div><span class="sr-only">Target requirement</span>${bar(item.level, 5, 'bar-neutral')}<span>${item.level} / 5</span></div></div>
        <p>${item.gap ? 'The sample role calls for ' + item.gap + (item.gap === 1 ? ' more point' : ' more points') + ' of evidence.' : 'Your sample evidence covers this requirement.'}</p></li>`).join('')}</ol>
    </section>
    <section class="panel dashboard-panel priority-panel"><h2>${priorities.length ? 'Where to start' : 'Your sample evidence covers this role'}</h2>
      ${priorities.length ? `<p>Ordered by the evidence gap and the skill’s importance in the sample role.</p><ol class="priority-list">${priorities.map(item => `<li>${skillName(item.skillId)}</li>`).join('')}</ol>${button('Find Training for These Gaps', 'gap-training', { mark: 'arrow' })}` : `<p>Use your learning plan to practise portfolio and interview preparation.</p>${goButton('My Roadmap', 'roadmap')}`}
    </section>`;
}

function providerLink(course) {
  const provider = providers[course.provider];
  return `<a class="button button-secondary" href="${provider.url}" target="_blank" rel="noopener noreferrer">Open official platform${icon('external', 16)}<span class="sr-only"> for ${provider.name} (opens in a new tab)</span></a>`;
}

function courseCard(course) {
  return `<article class="panel course-card">
    <div class="card-top"><span class="tile-icon">${icon('book', 22)}</span>${course.relevance ? chip('Suggested for your gap', true) : chip('Example pathway')}</div>
    <p class="label">${providers[course.provider].name}</p><h2>${course.title}</h2><p class="course-type">Illustrative training pathway</p>
    <div class="chips">${course.skillIds.map(id => chip(skillName(id))).join('')}</div>
    <ul class="course-facts">
      <li>${icon('pin', 17)}${course.mode} · ${course.location === 'Online' ? 'Location independent' : course.location}</li>
      <li>${icon('clock', 17)}Demo estimate · ${course.minWeeks}–${course.maxWeeks} weeks</li>
      <li>${icon('info', 17)}Fee · Check provider. Eligibility · Verify with provider.</li>
    </ul>
    <div class="button-row">${button('View pathway', 'course', { value: course.id, style: 'secondary' })}${addCourseButton(course)}</div>
    <div>${providerLink(course)}</div>
  </article>`;
}

function addCourseButton(course) {
  const isAdded = journey().added.includes(course.id) || journey().roadmap?.courseIds.includes(course.id);
  return button(isAdded ? 'On roadmap' : 'Add to My Roadmap', 'add-course', { value: course.id, style: isAdded ? 'secondary' : 'primary', mark: isAdded ? 'check' : 'plus', attrs: isAdded ? 'disabled' : '' });
}

function courseDetails(id) {
  const course = courseIndex[id];
  openModal(course.title, `<div class="modal-body"><p class="label">Illustrative pathway · ${providers[course.provider].name}</p>
    <p>Use this example to guide your search on the official platform. Check the provider for available courses, eligibility, fees and recognition.</p>
    <h3>Skills addressed</h3><div class="chips">${course.skillIds.map(item => chip(skillName(item))).join('')}</div>
    <h3>Sample format</h3><p>${course.mode} · ${course.location} · Demo estimate of ${course.minWeeks}–${course.maxWeeks} weeks.</p>
  </div><div class="modal-actions">${providerLink(course)}${addCourseButton(course)}</div>`);
}

function filteredCourses() {
  const f = state.training;
  const budgetLimit = [500, 1500, Infinity][budgets.indexOf(profile().budget)];
  const records = rankedCourses(targetJob() || rankedJobs()[0]).filter(item =>
    (f.view === 'all' || item.relevance > 0) &&
    (f.skill === 'All' || item.skillIds.includes(f.skill)) &&
    (f.source === 'All' || f.source === item.provider) &&
    (f.mode === 'All' || f.mode === item.mode) &&
    (f.location === 'All' || f.location === item.location) &&
    (f.budget === 'All' || (f.budget === 'verify' ? item.fee === null : item.fee !== null && item.fee <= budgetLimit))
  );
  return f.sort === 'name' ? records.sort((a, b) => a.title.localeCompare(b.title)) : records;
}

function updateTrainingResults() {
  const results = filteredCourses();
  byId('training-count').textContent = results.length + (results.length === 1 ? ' pathway' : ' pathways');
  byId('training-results').innerHTML = results.length ? results.map(courseCard).join('') :
    emptyState('book', 'No matching pathways', 'Try a different skill or learning mode, or browse the full example catalogue.', button('Reset and browse all', 'clear-training', { style: 'secondary' }));
}

function trainingView() {
  const f = state.training;
  const role = targetJob() || rankedJobs()[0];
  const withAll = (list, heading) => [['All', heading], ...list];
  const availableSkills = [...new Set(courses.flatMap(item => item.skillIds))].sort((a, b) => skillName(a).localeCompare(skillName(b)));
  return `${title('Upskilling hub', 'Training that closes your skills gap', 'Programme examples for ' + role.title + ', plus the full catalogue.')}
    ${notice('The catalogue uses mock programmes. Check official providers for available courses, fees, intake dates, recognition and eligibility.')}
    <div class="filter-chips view-filters">${[['suggested', 'Suggested for your gaps'], ['all', 'All pathways']].map(([value, label]) => button(label, 'training-view', { style: 'filter', value, attrs: `aria-pressed="${f.view === value}"` })).join('')}</div>
    <div class="panel filter-bar training-filters">
      ${selectField('skill', 'Skill', withAll(availableSkills.map(id => [id, skillName(id)]), 'All skills'), f.skill, 'data-training')}
      ${selectField('source', 'Source', withAll(Object.entries(providers).map(([id, provider]) => [id, provider.name]), 'All sources'), f.source, 'data-training')}
      ${selectField('mode', 'Learning mode', withAll(learningModes, 'All modes'), f.mode, 'data-training')}
      ${selectField('location', 'Location', withAll([...new Set(courses.map(item => item.location))], 'All locations'), f.location, 'data-training')}
      ${selectField('budget', 'Budget', [['All', 'All pathways'], ['within', 'Confirmed within ' + profile().budget], ['verify', 'Price to verify']], f.budget, 'data-training')}
      ${selectField('sort', 'Sort by', [['relevance', 'Relevance'], ['name', 'Name (A–Z)']], f.sort, 'data-training')}
    </div>
    <div class="result-line"><span class="label" id="training-count" aria-live="polite"></span>${button('Browse full catalogue', 'clear-training', { style: 'plain' })}</div>
    <div class="job-grid" id="training-results"></div>`;
}

function generateSnapshot(job, hours, startDate) {
  const positive = gapsFor(job).filter(item => item.gap);
  return {
    hours, startDate,
    skillIds: positive.slice(0, 3).map(item => item.skillId),
    courseIds: rankedCourses(job).filter(item => item.relevance && !journey().added.includes(item.id)).slice(0, 2).map(item => item.id)
  };
}

function roadmapPhases() {
  const job = targetJob();
  const plan = journey().roadmap;
  if (!job || !plan) return [];
  const task = (id, title, course = null) => ({ id, title, course });
  const coreWeeks = [2, 3, 2, 1].map(weeks => Math.max(1, Math.ceil(weeks * 5 / plan.hours)));
  const foundation = plan.skillIds.map(id => {
    const practical = ['tools', 'auto', 'electrical', 'safety', 'sensors'].includes(id);
    return task('skill-' + id, practical ? 'Review ' + skillName(id) + ' with a qualified instructor or supervisor.' : 'Study the fundamentals of ' + skillName(id) + ' and document a practice example.');
  });
  if (foundation.length < 2) foundation.push(task('foundation-inventory', 'Map two examples from your experience to the sample role requirements.'));
  if (foundation.length < 2) foundation.push(task('foundation-review', 'Choose one existing skill to demonstrate more clearly in your portfolio.'));
  const training = [...new Set([...plan.courseIds, ...journey().added])].map(id => task('course-' + id, 'Explore the ' + courseIndex[id].title + ' example pathway.', courseIndex[id]));
  if (!training.length) training.push(task('training-review', 'Compare one official training pathway with the sample role requirements.'));
  return [
    { id: 'foundations', title: 'Build Foundations', goal: 'Develop the evidence you need for this role.', weeks: coreWeeks[0], tasks: foundation },
    { id: 'training', title: 'Upskill with Training', goal: 'Check provider options and plan a realistic study schedule.', weeks: coreWeeks[1], tasks: [...training, task('training-schedule', 'Set recurring study time and record weekly practice goals.')] },
    { id: 'projects', title: 'Build Real Projects', goal: 'Create a portfolio example you can describe in an interview.', weeks: coreWeeks[2], tasks: job.project.map((label, index) => task('project-' + (index + 1), label)) },
    { id: 'prepare', title: 'Prepare for Jobs', goal: 'Translate your experience into an application for the target role.', weeks: coreWeeks[3], tasks: [
      task('prepare-resume', 'Update your demo resume with evidence relevant to ' + job.title + '.'),
      task('prepare-interview', 'Prepare two interview examples that explain your actions and results.'),
      task('prepare-application', 'Draft a tailored application for a sample ' + job.title + ' role.')
    ] }
  ];
}

function roadmapProgress() {
  const tasks = roadmapPhases().flatMap(phase => phase.tasks);
  const done = tasks.filter(task => journey().completed.includes(task.id)).length;
  return {
    done, total: tasks.length, percent: tasks.length ? Math.round(100 * done / tasks.length) : 0,
    next: tasks.find(task => !journey().completed.includes(task.id))
  };
}

function roadmapView() {
  const job = targetJob();
  if (!job) return `${title('My roadmap', 'Your learning roadmap', '')}${emptyState('route', 'Choose a target career', 'Pick a target role, then build a learning pathway from your sample skills.', goButton('Explore Careers', 'careers'))}`;
  const plan = journey().roadmap;
  const progress = roadmapProgress();
  let week = 1;
  return `${title('My roadmap', 'Your learning roadmap', 'A four-phase learning plan for <strong>' + job.title + '</strong>.', goButton('Change Career', 'careers', 'secondary', 'compass'))}
    <section class="panel dashboard-panel">
      <div class="section-head"><h2>Learning schedule</h2>${chip('Simulated roadmap', true)}</div>
      <form class="roadmap-settings" id="roadmap-form">
        ${selectField('hours', 'Learning time per week', learningHours.map(hours => [hours, hours + ' hours/week']), profile().hours)}
        <label class="field"><span>Start date (optional)</span><input type="date" name="start-date" value="${escapeHTML(plan?.startDate || '')}"></label>
        <button type="submit" class="button button-primary" ${state.generation ? 'disabled' : ''}>${plan ? 'Regenerate Roadmap' : 'Generate My Career Roadmap'}${icon('arrow', 17)}</button>
      </form>
      <p id="generation-message" class="loading-message" role="status" ${state.generation ? '' : 'hidden'}>Demo simulation · Building your learning pathway…</p>
      ${!plan && journey().added.length ? `<p>${journey().added.length} saved ${journey().added.length === 1 ? 'pathway will' : 'pathways will'} be included when you generate the roadmap.</p>` : ''}
    </section>
    ${plan ? `<div class="roadmap-layout">
      <section class="roadmap-phases" aria-label="Learning phases">${roadmapPhases().map((phase, index) => {
        const range = phase.weeks === 1 ? 'Week ' + week : 'Weeks ' + week + '–' + (week + phase.weeks - 1);
        week += phase.weeks;
        const complete = phase.tasks.filter(task => journey().completed.includes(task.id)).length;
        return `<details class="panel phase" ${index === 0 ? 'open' : ''}><summary><span class="phase-number">0${index + 1}</span><span class="phase-title"><strong>${phase.title}</strong><span>${range} · Demo estimate</span></span><span class="phase-count" data-phase-count>${complete}/${phase.tasks.length}</span>${icon('down', 17)}</summary>
          <div class="phase-body"><p>${phase.goal}</p>${phase.tasks.map(task => `<div class="task-row"><label><input type="checkbox" data-task="${task.id}" ${journey().completed.includes(task.id) ? 'checked' : ''}><span>${task.title}</span></label>${task.course ? providerLink(task.course) : ''}</div>`).join('')}</div>
        </details>`;
      }).join('')}</section>
      <aside class="panel dashboard-panel roadmap-status">
        <h2>Your progress</h2><div id="roadmap-progress" role="status">${roadmapProgressMarkup(progress)}</div>
        <h3 class="small-heading">Next best action</h3><p id="next-action">${progress.next?.title || 'All tasks in this roadmap are complete.'}</p>
        <div class="stacked-buttons">${goButton('Add training', 'upskilling', 'secondary', 'plus')}${button('Reset Progress', 'reset-roadmap', { style: 'plain' })}</div>
        ${notice('Task completion measures progress through your plan. Evidence scores are edited in My Profile.')}
      </aside>
    </div>` : emptyState('route', 'Your plan is ready to generate', 'Set your weekly learning time to see the foundation, training, project and job preparation tasks.')}`;
}

function roadmapProgressMarkup(progress) {
  return `<div class="progress-amount"><strong>${progress.percent}%</strong><span>${progress.done} of ${progress.total} tasks complete</span></div>${bar(progress.percent, 100)}`;
}

function updateTask(control) {
  const completed = new Set(journey().completed);
  if (control.checked) completed.add(control.dataset.task);
  else completed.delete(control.dataset.task);
  journey().completed = [...completed];
  persist();
  const progress = roadmapProgress();
  byId('roadmap-progress').innerHTML = roadmapProgressMarkup(progress);
  byId('next-action').textContent = progress.next?.title || 'All tasks in this roadmap are complete.';
  const phase = control.closest('details');
  phase.querySelector('[data-phase-count]').textContent = phase.querySelectorAll('input:checked').length + '/' + phase.querySelectorAll('input').length;
  notify(control.checked ? 'Task marked complete.' : 'Task marked incomplete.');
}

function atlasView() {
  return `${title('Skills Atlas', 'Skills supply, demand and gaps by state', 'Training places, hiring demand and skills gaps for each state and district, using illustrative demo data. Your profile’s location is outlined on the map.', chip('Demo data', true))}
    <section class="panel skills-atlas-panel">
      <div id="skills-atlas" class="skills-atlas"></div>
      <p class="atlas-footnote">State and district boundaries use official DOSM/open data. Supply, demand, gap, employer and institution figures are illustrative demo data — not live labour-market statistics.</p>
    </section>`;
}

function settingsView() {
  const type = mbtiType(profile().mbti);
  return `${title('My profile', 'Your profile and preferences', 'Edit the sample details that shape your career matches and learning plan.', button('Change Demo Persona', 'persona', { style: 'secondary', mark: 'down' }))}
    <div class="settings-grid">
      <form id="profile-form">${profileFields()}<button type="submit" class="button button-primary">Save Changes${icon('check', 17)}</button></form>
      <aside class="panel dashboard-panel settings-info">
        <div class="settings-persona">${personaPhoto(state.persona, 72)}<div><strong>${escapeHTML(profile().name)}</strong><span>${type.code} · ${type.name}</span></div></div>
        <h2>Demo settings</h2>
        <dl><dt>Sample persona</dt><dd>${personas[state.persona].name}</dd><dt>MBTI personality</dt><dd>${type.code} · ${type.name} (${mbtiGroups[type.group].label})</dd><dt>Target career</dt><dd>${targetJob()?.title || 'Choose a career in Career Explorer'}</dd><dt>Selected resume</dt><dd>${state.file ? escapeHTML(state.file.name) + ' · This session only' : 'Using a sample profile'}</dd></dl>
        ${notice('This browser can save demo preferences, target careers and roadmap tasks. File details, editable profile text and evidence scores stay in the current session.', 'lock')}
        ${goButton('How scores work', 'skills', 'plain', 'info')}
        ${goButton('Upload New Resume', 'upload', 'plain', 'upload')}
        ${button('Reset Demo', 'reset-demo', { style: 'secondary' })}
        ${button('Clear Saved Demo Progress', 'clear-saved', { style: 'secondary' })}
      </aside>
    </div>`;
}

const views = {
  welcome: landingView, upload: uploadView, 'profile-review': reviewView, dashboard: dashboardView,
  skills: skillsView, careers: careersView, gap: gapView, upskilling: trainingView,
  roadmap: roadmapView, profile: settingsView, atlas: atlasView
};

function draw() {
  if (window.SkillsAtlas) window.SkillsAtlas.destroy();
  shell();
  main.innerHTML = views[state.view]();
  if (state.view === 'careers') updateCareerResults();
  if (state.view === 'upskilling') updateTrainingResults();
  if (state.view === 'atlas' && window.SkillsAtlas) {
    window.SkillsAtlas.mount(byId('skills-atlas'), { location: profile().location });
  }
}

function personaPicker() {
  const paths = {
    aina: { label: 'Data & technology', mark: 'chart', skills: ['excel', 'web'] },
    amir: { label: 'Automotive & trades', mark: 'wrench', skills: ['tools', 'auto'] }
  };
  openModal('Choose a <em>demo profile</em>', `<p class="modal-description">Pick a fictional profile to explore a career path and build a learning roadmap.</p>
    <div class="persona-grid">${Object.entries(personas).map(([id, persona]) => {
      const path = paths[id];
      return `<button type="button" class="persona-card persona-${id}" data-action="choose-persona" data-value="${id}">
        <span class="persona-path"><span class="persona-icon">${icon(path.mark, 21)}</span><span>${path.label}</span></span>
        <span class="persona-details">
          <span class="persona-identity">${personaPhoto(id, 48)}<span class="persona-identity-text"><strong class="persona-name">${persona.name}</strong><span class="persona-headline">${persona.headline}</span></span></span>
          <span class="chips">${path.skills.map(skill => chip(skillName(skill))).join('')}${chip(persona.mbti + ' · ' + mbtiType(persona.mbti).name)}</span>
        </span>
        <span class="persona-footer">
          <span class="persona-location">${icon('pin', 15)}${persona.location}</span>
          <span class="persona-arrow" aria-hidden="true">${icon('arrow', 18)}</span>
        </span>
      </button>`;
    }).join('')}</div>`);
}

function reviewPersona(id, from, keepFile = false) {
  const changed = state.persona !== id;
  const enteringDemo = state.view === 'welcome' || state.view === 'upload';
  state.persona = id;
  state.processing = false;
  state.generation = false;
  if (!keepFile) state.file = null;
  state.fileError = '';
  state.reviewPending = true;
  reviewReturn = from;
  if (changed) {
    state.skillCategory = 'All';
    state.radarSkill = null;
    state.careerSearch = '';
    state.careerCategory = 'All';
    state.careerSort = 'match';
    resetTraining();
  }
  persist();
  if (!enteringDemo && journey().started) {
    go('dashboard');
    notify(personas[id].name + '’s demo workspace is open.');
  } else {
    go('profile-review');
  }
}

function chooseFile(file) {
  if (!file || state.processing) return;
  state.file = null;
  state.fileError = '';
  if (!/\.(pdf|docx)$/i.test(file.name)) {
    state.fileError = 'Choose a PDF or DOCX file.';
  } else if (file.size > 5 * 1024 * 1024) {
    state.fileError = 'This file exceeds 5 MB. Choose a smaller file.';
  } else {
    const size = file.size >= 1024 * 1024 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.ceil(file.size / 1024) + ' KB';
    state.file = { name: file.name, size };
  }
  draw();
  byId('resume-file').focus({ preventScroll: true });
}

function simulateResume() {
  if (!state.file || state.processing) return;
  const operation = {};
  state.processing = operation;
  draw();
  setTimeout(() => {
    if (state.processing === operation && state.view === 'upload') {
      byId('processing-message').textContent = 'Demo simulation · Organising evidence and career examples…';
    }
  }, 650);
  setTimeout(() => {
    if (state.processing !== operation) return;
    state.processing = false;
    if (state.view === 'upload') reviewPersona(state.persona, 'upload', true);
  }, 1500);
}

function resetTraining(view = 'suggested') {
  state.training = { view, skill: 'All', source: 'All', mode: 'All', location: 'All', budget: 'All', sort: 'relevance' };
}

function setTarget(id) {
  if (journey().target !== id) {
    Object.assign(journey(), { target: id, roadmap: null, added: [], completed: [] });
    state.generation = false;
  }
  resetTraining();
  persist();
  go('gap');
  notify('Target set to ' + jobIndex[id].title + '.');
}

function addCourse(id) {
  if (!targetJob()) {
    openModal('Choose a target first', `<p class="modal-description">Select a career to build a roadmap for it, then add the training pathways you want to explore.</p><div class="modal-actions">${goButton('Explore Careers', 'careers')}</div>`);
    return;
  }
  if (journey().added.includes(id) || journey().roadmap?.courseIds.includes(id)) return;
  journey().added.push(id);
  persist();
  const focused = document.activeElement;
  if (modal.open) {
    courseDetails(id);
    if (state.view === 'upskilling') updateTrainingResults();
  } else {
    updateTrainingResults();
    const replacement = byId('training-results').querySelector(`[data-action="course"][data-value="${id}"]`);
    if (focused?.dataset?.action === 'add-course') replacement?.focus({ preventScroll: true });
  }
  notify(journey().roadmap ? 'Example pathway added to your roadmap.' : 'Pathway saved. It will appear when you generate your roadmap.');
}

function makeRoadmap(form) {
  if (state.generation) return;
  const inputs = new FormData(form);
  const hours = Number(inputs.get('hours'));
  const startDate = inputs.get('start-date');
  const activeJourney = journey();
  const snapshot = generateSnapshot(targetJob(), hours, startDate);
  const operation = {};
  state.generation = operation;
  form.querySelector('button[type="submit"]').disabled = true;
  byId('generation-message').hidden = false;
  setTimeout(() => {
    if (state.generation !== operation) return;
    state.generation = false;
    activeJourney.roadmap = snapshot;
    profile().hours = hours;
    activeJourney.preferences.hours = hours;
    const taskIds = new Set(roadmapPhases().flatMap(phase => phase.tasks).map(task => task.id));
    activeJourney.completed = activeJourney.completed.filter(id => taskIds.has(id));
    persist();
    if (state.view === 'roadmap') {
      draw();
      byId('roadmap-form').querySelector('button[type="submit"]').focus({ preventScroll: true });
    }
    notify('Your demo roadmap is ready.');
  }, 900);
}

function saveProfile(form) {
  const input = new FormData(form);
  const preferences = Object.fromEntries(['location', 'budget', 'mode'].map(name => [name, input.get(name)]));
  preferences.hours = Number(input.get('hours'));
  preferences.interests = input.getAll('interests');
  preferences.mbti = profile().mbti;
  const info = Object.fromEntries(['name', 'qualification', 'field', 'experience', 'projects'].map(name => [name, input.get(name).trim()]));
  if (!info.name) {
    const nameField = form.elements.namedItem('name');
    nameField.setCustomValidity('Enter a name for the demo profile.');
    nameField.reportValidity();
    return;
  }
  const scores = Object.fromEntries(skills.map(skill => [skill.id, Number(input.get('skill-' + skill.id))]));
  Object.assign(profile(), info, preferences, { scores });
  Object.assign(journey(), { started: true, preferences });
  state.reviewPending = false;
  persist();
  if (state.view === 'profile-review') go('dashboard');
  notify('Demo profile saved.');
}

function resetDemo(all) {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // Storage can be disabled on local files.
  }
  state.generation = false;
  for (const id of Object.keys(personas)) {
    const started = journeys[id].started;
    journeys[id] = emptyJourney();
    if (!all) journeys[id].started = started;
    else state.profiles[id] = { ...personas[id], scores: { ...personas[id].scores } };
  }
  if (all) {
    state.persona = 'aina';
    state.file = null;
    state.fileError = '';
    state.processing = false;
    state.reviewPending = false;
    state.skillCategory = 'All';
    state.radarSkill = null;
    state.careerSearch = '';
    state.careerCategory = 'All';
    state.careerSort = 'match';
    resetTraining();
    go('welcome');
  } else {
    modal.close();
    draw();
    main.focus({ preventScroll: true });
  }
  notify(all ? 'Demo reset to its starting point.' : 'Saved demo progress cleared.');
}

const actions = {
  go,
  'landing-section'(id) {
    const section = byId(id);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  },
  menu() {
    openModal('Career workspace', `<nav class="drawer-nav" aria-label="Career workspace">${byId('sidebar').querySelector('nav').innerHTML}</nav><div class="modal-actions">${goButton('Upload new resume', 'upload', 'secondary', 'upload')}</div>`);
  },
  close: () => modal.close(),
  persona: personaPicker,
  'choose-persona'(id) {
    if (!onboardingViews.includes(state.view) && id === state.persona) {
      modal.close();
      return;
    }
    reviewPersona(id, state.view === 'upload' ? 'upload' : 'welcome', id === state.persona && state.view === 'upload');
  },
  'remove-file'() {
    state.file = null;
    draw();
    byId('resume-file').focus({ preventScroll: true });
  },
  'process-resume': simulateResume,
  'sample-resume': () => reviewPersona('aina', 'upload'),
  'sample-reset'() {
    const sample = personas[state.persona];
    state.profiles[state.persona] = { ...sample, scores: { ...sample.scores } };
    journey().preferences = {};
    persist();
    draw();
    main.querySelector('[data-action="sample-reset"]').focus({ preventScroll: true });
    notify('Sample profile restored.');
  },
  'skill-category'(value) {
    state.skillCategory = value;
    draw();
    main.querySelector('[data-action="skill-category"][aria-pressed="true"]').focus({ preventScroll: true });
  },
  'radar-skill': selectRadarSkill,
  'mbti-scroll'(direction) {
    const grid = byId('mbti-grid');
    if (!grid) return;
    grid.scrollBy({ left: Number(direction) * Math.max(190, grid.clientWidth * .8), behavior: 'smooth' });
  },
  mbti(code) {
    const type = mbtiTypes.find(item => item.code === code);
    if (!type) return;
    profile().mbti = code;
    const current = byId('mbti-current');
    if (current) current.innerHTML = mbtiSummary(type);
    main.querySelectorAll('.mbti-option').forEach(option => option.setAttribute('aria-pressed', String(option.dataset.value === code)));
    main.querySelector(`.mbti-option[data-value="${code}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    shell();
    notify(type.code + ' · ' + type.name + ' selected.');
  },
  'clear-careers'() {
    state.careerSearch = '';
    state.careerCategory = 'All';
    state.careerSort = 'match';
    draw();
    main.querySelector('[name="career-search"]').focus({ preventScroll: true });
  },
  role: roleDetails,
  target(id) {
    if (journey().target !== id && (journey().roadmap || journey().added.length)) {
      confirmation('Change your target career?', 'Switching to ' + jobIndex[id].title + ' replaces the current learning plan and clears its saved tasks.', 'confirm-target', id, 'Change career');
    } else {
      setTarget(id);
    }
  },
  'confirm-target': setTarget,
  'gap-training'() {
    resetTraining();
    go('upskilling');
  },
  'training-view'(value) {
    state.training.view = value;
    draw();
    main.querySelector('[data-action="training-view"][aria-pressed="true"]').focus({ preventScroll: true });
  },
  'clear-training'() {
    resetTraining('all');
    draw();
    main.querySelector('[data-action="training-view"][aria-pressed="true"]').focus({ preventScroll: true });
  },
  course: courseDetails,
  'add-course': addCourse,
  'reset-roadmap'() {
    confirmation('Reset roadmap progress?', 'All tasks in this plan will become incomplete. Your target, schedule and learning pathways will stay in place.', 'confirm-reset-roadmap', '', 'Reset progress');
  },
  'confirm-reset-roadmap'() {
    journey().completed = [];
    persist();
    modal.close();
    draw();
    main.querySelector('[data-action="reset-roadmap"]').focus({ preventScroll: true });
    notify('Roadmap progress reset.');
  },
  'reset-demo'() {
    confirmation('Reset the full demo?', 'This restores both fictional profiles and clears saved progress, preferences and the selected filename.', 'confirm-reset-demo', '', 'Reset demo');
  },
  'confirm-reset-demo': () => resetDemo(true),
  'clear-saved'() {
    confirmation('Clear saved demo progress?', 'This removes both personas’ saved targets and roadmaps from this browser. You can keep exploring with your current profile in this session.', 'confirm-clear-saved', '', 'Clear progress');
  },
  'confirm-clear-saved': () => resetDemo(false)
};

document.addEventListener('click', event => {
  const element = event.target.closest('[data-action]');
  if (!element || element.disabled) return;
  event.preventDefault();
  actions[element.dataset.action]?.(element.dataset.value);
});

document.addEventListener('input', event => {
  if (event.target.name === 'career-search') {
    state.careerSearch = event.target.value;
    updateCareerResults();
  }
  if (event.target.name === 'name') event.target.setCustomValidity('');
});

document.addEventListener('change', event => {
  const field = event.target;
  if (field.id === 'resume-file') chooseFile(field.files[0]);
  if (field.id === 'radar-skill') selectRadarSkill(field.value);
  if (field.name === 'career-category') {
    state.careerCategory = field.value;
    updateCareerResults();
  }
  if (field.name === 'career-sort') {
    state.careerSort = field.value;
    updateCareerResults();
  }
  if (field.hasAttribute('data-training')) {
    state.training[field.name] = field.value;
    updateTrainingResults();
  }
  if (field.hasAttribute('data-evidence')) profile().scores[field.name.slice(6)] = Number(field.value);
  if (field.hasAttribute('data-task')) updateTask(field);
});

document.addEventListener('submit', event => {
  event.preventDefault();
  if (event.target.id === 'profile-form') saveProfile(event.target);
  if (event.target.id === 'roadmap-form') makeRoadmap(event.target);
});

main.addEventListener('pointerover', event => {
  const axis = event.target.closest('.radar-axis');
  if (axis && event.pointerType !== 'touch' && !axis.contains(event.relatedTarget)) showRadarTooltip(axis);
});

main.addEventListener('pointerout', event => {
  const axis = event.target.closest('.radar-axis');
  if (!axis || event.pointerType === 'touch' || axis.contains(event.relatedTarget)) return;
  byId('radar-tooltip').hidden = true;
  highlightRadarSkill(byId('radar-skill').value);
});

main.addEventListener('dragover', event => {
  if (state.view !== 'upload' || !event.dataTransfer.types.includes('Files')) return;
  event.preventDefault();
  const zone = event.target.closest('#dropzone');
  event.dataTransfer.dropEffect = zone && !state.processing ? 'copy' : 'none';
  if (!state.processing) zone?.classList.add('dragging');
});

main.addEventListener('dragleave', event => {
  const zone = event.target.closest('#dropzone');
  if (zone && !zone.contains(event.relatedTarget)) zone.classList.remove('dragging');
});

main.addEventListener('drop', event => {
  if (state.view !== 'upload') return;
  event.preventDefault();
  const zone = event.target.closest('#dropzone');
  if (!zone) return;
  zone.classList.remove('dragging');
  chooseFile(event.dataTransfer.files[0]);
});

modal.addEventListener('close', () => {
  if (!modal.open && modalTrigger?.isConnected) modalTrigger.focus({ preventScroll: true });
});

window.addEventListener('popstate', () => {
  const next = validView(location.hash.slice(1));
  if (next !== state.view) showView(next);
});
showView(location.hash.slice(1), false);
