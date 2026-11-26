import test from 'node:test';
import assert from 'node:assert/strict';
import { DeepSeekOcrError } from '../src/ai/deepseek-ocr.js';
import { loadConfig } from '../src/config.js';
import { api, makeTestApp } from './helpers.js';

const BOUNDARY = 'jomworklahParseResumeBoundary';
const PDF = Buffer.from('%PDF-1.4\n% jom kerja lah demo resume\n%%EOF\n', 'latin1');
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('wordprocessingml document')]);
const TEXT = Buffer.from('This is only a plain text note, not a resume.');

function multipart(parts) {
  const chunks = [];
  for (const [name, part] of Object.entries(parts)) {
    if (part === undefined) continue;
    if (typeof part === 'string') {
      chunks.push(Buffer.from(`--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${part}\r\n`));
    } else {
      chunks.push(Buffer.from(
        `--${BOUNDARY}\r\nContent-Disposition: form-data; name="${name}"; filename="${part.name}"\r\n`
        + `Content-Type: ${part.type ?? 'application/octet-stream'}\r\n\r\n`
      ));
      chunks.push(part.data);
      chunks.push(Buffer.from('\r\n'));
    }
  }
  chunks.push(Buffer.from(`--${BOUNDARY}--\r\n`));
  return Buffer.concat(chunks);
}

async function upload(base, token, parts, query = '') {
  const headers = { 'content-type': `multipart/form-data; boundary=${BOUNDARY}` };
  if (token) headers.authorization = `Bearer ${token}`;
  const response = await fetch(`${base}/api/parse-resume${query}`, {
    method: 'POST',
    headers,
    body: multipart(parts)
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

async function guestToken(base) {
  const session = await api(base, 'POST', '/api/session');
  return session.body.data.token;
}

function makeDeepSeekStub(options = {}) {
  const calls = { extractions: [] };
  const client = {
    model: 'deepseek-flash',
    async extract(file) {
      calls.extractions.push(file);
      if (options.documentFails) throw new DeepSeekOcrError('document', 'DeepSeek could not read the resume.');
      if (options.extractionFails) throw new DeepSeekOcrError('unavailable', 'DeepSeek extraction failed.');
      if (options.busy) throw new DeepSeekOcrError('busy', 'DeepSeek is busy.');
      return options.extraction ?? {};
    }
  };
  return { client, calls };
}

// Deliberately inconsistent casing and key names: the model is not held to them.
const messyExtraction = {
  Personal_Info: { name: 'Aina Rahman', email: 'aina.rahman@example.my', phone: '+60 12-345 6789', city: 'Shah Alam' },
  educationHistory: [
    { university: 'Kolej Technologi MARA', qualification: 'Diploma in Information Technology', start: '2022', end: '2024' }
  ],
  work_experience: [
    { company: 'Syarikat Maju Digital', title: 'IT Intern', duration: 'Mar 2024 - Aug 2024', achievements: ['Wrote SQL queries for monthly reports at work'] }
  ],
  Skills: ['Excel', { skill: 'Power BI', description: 'Attendance dashboard project' }, { skill: 'SQL', description: 'Reporting database queries at work' }],
  soft_skills: ['Teamwork'],
  personal_projects: [{ title: 'Campus attendance tracker', summary: 'Spreadsheet that exports a report per programme' }],
  certificates: [{ title: 'Excel Associate', authority: 'Microsoft', date: '2023' }],
  language_skills: [{ language: 'English', cef: 'B2' }]
};

test('parse-resume requires a bearer token', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());

  const result = await upload(ctx.base, null, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(result.status, 401);
  assert.equal(result.body.error.code, 'UNAUTHORIZED');
});

test('parse-resume rejects bodies that are not multipart uploads', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await api(ctx.base, 'POST', '/api/parse-resume', { token, body: { filename: 'resume.pdf' } });
  assert.equal(result.status, 415);
  assert.equal(result.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
});

test('parse-resume rejects missing, unsupported and empty files', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const missing = await upload(ctx.base, token, { note: 'no file part here' });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.code, 'FILE_REQUIRED');

  const wrongType = await upload(ctx.base, token, { file: { name: 'notes.txt', type: 'text/plain', data: TEXT } });
  assert.equal(wrongType.status, 400);
  assert.equal(wrongType.body.error.code, 'UNSUPPORTED_FILE_TYPE');

  const wrongBytes = await upload(ctx.base, token, { file: { name: 'resume.pdf', type: 'application/pdf', data: TEXT } });
  assert.equal(wrongBytes.status, 400);
  assert.equal(wrongBytes.body.error.code, 'INVALID_DOCUMENT');

  const empty = await upload(ctx.base, token, { file: { name: 'resume.pdf', type: 'application/pdf', data: Buffer.alloc(0) } });
  assert.equal(empty.status, 400);
  assert.equal(empty.body.error.code, 'EMPTY_FILE');
});

