import { DeepSeekOcrError } from '../ai/deepseek-ocr.js';
import { extractedResumeSchema, isEmptyResume, normalizeExtraction, resumeExtractionPrompt } from '../ai/resume-extract.js';
import { sampleResume } from '../ai/resume-sample.js';
import { mapResumeToProfile, mapResumeToSkills } from '../domain/resume-mapping.js';
import { AppError } from '../middleware/errors.js';
import { loadSkillList } from './catalogue.js';
import { getProfile, getSkills, setSkills, updateProfile } from './profile-service.js';

function validateExtraction(raw) {
  const result = extractedResumeSchema.safeParse(normalizeExtraction(raw));
  if (!result.success) {
    const details = result.error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message }));
    throw new AppError(502, 'INVALID_EXTRACTION', 'The extraction result did not match the resume structure.', details);
  }
  return result.data;
}

function providerError(error) {
  if (error instanceof AppError) throw error;
  if (error instanceof DeepSeekOcrError) {
    if (error.reason === 'document') return new AppError(400, 'INVALID_DOCUMENT', error.message);
    if (error.reason === 'busy') return new AppError(503, 'AI_PROVIDER_BUSY', error.message);
    return new AppError(502, 'RESUME_EXTRACTION_FAILED', error.message);
  }
  return new AppError(502, 'RESUME_EXTRACTION_FAILED', `Resume extraction failed: ${String(error?.message ?? error).slice(0, 200)}`);
}

// OCR is stateless: no provider file resource is retained by this flow.
async function extractWithDeepSeek(deepseek, file) {
  try {
    return validateExtraction(await deepseek.extract({ ...file, prompt: resumeExtractionPrompt }));
  } catch (error) {
    throw providerError(error);
  }
}

async function applyExtraction(db, userId, resume, persist) {
  const profilePatch = mapResumeToProfile(resume);
  const mapping = mapResumeToSkills(resume, await loadSkillList(db));

  const [profile, skills] = await Promise.all([
    persist && Object.keys(profilePatch).length
      ? updateProfile(db, userId, profilePatch)
      : getProfile(db, userId),
    persist && Object.keys(mapping.scores).length
      ? setSkills(db, userId, mapping.scores)
      : getSkills(db, userId)
  ]);

  return {
    persisted: Boolean(persist),
    updatedProfileFields: Object.keys(profilePatch),
    matchedSkills: mapping.matched,
    unmatchedSkills: mapping.unmatched,
    profile,
    skills
  };
}

export async function parseResume({ db, deepseek, userId, file, mode = 'auto', persist = true }) {
  const simulated = mode === 'simulate' || (mode === 'auto' && !deepseek);
  if (!simulated && !deepseek) {
    throw new AppError(503, 'AI_NOT_CONFIGURED', 'Live resume parsing needs DEEPSEEK_API_KEY. Set it or use ?mode=simulate.');
  }

  const resume = simulated ? validateExtraction(sampleResume()) : await extractWithDeepSeek(deepseek, file);
  if (isEmptyResume(resume)) {
    throw new AppError(400, 'INVALID_DOCUMENT', 'No resume details could be read from this document.');
  }

  return {
    file: { name: file.filename, size: file.size, mimetype: file.mimetype },
    provider: simulated ? 'simulated' : 'deepseek',
    model: simulated ? null : deepseek.model,
    is_simulated: simulated,
    resume,
    saved: await applyExtraction(db, userId, resume, persist)
  };
}
