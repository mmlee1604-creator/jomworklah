// Shapes responses to match the prototype frontend (js/app.js) while keeping canonical fields.

export function profileView(profile, { scores = {}, interests = [] } = {}) {
  if (!profile) return null;
  return {
    ...profile,
    field: profile.fieldOfStudy,
    hours: profile.weeklyHours,
    mode: profile.learningMode,
    interests,
    scores
  };
}

export function preferencesView(profile, interests = []) {
  if (!profile) return {};
  return {
    location: profile.location,
    budget: profile.budget,
    mode: profile.learningMode,
    hours: profile.weeklyHours,
    interests
  };
}

export function roadmapSnapshotView(roadmap) {
  if (!roadmap) return null;
  return { ...roadmap, hours: roadmap.weeklyHours };
}

export function journeyView({ journey, profile, interests = [], roadmap = null, added = [], completed = [] }) {
  return {
    started: journey.started,
    target: journey.targetJobId,
    targetJobId: journey.targetJobId,
    preferences: preferencesView(profile, interests),
    roadmap: roadmapSnapshotView(roadmap),
    added,
    completed
  };
}

// Long text (description, career prospects) is only sent on the single-course endpoint.
export function courseView(course, { detail = false } = {}) {
  if (!course) return null;
  const { description, descriptionMs, careerProspects, careerProspectsMs, ...light } = course;
  // Lists keep only what a card needs from each offering; address and website are detail-only.
  const lightOfferings = (course.offerings ?? []).map(offering => ({
    id: offering.id,
    institution: offering.institution && {
      id: offering.institution.id,
      name: offering.institution.name,
      state: offering.institution.state,
      sector: offering.institution.sector
    },
    durationText: offering.durationText,
    durationWeeks: offering.durationWeeks,
    courseUrl: offering.courseUrl,
    feeFree: offering.feeFree
  }));
  return {
    ...(detail ? course : { ...light, offerings: lightOfferings }),
    provider: course.provider.id,
    providerName: course.provider.name,
    providerUrl: course.provider.url
  };
}

export function providersMapView(providers) {
  return Object.fromEntries(providers.map(provider => [provider.id, { name: provider.name, url: provider.url }]));
}

export function interestsMapView(interests) {
  return Object.fromEntries(interests.map(interest => [interest.id, interest.label]));
}

export function careerView(job) {
  return { ...job, project: job.projects };
}

export function phasesView(phases, courseById) {
  return phases.map(phase => ({
    ...phase,
    tasks: phase.tasks.map(task => ({
      ...task,
      course: task.courseId ? courseView(courseById.get(task.courseId)) : null
    }))
  }));
}

export function progressView(progress, phases) {
  const next = progress.nextTaskId
    ? phases.flatMap(phase => phase.tasks).find(task => task.id === progress.nextTaskId) ?? null
    : null;
  return { ...progress, next };
}