test('parse-resume enforces a 10 MB limit', async t => {
  assert.equal(loadConfig({}).resume.maxFileBytes, 10 * 1024 * 1024);

  const ctx = await makeTestApp({ resume: { maxFileBytes: 4096 } });
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const oversized = await upload(ctx.base, token, {
    file: { name: 'big.pdf', type: 'application/pdf', data: Buffer.concat([PDF, Buffer.alloc(8192, 0x20)]) }
  });
  assert.equal(oversized.status, 413);
  assert.equal(oversized.body.error.code, 'FILE_TOO_LARGE');
});

test('simulated mode returns sample data and saves it for the signed-in user', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'aina-resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(result.status, 200);

  const data = result.body.data;
  assert.equal(data.is_simulated, true);
  assert.equal(data.provider, 'simulated');
  assert.equal(data.model, null);
  assert.deepEqual(Object.keys(data.resume), [
    'personalInfo', 'education', 'experience', 'technicalSkills', 'softSkills', 'projects', 'certifications', 'languages'
  ]);
  assert.equal(data.file.name, 'aina-resume.pdf');
  assert.equal(data.file.mimetype, 'application/pdf');
  assert.equal(data.saved.persisted, true);

  const saved = await api(ctx.base, 'GET', '/api/me', { token });
  assert.equal(saved.body.data.profile.name, 'Aina Rahman');
  assert.equal(saved.body.data.profile.qualification, 'Diploma');
  assert.equal(saved.body.data.profile.location, 'Selangor');
  assert.equal(saved.body.data.profile.fieldOfStudy, 'Information Technology');
  const evidence = Object.fromEntries(saved.body.data.skills.map(skill => [skill.id, skill.evidenceLevel]));
  assert.ok(evidence.excel > 1, 'Excel should map to catalogue evidence');
  assert.ok(evidence.sql >= 1);
  assert.ok(evidence.teamwork >= 1);

  const unmatched = data.saved.unmatchedSkills.map(skill => skill.name);
  assert.ok(unmatched.includes('Microsoft Word'), `${unmatched.join(', ')} should list the skills outside the catalogue`);
});

test('persist=false previews the extraction without touching stored data', async t => {
  const ctx = await makeTestApp();
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } }, '?persist=false');
  assert.equal(result.status, 200);
  assert.equal(result.body.data.saved.persisted, false);
  assert.ok(result.body.data.saved.updatedProfileFields.includes('name'));
  assert.deepEqual(result.body.data.saved.matchedSkills.length > 0, true);

  const saved = await api(ctx.base, 'GET', '/api/me', { token });
  assert.equal(saved.body.data.profile.name, 'Guest');
  assert.equal(saved.body.data.skills.every(skill => skill.evidenceLevel === 0), true);
});

