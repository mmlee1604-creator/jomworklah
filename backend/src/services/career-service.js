import { AppError } from '../middleware/errors.js';
import { careerView } from '../api/serializers.js';
import { compareText, compatibility, gapsFor, rankedCareers } from '../domain/scoring.js';
import {
  loadInterestIds,
  loadJob,
  loadJobs,
  loadProfileRow,
  loadScoreMap,
  loadSkillMap,
  toProfile
} from './catalogue.js';

async function context(db, userId) {
  const [scores, interests, skillMap, profileRow] = await Promise.all([
    loadScoreMap(db, userId),
    loadInterestIds(db, userId),
    loadSkillMap(db),
    loadProfileRow(db, userId)
  ]);
  return {
    scores,
    interests,
    profile: toProfile(profileRow),
    scoreFor: skillId => scores[skillId] ?? 0,
    skillNameFor: skillId => skillMap.get(skillId)?.name ?? skillId
  };
}

export async function listCareers(db, userId, { query = '', category = 'All', sort = 'match' } = {}) {
  const { interests, scoreFor, skillNameFor } = await context(db, userId);

  let ranked = rankedCareers(await loadJobs(db), scoreFor, interests);
  const search = String(query).trim().toLowerCase();
  ranked = ranked.filter(job => (category === 'All' || job.category === category)
    && job.title.toLowerCase().includes(search));

  if (sort === 'title' || sort === 'name') {
    ranked.sort((a, b) => compareText(a.title, b.title));
  }

  return ranked.map(job => {
    const gaps = gapsFor(job.requirements, scoreFor, skillNameFor);
    return {
      ...careerView(job),
      matchingSkills: gaps.filter(gap => gap.gap === 0).map(gap => skillNameFor(gap.skillId)),
      priorityGaps: gaps.filter(gap => gap.gap > 0).slice(0, 2).map(gap => ({
        skillId: gap.skillId,
        name: skillNameFor(gap.skillId),
        gap: gap.gap
      })),
      interestAligned: job.tags.some(tag => interests.includes(tag))
    };
  });
}

export async function getCareer(db, userId, jobId, ai) {
  const { interests, profile, scoreFor, skillNameFor } = await context(db, userId);
  const job = await loadJob(db, jobId);
  if (!job) throw new AppError(404, 'CAREER_NOT_FOUND', `Unknown career '${jobId}'.`);

  const compatibilityResult = compatibility(job.requirements, job.tags, scoreFor, interests);
  const gaps = gapsFor(job.requirements, scoreFor, skillNameFor).map(gap => ({
    ...gap,
    skillName: skillNameFor(gap.skillId)
  }));

  const explanation = await ai.explainMatch({
    profile: { ...profile, interests },
    job,
    gaps,
    compatibility: compatibilityResult
  });

  const gapBySkill = new Map(gaps.map(gap => [gap.skillId, gap]));

  return {
    ...careerView(job),
    requirements: job.requirements.map(requirement => gapBySkill.get(requirement.skillId)),
    gaps,
    fit: compatibilityResult.fit,
    compatibility: compatibilityResult,
    explanation
  };
}
