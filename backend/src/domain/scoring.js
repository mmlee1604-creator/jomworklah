const compareText = (a, b) => String(a).localeCompare(String(b), 'en');

export function gapsFor(requirements, scoreFor, skillNameFor = id => id) {
  return requirements.map(requirement => {
    const current = Number(scoreFor(requirement.skillId)) || 0;
    const gap = Math.max(0, requirement.level - current);
    return {
      skillId: requirement.skillId,
      level: requirement.level,
      weight: requirement.weight,
      current,
      gap,
      priority: gap * requirement.weight
    };
  }).sort((a, b) => b.priority - a.priority
    || b.weight - a.weight
    || compareText(skillNameFor(a.skillId), skillNameFor(b.skillId)));
}

export function compatibility(requirements, tags, scoreFor, profileInterests = []) {
  const skillsMatch = Math.round(100 * requirements.reduce(
    (sum, requirement) => sum + Math.min((Number(scoreFor(requirement.skillId)) || 0) / requirement.level, 1) * requirement.weight,
    0
  ));
  const interestMatch = tags.some(tag => profileInterests.includes(tag)) ? 100 : 50;
  return {
    skillsMatch,
    interestMatch,
    fit: Math.round(0.85 * skillsMatch + 0.15 * interestMatch)
  };
}

export function rankedCareers(jobs, scoreFor, profileInterests = []) {
  return jobs.map(job => ({
    ...job,
    ...compatibility(job.requirements, job.tags ?? [], scoreFor, profileInterests)
  })).sort((a, b) => b.fit - a.fit || compareText(a.title, b.title));
}

// A programme can run at institutions in several states; a course "is in" a state if any does.
export function courseInLocation(course, location) {
  return (course.locations ?? [course.location]).includes(location);
}

export function rankedCourses(courses, gaps, profile = {}) {
  const positive = gaps.filter(item => item.gap > 0);
  return courses.map(course => ({
    ...course,
    relevance: positive
      .filter(item => course.skillIds.includes(item.skillId))
      .reduce((sum, item) => sum + item.priority, 0)
  })).sort((a, b) => b.relevance - a.relevance
    || Number(b.mode === profile.learningMode) - Number(a.mode === profile.learningMode)
    || Number(courseInLocation(b, profile.location)) - Number(courseInLocation(a, profile.location))
    || compareText(a.title, b.title));
}

const budgetLimits = {
  'RM0–RM500': 500,
  'RM501–RM1,500': 1500,
  Flexible: Infinity
};

export function matchesBudget(fee, mode, budget) {
  if (mode === 'All') return true;
  if (mode === 'verify') return fee === null;
  const limit = budgetLimits[budget] ?? Infinity;
  return fee !== null && fee <= limit;
}

export { compareText };
