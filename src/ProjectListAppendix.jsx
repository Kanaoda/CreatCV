import { visibleItems } from './visibility';

const cleanProjectTitle = (title, year) => {
  if (!title) return '';
  const y = String(year || '').trim();
  if (!y) return title;
  const re = new RegExp(`\\s*\\(?${y}\\)?\\s*$`);
  return title.replace(re, '').trim();
};

/** Standalone project list — used alone or appended after full CV on a new page. */
export function ProjectListAppendix({ employment, colorOverrides, className = '', pageBreakBefore = true }) {
  const groups = visibleItems(employment || [])
    .map((emp) => ({ emp, projects: visibleItems(emp.projects || []) }))
    .filter(({ projects }) => projects.length > 0);

  if (groups.length === 0) return null;

  return (
    <div
      className={`cv-project-appendix${pageBreakBefore ? ' cv-project-appendix--new-page' : ''}${className ? ` ${className}` : ''}`}
    >
      {pageBreakBefore && (
        <div className="cv-appendix-page-marker" aria-hidden="true">
          <span>Project list — new page</span>
        </div>
      )}
      <div className="cv-section cv-project-appendix-body">
        <div className="cv-section-title">Standalone Project Deliveries</div>
        {groups.map(({ emp, projects }) => (
          <div key={emp.id} className="cv-project-appendix-group">
            <div className="cv-project-appendix-lead">
              <div
                className="cv-project-appendix-company"
                style={{
                  color: emp.jobTitleColor || colorOverrides?.jobTitle || undefined,
                }}
              >
                Projects at {emp.company}
              </div>
              {projects.length > 0 && (
                <div className="cv-project-appendix-item">
                  <div className="cv-project-appendix-item-head">
                    <span>• {cleanProjectTitle(projects[0].title, projects[0].year)}</span>
                    <span className="cv-date">{projects[0].year}</span>
                  </div>
                  {projects[0].description && (
                    <div className="cv-project-desc">{projects[0].description}</div>
                  )}
                </div>
              )}
            </div>
            {projects.slice(1).map((proj, idx) => (
              <div key={proj.id || idx + 1} className="cv-project-appendix-item">
                <div className="cv-project-appendix-item-head">
                  <span>• {cleanProjectTitle(proj.title, proj.year)}</span>
                  <span className="cv-date">{proj.year}</span>
                </div>
                {proj.description && <div className="cv-project-desc">{proj.description}</div>}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
