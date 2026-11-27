import { AppError } from '../middleware/errors.js';
import {
  compareText,
  courseInLocation,
  gapsFor,
  matchesBudget,
  rankedCareers,
  rankedCourses
} from '../domain/scoring.js';
import {
  loadCourse,
  loadCourses,
  loadInterestIds,
  loadJob,
  loadJobs,
  loadProfileRow,
  loadScoreMap,
  loadSkillMap,
  toProfile
} from './catalogue.js';
import { getJourney } from './journey-service.js';

function context(db, userId) {
  const scores = loadScoreMap(db, userId);
  const interests = loadInterestIds(db, userId);
  const skillMap = loadSkillMap(db);
  return {
    interests,
    profile: toProfile(loadProfileRow(db, userId)) ?? { learningMode: 'Online', location: '' },
    scoreFor: skillId => scores[skillId] ?? 0,
    skillNameFor: skillId => skillMap.get(skillId)?.name ?? skillId
  };
}

function resolveRole(db, userId, ctx) {
  const journey = getJourney(db, userId);
  if (journey.targetJobId) {
    const job = loadJob(db, journey.targetJobId);
    if (job) return job;
  }
  return rankedCareers(loadJobs(db), ctx.scoreFor, ctx.interests)[0] ?? null;
}

export function listTraining(db, userId, params = {}) {
  const {
    view = 'suggested', skill = 'All', source = 'All', mode = 'All',
    location = 'All', budget = 'All', sort = 'relevance'
  } = params;

  const ctx = context(db, userId);
  const job = resolveRole(db, userId, ctx);
  if (!job) return { job: null, courses: [] };

  const gaps = gapsFor(job.requirements, ctx.scoreFor, ctx.skillNameFor);
  const ranked = rankedCourses(loadCourses(db), gaps, ctx.profile);

  const courses = ranked.filter(course => (view === 'all' || course.relevance > 0)
    && (skill === 'All' || course.skillIds.includes(skill))
    && (source === 'All' || course.provider.id === source)
    && (mode === 'All' || course.mode === mode)
    && (location === 'All' || courseInLocation(course, location))
    && matchesBudget(course.fee, budget, ctx.profile.budget));

  if (sort === 'name') courses.sort((a, b) => compareText(a.title, b.title));

  return {
    job: { id: job.id, title: job.title },
    courses
  };
}

export function getTraining(db, courseId) {
  const course = loadCourse(db, courseId);
  if (!course) throw new AppError(404, 'COURSE_NOT_FOUND', `Unknown course '${courseId}'.`);
  return course;
}
