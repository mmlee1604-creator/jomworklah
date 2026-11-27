import { gapsFor, rankedCourses } from './scoring.js';

export const FOUNDATION_BASE_WEEKS = [2, 3, 2, 1];
const PRACTICAL_SKILLS = new Set(['tools', 'auto', 'electrical', 'safety', 'sensors']);

export function phaseWeeks(weeklyHours) {
  return FOUNDATION_BASE_WEEKS.map(base => Math.max(1, Math.ceil(base * 5 / weeklyHours)));
}

function foundationTask(skillId, skillNameFor) {
  const label = skillNameFor(skillId);
  const title = PRACTICAL_SKILLS.has(skillId)
    ? `Review ${label} with a qualified instructor or supervisor.`
    : `Study the fundamentals of ${label} and document a practice example.`;
  return { id: `skill-${skillId}`, title, courseId: null };
}

// Mirrors the prototype's generateSnapshot(): top 3 gap skills and top 2 unsaved relevant courses.
export function deriveRoadmapInputs({ job, scoreFor, skillNameFor, profile, courses, savedCourseIds = [] }) {
  const positive = gapsFor(job.requirements, scoreFor, skillNameFor).filter(item => item.gap > 0);
  return {
    skillIds: positive.slice(0, 3).map(item => item.skillId),
    courseIds: rankedCourses(courses, positive, profile)
      .filter(course => course.relevance > 0 && !savedCourseIds.includes(course.id))
      .slice(0, 2)
      .map(course => course.id)
  };
}

export function buildRoadmap({ job, scoreFor, skillNameFor, profile, courses, savedCourseIds = [], weeklyHours, snapshot = null }) {
  const { skillIds: gapSkillIds, courseIds: suggestedCourseIds } = snapshot
    ?? deriveRoadmapInputs({ job, scoreFor, skillNameFor, profile, courses, savedCourseIds });

  const courseById = new Map(courses.map(course => [course.id, course]));
  const trainingCourseIds = [...new Set([...suggestedCourseIds, ...savedCourseIds])];

  const foundation = gapSkillIds.map(skillId => foundationTask(skillId, skillNameFor));
  if (foundation.length < 2) {
    foundation.push({ id: 'foundation-inventory', title: 'Map two examples from your experience to the sample role requirements.', courseId: null });
  }
  if (foundation.length < 2) {
    foundation.push({ id: 'foundation-review', title: 'Choose one existing skill to demonstrate more clearly in your portfolio.', courseId: null });
  }

  const training = trainingCourseIds.map(courseId => {
    const course = courseById.get(courseId);
    return {
      id: `course-${courseId}`,
      title: course ? `Explore the ${course.title}${course.isIllustrative ? ' example' : ''} pathway.` : `Explore the ${courseId} example pathway.`,
      courseId: course ? course.id : null
    };
  });
  if (!training.length) {
    training.push({ id: 'training-review', title: 'Compare one official training pathway with the sample role requirements.', courseId: null });
  }

  const projectBriefs = job.projects ?? job.project ?? [];
  const projects = projectBriefs.map((brief, index) => ({ id: `project-${index + 1}`, title: brief, courseId: null }));

  const prepare = [
    { id: 'prepare-resume', title: `Update your demo resume with evidence relevant to ${job.title}.`, courseId: null },
    { id: 'prepare-interview', title: 'Prepare two interview examples that explain your actions and results.', courseId: null },
    { id: 'prepare-application', title: `Draft a tailored application for a sample ${job.title} role.`, courseId: null }
  ];

  const weeks = phaseWeeks(weeklyHours);

  return [
    { id: 'foundations', title: 'Build Foundations', goal: 'Develop the evidence you need for this role.', weeks: weeks[0], tasks: foundation },
    {
      id: 'training',
      title: 'Upskill with Training',
      goal: 'Check provider options and plan a realistic study schedule.',
      weeks: weeks[1],
      tasks: [...training, { id: 'training-schedule', title: 'Set recurring study time and record weekly practice goals.', courseId: null }]
    },
    { id: 'projects', title: 'Build Real Projects', goal: 'Create a portfolio example you can describe in an interview.', weeks: weeks[2], tasks: projects },
    { id: 'prepare', title: 'Prepare for Jobs', goal: 'Translate your experience into an application for the target role.', weeks: weeks[3], tasks: prepare }
  ];
}

export function flattenTasks(phases) {
  return phases.flatMap(phase => phase.tasks);
}

export function computeProgress(phases, completedIds = new Set()) {
  const tasks = flattenTasks(phases);
  const done = tasks.filter(task => completedIds.has(task.id)).length;
  const nextTask = tasks.find(task => !completedIds.has(task.id)) ?? null;
  return {
    done,
    total: tasks.length,
    percent: tasks.length ? Math.round(100 * done / tasks.length) : 0,
    nextTaskId: nextTask ? nextTask.id : null
  };
}

export function withCompletion(phases, completedIds = new Set()) {
  return phases.map(phase => ({
    ...phase,
    tasks: phase.tasks.map(task => ({ ...task, completed: completedIds.has(task.id) }))
  }));
}
