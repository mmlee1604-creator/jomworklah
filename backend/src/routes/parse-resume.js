import express, { Router } from 'express';
import { parseResume } from '../services/resume-service.js';
import { AppError } from '../middleware/errors.js';
import { validateQuery } from '../middleware/validate.js';
import { parseResumeQuerySchema } from '../validation/schemas.js';

const documentTypes = [
  {
    label: 'PDF',
    extensions: ['pdf'],
    mimetypes: ['application/pdf'],
    magic: [0x25, 0x50, 0x44, 0x46]
  },
  {
    label: 'DOCX',
    extensions: ['docx'],
    mimetypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template'
    ],
    magic: [0x50, 0x4b, 0x03, 0x04]
  }
];

// Multipart framing adds a few hundred bytes, and the extra headroom lets the
// per-file check report the resume-specific size error instead of a generic one.
const FRAMING_SLACK = 1024 * 1024;

const safeName = value => {
  const base = String(value ?? '').split(/[\\/]/).pop().replace(/[^\x20-\x7e]/g, '').trim();
  return base.slice(0, 140) || 'resume';
};

async function readResume(req, maxFileBytes) {
  if (!Buffer.isBuffer(req.body)) {
    throw new AppError(415, 'UNSUPPORTED_MEDIA_TYPE', 'Send the resume as multipart/form-data in a "file" field.');
  }

  let form;
  try {
    form = await new Response(req.body, { headers: { 'content-type': req.headers['content-type'] ?? '' } }).formData();
  } catch {
    throw new AppError(400, 'MALFORMED_UPLOAD', 'The upload could not be read as multipart/form-data.');
  }

  const entry = form.get('file') ?? form.get('resume');
  if (!(entry instanceof File)) {
    throw new AppError(400, 'FILE_REQUIRED', 'Attach the resume in the "file" field.');
  }

  const filename = safeName(entry.name);
  const extension = filename.includes('.') ? filename.slice(filename.lastIndexOf('.') + 1).toLowerCase() : '';
  const type = documentTypes.find(candidate => candidate.extensions.includes(extension));
  if (!type) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', 'Resume must be a PDF or DOCX file.');
  }

  const declared = entry.type && entry.type !== 'application/octet-stream' ? entry.type : null;
  if (declared && !type.mimetypes.includes(declared)) {
    throw new AppError(400, 'UNSUPPORTED_FILE_TYPE', `"${declared}" is not a supported resume type. Use PDF or DOCX.`);
  }

  if (!entry.size) throw new AppError(400, 'EMPTY_FILE', 'The uploaded resume is empty.');
  if (entry.size > maxFileBytes) {
    throw new AppError(413, 'FILE_TOO_LARGE', `Resume exceeds the ${Math.round(maxFileBytes / (1024 * 1024))} MB limit.`);
  }

  const buffer = Buffer.from(await entry.arrayBuffer());
  if (buffer.length !== entry.size || !type.magic.every((byte, index) => buffer[index] === byte)) {
    throw new AppError(400, 'INVALID_DOCUMENT', `The file content does not match a ${type.label} resume.`);
  }

  return { buffer, filename, mimetype: declared ?? type.mimetypes[0], size: entry.size };
}

export function parseResumeRouter(config) {
  const router = Router();
  const maxFileBytes = config.resume.maxFileBytes;

  router.post(
    '/parse-resume',
    express.raw({ type: 'multipart/form-data', limit: maxFileBytes + FRAMING_SLACK }),
    validateQuery(parseResumeQuerySchema),
    async (req, res) => {
      const file = await readResume(req, maxFileBytes);
      const data = await parseResume({
        db: req.app.locals.db,
        deepseek: req.app.locals.deepseek ?? null,
        userId: req.user.id,
        file,
        mode: req.validatedQuery.mode,
        persist: req.validatedQuery.persist
      });
      res.json({ data });
    }
  );

  return router;
}
