import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeepSeekOcrClient, DeepSeekOcrError } from '../src/ai/deepseek-ocr.js';
import { loadConfig } from '../src/config.js';

const file = { buffer: Buffer.from('%PDF-1.4\n'), filename: 'resume.pdf', mimetype: 'application/pdf', prompt: 'Extract resume JSON.' };
const pages = (...texts) => ({ page_count: texts.length, pages: texts.map((text, index) => ({ index, text, finish_reason: 'stop' })) });
const completion = (content = '{"personalInfo":{"fullName":"Aina"}}', finish_reason = 'stop') => ({ choices: [{ finish_reason, message: { content } }] });

function harness(results, overrides = {}) {
  const calls = [];
  const config = { ...loadConfig({ DEEPSEEK_API_KEY: 'test-key' }).deepseek, ...overrides };
  const client = createDeepSeekOcrClient(config, {
    fetchImpl: async (url, options) => {
      calls.push({ url, ...options });
      const result = results.shift();
      if (result instanceof Error) throw result;
      assert.ok(result, 'unexpected extra provider request');
      return Response.json(result.body ?? result, { status: result.status ?? 200 });
    }
  });
  return { client, calls };
}

test('DeepSeek environment defaults and overrides replace Qwen configuration', () => {
  const defaults = loadConfig({});
  assert.equal(defaults.qwen, undefined);
  assert.equal(defaults.deepseek.apiKey, '');
  assert.equal(defaults.deepseek.model, 'deepseek-flash');
  assert.equal(defaults.deepseek.ocrTimeoutMs, 180000);
  const configured = loadConfig({ DEEPSEEK_API_KEY: 'secret', DEEPSEEK_BASE_URL: 'https://example.test/v1', DEEPSEEK_MODEL: 'custom', DEEPSEEK_OCR_PURPOSE: 'rich_layout_recognition', DEEPSEEK_OCR_TIMEOUT_MS: '1234', DEEPSEEK_TIMEOUT_MS: '5678', DEEPSEEK_MAX_TEXT_CHARS: '9000' });
  assert.deepEqual(configured.deepseek, { apiKey: 'secret', baseUrl: 'https://example.test/v1', model: 'custom', purpose: 'rich_layout_recognition', ocrTimeoutMs: 1234, timeoutMs: 5678, maxTextChars: 9000 });
});

for (const [extension, mimetype] of [['pdf', 'application/pdf'], ['docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']]) {
  test(`${extension} uses stateless multipart OCR then structured JSON extraction`, async () => {
    const h = harness([pages('Aina Rahman', 'SQL project'), completion()], { baseUrl: 'https://example.test/v1/' });
    const input = { ...file, filename: `resume.${extension}`, mimetype };
    const result = await h.client.extract(input);
    assert.equal(result.personalInfo.fullName, 'Aina');
    assert.equal(h.calls.length, 2);
    const [ocr, chat] = h.calls;
    assert.equal(ocr.url, 'https://example.test/v1/tools/ocr');
    assert.equal(ocr.headers.authorization, 'Bearer test-key');
    assert.equal(ocr.headers['content-type'], undefined, 'fetch must set the multipart boundary');
    assert.deepEqual([...ocr.body.keys()], ['purpose', 'file']);
    assert.equal(ocr.body.get('purpose'), 'text_recognition');
    const document = ocr.body.get('file');
    assert.equal(document.name, input.filename);
    assert.equal(document.type, mimetype);
    assert.deepEqual(Buffer.from(await document.arrayBuffer()), file.buffer);
    assert.equal(chat.url, 'https://example.test/chat/completions');
    const body = JSON.parse(chat.body);
    assert.equal(body.messages[1].content, 'Aina Rahman\n\nSQL project');
    assert.match(body.messages[0].content, /untrusted/);
    assert.equal(body.model, 'deepseek-flash');
    assert.deepEqual(body.response_format, { type: 'json_object' });
  });
}

for (const [label, response, reason] of [
  ['HTTP 200 OCR timeout', { error: { code: 'gateway_timeout_error' } }, 'busy'],
  ['password protected file', { status: 400, body: { error: { message: 'The file is password-protected and cannot be processed.' } } }, 'document'],
  ['bad key', { status: 401, body: { error: { message: 'invalid key' } } }, 'unavailable'],
  ['rate limit', { status: 429, body: { error: {} } }, 'busy'],
  ['malformed response', { pages: [] }, 'unavailable'],
  ['partial OCR', { page_count: 1, pages: [{ index: 0, text: 'Aina', finish_reason: 'length' }] }, 'unavailable'],
  ['empty OCR', pages('  '), 'document']
]) {
  test(`${label} fails before structured extraction`, async () => {
    const h = harness([response]);
    await assert.rejects(h.client.extract(file), error => error instanceof DeepSeekOcrError && error.reason === reason);
    assert.equal(h.calls.length, 1);
  });
}

test('oversized OCR is rejected instead of silently truncated', async () => {
  const h = harness([pages('long text')], { maxTextChars: 3 });
  await assert.rejects(h.client.extract(file), /too long/);
  assert.equal(h.calls.length, 1);
});

test('network timeout maps to provider busy', async () => {
  const h = harness([new DOMException('timed out', 'TimeoutError')]);
  await assert.rejects(h.client.extract(file), error => error.reason === 'busy');
});

for (const [label, response] of [
  ['invalid JSON', completion('not json')],
  ['truncated JSON', completion('{"personalInfo":', 'length')],
  ['empty answer', completion('')],
  ['provider failure', { status: 503, body: { error: {} } }]
]) {
  test(`structured extraction rejects ${label}`, async () => {
    const h = harness([pages('Aina'), response]);
    await assert.rejects(h.client.extract(file), DeepSeekOcrError);
  });
}
