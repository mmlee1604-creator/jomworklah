import { z } from 'zod';

// Renames frontend field names to canonical ones before validation; canonical keys win.
const withAliases = (aliases, schema) => z.preprocess(input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return input;
  const output = { ...input };
  for (const [alias, canonical] of Object.entries(aliases)) {
    if (!(alias in output)) continue;
    if (!(canonical in output)) output[canonical] = output[alias];
    delete output[alias];
  }
  return output;
}, schema);

const profileAliases = { field: 'fieldOfStudy', hours: 'weeklyHours', mode: 'learningMode' };

const mbtiField = z.enum([
  'INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'
]);
const hollandField = z.array(z.enum(['R', 'I', 'A', 'S', 'E', 'C']))
  .max(3)
  .refine(codes => new Set(codes).size === codes.length, 'Holland codes must not repeat.');

const profileFields = {
  name: z.string().trim().min(1).max(120).optional(),
  headline: z.string().max(200).optional(),
  mbti: mbtiField.optional(),
  holland: hollandField.optional(),
  qualification: z.string().max(120).optional(),
  fieldOfStudy: z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  experience: z.string().max(2000).optional(),
  projects: z.string().max(2000).optional(),
  budget: z.enum(['RM0–RM500', 'RM501–RM1,500', 'Flexible']).optional(),
  weeklyHours: z.number().int().min(1).max(60).optional(),
  learningMode: z.enum(['Online', 'In person', 'Hybrid']).optional()
};

const scoresField = z.record(z.string(), z.number().int().min(0).max(5));
const interestsField = z.array(z.string().min(1).max(60)).max(20);

export const profilePatchSchema = withAliases(profileAliases, z.object(profileFields));

export const onboardingSchema = withAliases(profileAliases, z.object({
  ...profileFields,
  name: z.string().trim().min(1, 'Enter a name for the demo profile.').max(120),
  interests: interestsField.optional(),
  scores: scoresField.optional()
}));

export const skillsBulkSchema = z.object({
  scores: scoresField
});

export const skillPatchSchema = z.object({
  evidenceLevel: z.number().int().min(0).max(5)
});

export const interestsSchema = z.object({
  interests: interestsField
});

export const targetSchema = withAliases({ target: 'jobId' }, z.object({
  jobId: z.string().min(1).max(120)
}));

export const courseSaveSchema = withAliases({ id: 'courseId' }, z.object({
  courseId: z.string().min(1).max(120)
}));

export const roadmapGenerateSchema = withAliases({ hours: 'weeklyHours', 'start-date': 'startDate' }, z.object({
  weeklyHours: z.coerce.number().int().min(1).max(60),
  startDate: z.preprocess(
    value => (value === '' ? null : value),
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD').nullable().optional().default(null)
  )
}));

export const taskPatchSchema = z.object({
  completed: z.boolean()
});

export const assessmentSchema = z.object({
  narrative: z.string().trim().min(1, 'Narrative is required').max(5000)
});

const boolQuery = z
  .enum(['1', 'true', 'yes', 'on', '0', 'false', 'no', 'off'])
  .default('true')
  .transform(value => ['1', 'true', 'yes', 'on'].includes(value));

export const parseResumeQuerySchema = z.object({
  mode: z.enum(['auto', 'live', 'simulate']).optional().default('auto'),
  persist: boolQuery
});

export const explainMatchSchema = z.object({
  jobId: z.string().min(1).max(120)
});

export const careersQuerySchema = z.object({
  query: z.string().max(100).optional().default(''),
  category: z.string().max(60).optional().default('All'),
  sort: z.enum(['match', 'title', 'name']).optional().default('match')
});

export const trainingQuerySchema = z.object({
  view: z.enum(['suggested', 'all']).optional().default('suggested'),
  skill: z.string().max(60).optional().default('All'),
  source: z.string().max(60).optional().default('All'),
  mode: z.enum(['All', 'Online', 'In person', 'Hybrid']).optional().default('All'),
  location: z.string().max(60).optional().default('All'),
  budget: z.enum(['All', 'within', 'verify']).optional().default('All'),
  sort: z.enum(['relevance', 'name']).optional().default('relevance')
});

export const personaSchema = z.object({
  personaKey: z.string().min(1).max(60)
});

export const paramsIdSchema = z.object({
  id: z.string().min(1).max(120)
});

export const paramsSkillSchema = z.object({
  skillId: z.string().min(1).max(120)
});

export const paramsCourseSchema = z.object({
  courseId: z.string().min(1).max(120)
});

export const paramsTaskSchema = z.object({
  taskId: z.string().min(1).max(120)
});