test('mode=simulate skips DeepSeek even when it is configured', async t => {
  const stub = makeDeepSeekStub();
  const ctx = await makeTestApp({}, { deepseek: stub.client });
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'resume.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: DOCX } }, '?mode=simulate');
  assert.equal(result.status, 200);
  assert.equal(result.body.data.is_simulated, true);
  assert.equal(result.body.data.file.mimetype, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  assert.equal(stub.calls.extractions.length, 0);
});

test('live mode normalises the DeepSeek result and persists profile and skills', async t => {
  const stub = makeDeepSeekStub({ extraction: messyExtraction });
  const ctx = await makeTestApp({}, { deepseek: stub.client });
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'aina-resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(result.status, 200);

  const data = result.body.data;
  assert.equal(data.is_simulated, false);
  assert.equal(data.provider, 'deepseek');
  assert.equal(data.model, 'deepseek-flash');
  assert.equal(data.resume.personalInfo.fullName, 'Aina Rahman');
  assert.equal(data.resume.personalInfo.location, 'Shah Alam');
  assert.equal(data.resume.education[0].institution, 'Kolej Technologi MARA');
  assert.equal(data.resume.education[0].startYear, 2022);
  assert.equal(data.resume.experience[0].role, 'IT Intern');
  assert.deepEqual(data.resume.experience[0].highlights, ['Wrote SQL queries for monthly reports at work']);
  assert.deepEqual(data.resume.technicalSkills.map(skill => skill.name), ['Excel', 'Power BI', 'SQL']);
  assert.deepEqual(data.resume.languages, [{ name: 'English', proficiency: 'B2' }]);

  assert.equal(stub.calls.extractions[0].filename, 'aina-resume.pdf');
  assert.deepEqual([...stub.calls.extractions[0].buffer].slice(0, 4), [0x25, 0x50, 0x44, 0x46]);

  const saved = await api(ctx.base, 'GET', '/api/me', { token });
  assert.equal(saved.body.data.profile.headline, 'IT Intern');
  assert.equal(saved.body.data.profile.location, 'Shah Alam');
  const evidence = Object.fromEntries(saved.body.data.skills.map(skill => [skill.id, skill.evidenceLevel]));
  assert.equal(evidence.excel, 1, 'a skill with no context stays at "mentioned"');
  assert.equal(evidence['data-viz'], 3, 'a project mention earns demonstrated-in-a-project');
  assert.equal(evidence.sql, 4, 'work evidence earns demonstrated-in-substantial-work');
});

test('DeepSeek failures return an error instead of simulated data', async t => {
  const failing = makeDeepSeekStub({ extractionFails: true });
  const ctx = await makeTestApp({}, { deepseek: failing.client });
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(result.status, 502);
  assert.equal(result.body.error.code, 'RESUME_EXTRACTION_FAILED');
  assert.equal(result.body.data, undefined);
});

test('unreadable documents and provider downtime have distinct codes', async t => {
  const unreadable = makeDeepSeekStub({ documentFails: true });
  const unreadableCtx = await makeTestApp({}, { deepseek: unreadable.client });
  t.after(() => unreadableCtx.close());
  const firstToken = await guestToken(unreadableCtx.base);

  const document = await upload(unreadableCtx.base, firstToken, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(document.status, 400);
  assert.equal(document.body.error.code, 'INVALID_DOCUMENT');

  const unusable = makeDeepSeekStub({ busy: true });
  const unusableCtx = await makeTestApp({}, { deepseek: unusable.client });
  t.after(() => unusableCtx.close());
  const secondToken = await guestToken(unusableCtx.base);

  const rejected = await upload(unusableCtx.base, secondToken, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(rejected.status, 503);
  assert.equal(rejected.body.error.code, 'AI_PROVIDER_BUSY');
});

test('mode=live without a configured key explains what is missing', async t => {
  const ctx = await makeTestApp({}, { deepseek: null });
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } }, '?mode=live');
  assert.equal(result.status, 503);
  assert.equal(result.body.error.code, 'AI_NOT_CONFIGURED');
  assert.match(result.body.error.message, /DEEPSEEK_API_KEY/);
});

test('an empty DeepSeek result is treated as an unusable document', async t => {
  const stub = makeDeepSeekStub({ extraction: {} });
  const ctx = await makeTestApp({}, { deepseek: stub.client });
  t.after(() => ctx.close());
  const token = await guestToken(ctx.base);

  const result = await upload(ctx.base, token, { file: { name: 'resume.pdf', type: 'application/pdf', data: PDF } });
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'INVALID_DOCUMENT');
});
