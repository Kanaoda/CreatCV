export const VIEW_MODES = {
  DETAILED: 'detailed',
  CONCISE: 'concise',
  FULL_PROJECTS: 'full-projects',
  PROJECT_LIST: 'project-list',
};

export function isConciseView(viewMode) {
  return viewMode === VIEW_MODES.CONCISE;
}

/** Nested projects under each job — only in Detailed CV. */
export function showsInlineProjects(viewMode) {
  return viewMode === VIEW_MODES.DETAILED;
}

/** Full CV body with all projects moved to a separate page at the end. */
export function showsProjectAppendix(viewMode) {
  return viewMode === VIEW_MODES.FULL_PROJECTS || viewMode === 'concise-projects';
}

export function isStandaloneProjectList(viewMode) {
  return viewMode === VIEW_MODES.PROJECT_LIST;
}

export function showsFullCvBody(viewMode) {
  return !isStandaloneProjectList(viewMode);
}
