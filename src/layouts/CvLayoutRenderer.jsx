import React from 'react';
import { EditableText } from '../components/EditableText.jsx';
import { EmploymentRolesPreview } from '../EmploymentRolesPreview';
import { ProjectListAppendix } from '../ProjectListAppendix';
import {
  cleanProjectTitle,
  getProfilePoints,
  parseSkillItems,
  getLanguagePercentage,
} from '../cvPreview/helpers.js';
import { formatSkillDots, getSkillEntries } from '../cvPreview/skillRatings.js';
import {
  bulletText,
  isSectionVisible,
  visibleBullets,
  visibleItems,
} from '../visibility';
import {
  isConciseView,
  isStandaloneProjectList,
  showsInlineProjects,
  showsProjectAppendix,
} from '../viewModes';
import { usesMultiRoleDisplay } from '../employmentRoles';
import { SectionHead } from './SectionHead.jsx';
import { getEffectiveSkillDisplay } from './skillDisplay.js';
import { AVAILABILITY_FIELD_DEFS, isAvailabilityFieldShown } from '../availabilityFields.js';

export function CvLayoutRenderer({ layout, model }) {
  const {
    data,
    viewMode,
    colorOverrides,
    visibleEmployment,
    visibleLanguages,
    visibleSkills,
    visibleCerts,
    visibleEducation,
    visibleReferences,
    showAvailabilitySection,
    getPhotoClassName,
    renderCertEntry,
    normalizeExternalUrl,
    showSkillRatings = false,
    handlePersonalChange,
    updateEmployment,
    updateBullet,
    updateProject,
    updateAvailability,
    updateReference,
    updateLanguageName,
    updateSkillCategory,
    updateEducation,
    handleSabbaticalBulletChange,
    updateCert,
    updateEmpRole,
    updateRoleBullet,
  } = model;

  const skillDisplay = getEffectiveSkillDisplay(layout, showSkillRatings, visibleSkills);

  const titleMain = layout.sectionTitleMain || 'plain';
  const titleSide = layout.sectionTitleSidebar || 'caps';
  const empClass = `emp-block emp-block--${layout.employment || 'standard'}`;

  const showHeaderPhoto = () => layout.photo === 'header' && data.personal.photo;
  const showSidebarPhoto = () => layout.photo === 'sidebar' && data.personal.photo;
  const showHeroPhoto = () => layout.photo === 'hero';

  const renderPhotoPlaceholder = (zone) => {
    if (data.personal.photo || layout.photo === 'none') return null;
    if (zone === 'header' && layout.photo !== 'header') return null;
    if (zone === 'sidebar' && layout.photo !== 'sidebar') return null;
    if (zone === 'hero' && layout.photo !== 'hero') return null;
    const shape = layout.header === 'centered' || layout.photo === 'hero' ? 'circle' : 'square';
    return (
      <div className={`cv-photo-placeholder cv-photo-placeholder--${shape}`} role="img" aria-label="Photo placeholder">
        <span>Photo</span>
      </div>
    );
  };

  const renderContactInline = () => (
    <div className="cv-header-details">
      <span>
        ✉{' '}
        <EditableText
          value={data.personal.email}
          onChange={(val) => handlePersonalChange('email', val)}
          placeholder="Email Address"
        />
      </span>
      <span>
        ☎{' '}
        <EditableText
          value={data.personal.phone}
          onChange={(val) => handlePersonalChange('phone', val)}
          placeholder="Phone Number"
        />
      </span>
      <span>
        📍{' '}
        <EditableText
          value={data.personal.address}
          onChange={(val) => handlePersonalChange('address', val)}
          placeholder="Location/Address"
        />
      </span>
      {data.personal.links?.map((link, idx) => (
        <span key={idx}>
          🔗{' '}
          <EditableText
            value={link.label}
            onChange={(val) => {
              const updatedLinks = [...data.personal.links];
              updatedLinks[idx] = { ...updatedLinks[idx], label: val };
              handlePersonalChange('links', updatedLinks);
            }}
            placeholder="Link Label"
            style={{ fontWeight: 600 }}
          />
        </span>
      ))}
    </div>
  );

  const renderContactSidebar = () => (
    <div className="cv-contact-sidebar">
      <div>
        <span aria-hidden="true">☎ </span>
        <EditableText
          value={data.personal.phone}
          onChange={(val) => handlePersonalChange('phone', val)}
          placeholder="Phone Number"
        />
      </div>
      <div>
        <span aria-hidden="true">✉ </span>
        <EditableText
          value={data.personal.email}
          onChange={(val) => handlePersonalChange('email', val)}
          placeholder="Email Address"
        />
      </div>
      <div>
        <span aria-hidden="true">📍 </span>
        <EditableText
          value={data.personal.address}
          onChange={(val) => handlePersonalChange('address', val)}
          placeholder="Location/Address"
        />
      </div>
      {data.personal.links?.map((link, idx) => (
        <div key={idx}>
          <EditableText
            value={link.label}
            onChange={(val) => {
              const updatedLinks = [...data.personal.links];
              updatedLinks[idx] = { ...updatedLinks[idx], label: val };
              handlePersonalChange('links', updatedLinks);
            }}
            placeholder="Link Label"
            style={{ fontWeight: 600 }}
          />
        </div>
      ))}
    </div>
  );

  const renderHeader = () => {
    const h = layout.header;
    if (h === 'centered') {
      return (
        <div className="cv-header cv-header--layout-centered">
          {showHeroPhoto() && data.personal.photo ? (
            <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('header')} />
          ) : renderPhotoPlaceholder('hero')}
          <h2>
            <EditableText
              value={data.personal.name}
              onChange={(val) => handlePersonalChange('name', val)}
              placeholder="Your Name"
            />
          </h2>
          <div className="cv-header-title-sub">
            <EditableText
              value={data.personal.title}
              onChange={(val) => handlePersonalChange('title', val)}
              placeholder="Professional Title"
            />
          </div>
          {renderContactInline()}
        </div>
      );
    }
    if (h === 'band' || h === 'dark-band') {
      return (
        <div className={`cv-header cv-header--layout-${h}`}>
          <div className="cv-header-band-inner">
            <h2>
              <EditableText
                value={data.personal.name}
                onChange={(val) => handlePersonalChange('name', val)}
                placeholder="Your Name"
              />
            </h2>
            <div className="cv-header-title-sub">
              <EditableText
                value={data.personal.title}
                onChange={(val) => handlePersonalChange('title', val)}
                placeholder="Professional Title"
              />
            </div>
            {renderContactInline()}
            {showHeaderPhoto() ? (
              <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('header')} />
            ) : renderPhotoPlaceholder('header')}
          </div>
        </div>
      );
    }
    if (h === 'hero-card') {
      return (
        <div className="cv-header cv-header--layout-hero-card">
          <div className="cv-hero-card-row">
            {(showHeaderPhoto() || layout.photo === 'header') && (
              <div className="cv-hero-card-photo">
                {data.personal.photo ? (
                  <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('header')} />
                ) : renderPhotoPlaceholder('header')}
              </div>
            )}
            <div className="cv-hero-card-text">
              <h2>
                <EditableText
                  value={data.personal.name}
                  onChange={(val) => handlePersonalChange('name', val)}
                  placeholder="Your Name"
                />
              </h2>
              <div className="cv-header-title-sub">
                <EditableText
                  value={data.personal.title}
                  onChange={(val) => handlePersonalChange('title', val)}
                  placeholder="Professional Title"
                />
              </div>
              {layout.summaryInHeader && data.personal.summary && (
                <p className="cv-hero-summary">
                  <EditableText
                    value={data.personal.summary}
                    onChange={(val) => handlePersonalChange('summary', val)}
                    placeholder="Profile Summary"
                    tagName="span"
                  />
                </p>
              )}
              {!layout.summaryInHeader && renderContactInline()}
            </div>
          </div>
          {layout.summaryInHeader && renderContactInline()}
        </div>
      );
    }
    if (h === 'split') {
      return (
        <div className="cv-header cv-header--layout-split">
          <div style={{ flexGrow: 1 }}>
            <h2>
              <EditableText
                value={data.personal.name}
                onChange={(val) => handlePersonalChange('name', val)}
                placeholder="Your Name"
              />
            </h2>
            <div className="cv-header-title-sub">
              <EditableText
                value={data.personal.title}
                onChange={(val) => handlePersonalChange('title', val)}
                placeholder="Professional Title"
              />
            </div>
          </div>
          {showHeaderPhoto() ? (
            <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('header')} />
          ) : renderPhotoPlaceholder('header')}
        </div>
      );
    }
    if (h === 'minimal') {
      return (
        <div className="cv-header cv-header--layout-minimal">
          <h2>
            <EditableText
              value={data.personal.name}
              onChange={(val) => handlePersonalChange('name', val)}
              placeholder="Your Name"
            />
          </h2>
          <div className="cv-header-title-sub">
            <EditableText
              value={data.personal.title}
              onChange={(val) => handlePersonalChange('title', val)}
              placeholder="Professional Title"
            />
          </div>
          <div className="cv-header-minimal-contact">
            <EditableText
              value={data.personal.email}
              onChange={(val) => handlePersonalChange('email', val)}
              placeholder="Email Address"
            />{' '}
            ·{' '}
            <EditableText
              value={data.personal.phone}
              onChange={(val) => handlePersonalChange('phone', val)}
              placeholder="Phone Number"
            />
          </div>
        </div>
      );
    }
    return (
      <div className="cv-header cv-header--layout-standard">
        <div style={{ flexGrow: 1 }}>
          <h2>
            <EditableText
              value={data.personal.name}
              onChange={(val) => handlePersonalChange('name', val)}
              placeholder="Your Name"
            />
          </h2>
          <div className="cv-header-title-sub">
            <EditableText
              value={data.personal.title}
              onChange={(val) => handlePersonalChange('title', val)}
              placeholder="Professional Title"
            />
          </div>
          {renderContactInline()}
        </div>
        {showHeaderPhoto() ? (
          <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('header')} />
        ) : renderPhotoPlaceholder('header')}
      </div>
    );
  };

  const renderLangItem = (lang, idx, zone) => {
    const globalIdx = data.languages.findIndex(l => l.id === lang.id);
    if (layout.langDisplay === 'text') {
      return (
        <div key={idx} className="lang-item lang-item--text">
          <div className="lang-text-name">
            <EditableText
              value={lang.name}
              onChange={(val) => updateLanguageName(globalIdx, val)}
              placeholder="Language"
            />
          </div>
          <div className="lang-text-level">{lang.level}</div>
        </div>
      );
    }
    if (layout.langDisplay === 'dots') {
      const pct = getLanguagePercentage(lang.level);
      const filled = Math.round(parseInt(pct, 10) / 20) || 3;
      return (
        <div key={idx} className="lang-item lang-item--dots">
          <span>
            <EditableText
              value={lang.name}
              onChange={(val) => updateLanguageName(globalIdx, val)}
              placeholder="Language"
            />
          </span>
          <span className="lang-dots" aria-hidden="true">{'●'.repeat(filled)}{'○'.repeat(5 - filled)}</span>
        </div>
      );
    }
    return (
      <div key={idx} className="lang-item">
        <div className="lang-header">
          <span>
            <EditableText
              value={lang.name}
              onChange={(val) => updateLanguageName(globalIdx, val)}
              placeholder="Language"
            />
          </span>
          <span className="lang-level-label">{lang.level}</span>
        </div>
        <div className="lang-bar-bg" aria-hidden="true">
          <div className="lang-bar-fill" style={{ width: getLanguagePercentage(lang.level) }} />
        </div>
      </div>
    );
  };

  const renderLanguages = (zone) => {
    if (!isSectionVisible(data.sections, 'languages') || visibleLanguages.length === 0) return null;
    const isSide = zone === 'sidebar';
    return (
      <div className={`cv-section cv-languages-section ${isSide ? 'cv-sidebar-section' : 'cv-languages-main-section'}`}>
        <SectionHead title="Languages" style={isSide ? titleSide : titleMain} zone={isSide ? 'sidebar' : 'main'} />
        <div className={isSide ? 'cv-languages-list' : 'cv-languages-main-list'}>
          {visibleLanguages.map((lang, idx) => renderLangItem(lang, idx, zone))}
        </div>
      </div>
    );
  };

  const renderSkillsBlock = (zone) => {
    if (!isSectionVisible(data.sections, 'skills') || visibleSkills.length === 0) return null;
    const isSide = zone === 'sidebar';
    const isMain = zone === 'main';
    if (layout.skillsInMain && !isMain) return null;
    if (!layout.skillsInMain && !isSide) return null;

    const getCategoryIndex = (id) => data.skills.findIndex(s => s.id === id);

    return (
      <div className={`cv-section cv-skills-section ${isSide ? 'cv-sidebar-section' : 'cv-skills-main-section'}`}>
        <SectionHead title="Skills" style={isSide ? titleSide : titleMain} zone={isSide ? 'sidebar' : 'main'} />
        {visibleSkills.map((skillCat, idx) => {
          const globalIdx = getCategoryIndex(skillCat.id);
          const rawItems = parseSkillItems(skillCat);
          return (
            <div key={skillCat.id || idx} className="sidebar-skills-cat">
              <div className="sidebar-skills-cat-title">
                <EditableText
                  value={skillCat.category}
                  onChange={(val) => updateSkillCategory(globalIdx, 'category', val)}
                  placeholder="Skill Category"
                />
              </div>
              {skillDisplay === 'dots' ? (
                <div className="cv-skill-dots-list">
                  {getSkillEntries(skillCat).map((entry, itemIdx) => {
                    const dots = formatSkillDots(entry.rating);
                    if (!dots) {
                      return (
                        <div key={itemIdx} className="cv-skill-entry cv-skill-entry--name-only">
                          <span className="cv-skill-dot-label">
                            <EditableText
                              value={entry.name}
                              onChange={(val) => {
                                const newItems = [...rawItems];
                                newItems[itemIdx] = val;
                                updateSkillCategory(globalIdx, 'itemsText', newItems.join(', '));
                              }}
                              placeholder="Skill"
                            />
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={itemIdx} className="cv-skill-dots-row">
                        <span className="cv-skill-dot-label">
                          <EditableText
                            value={entry.name}
                            onChange={(val) => {
                              const newItems = [...rawItems];
                              newItems[itemIdx] = val;
                              updateSkillCategory(globalIdx, 'itemsText', newItems.join(', '));
                            }}
                            placeholder="Skill"
                          />
                        </span>
                        <span className="cv-skill-dots" aria-hidden="true">{dots}</span>
                      </div>
                    );
                  })}
                </div>
              ) : skillDisplay === 'list' ? (
                <div className="cv-skills-list-line">
                  <EditableText
                    value={rawItems.join(' · ')}
                    onChange={(val) => {
                      const items = val.split(/[·,]/).map(x => x.trim()).filter(Boolean);
                      updateSkillCategory(globalIdx, 'itemsText', items.join(', '));
                    }}
                    placeholder="Skill 1 · Skill 2 · Skill 3"
                  />
                </div>
              ) : (
                <div className="sidebar-skills-tags">
                  {getSkillEntries(skillCat).map((entry, itemIdx) => (
                    <span key={itemIdx} className="sidebar-skill-tag">
                      <EditableText
                        value={entry.name}
                        onChange={(val) => {
                          const newItems = [...rawItems];
                          newItems[itemIdx] = val;
                          updateSkillCategory(globalIdx, 'itemsText', newItems.join(', '));
                        }}
                        placeholder="Skill"
                      />
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderReferenceEntry = (ref) => {
    if (layout.referenceStyle === 'sidebar-card') {
      return (
        <div key={ref.id} className="cv-reference-entry cv-reference-entry--sidebar-card">
          <div className="cv-reference-name">{ref.name}</div>
          {ref.title && <div className="cv-reference-title">{ref.title}</div>}
          {ref.company && <div className="cv-reference-company">{ref.company}</div>}
          {(ref.phone || ref.email) && (
            <div className="cv-reference-contact">{[ref.phone, ref.email].filter(Boolean).join(' · ')}</div>
          )}
        </div>
      );
    }
    if (layout.referenceStyle === 'grid-two-col') {
      return (
        <div key={ref.id} className="cv-reference-entry cv-reference-entry--grid-col">
          <div className="cv-reference-col cv-reference-col--identity">
            <div className="cv-reference-name">{ref.name}</div>
            {ref.title && <div className="cv-reference-title">{ref.title}</div>}
          </div>
          <div className="cv-reference-col cv-reference-col--org">
            {ref.company && <div className="cv-reference-company">{ref.company}</div>}
            {(ref.phone || ref.email) && (
              <div className="cv-reference-contact">{[ref.phone, ref.email].filter(Boolean).join(' · ')}</div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div key={ref.id} className="cv-reference-entry cv-reference-entry--stacked">
        <div className="cv-split-row cv-reference-name-row">
          <span className="cv-reference-name">{ref.name}</span>
          {ref.title && <span className="cv-reference-title">{ref.title}</span>}
        </div>
        {(ref.company || ref.phone || ref.email) && (
          <div className="cv-reference-meta">{[ref.company, ref.phone, ref.email].filter(Boolean).join(' · ')}</div>
        )}
      </div>
    );
  };

  const renderReferences = (zone) => {
    const want = layout.referencesZone || 'main';
    if (want !== zone) return null;
    if (!isSectionVisible(data.sections, 'references') || visibleReferences.length === 0) return null;
    const isSide = zone === 'sidebar';
    return (
      <div className={`cv-section cv-references-section cv-references-section--${layout.referenceStyle || 'stacked'}`}>
        <SectionHead title="References" style={isSide ? titleSide : titleMain} zone={isSide ? 'sidebar' : 'main'} />
        <div className="cv-references-list">
          {visibleReferences.map(renderReferenceEntry)}
        </div>
      </div>
    );
  };

  const renderProfile = () => {
    if (layout.summaryInHeader) return null;
    if (!isSectionVisible(data.sections, 'profile') || !data.personal.summary) return null;
    return (
      <div className="cv-section cv-profile-section">
        <SectionHead title="Profile" style={titleMain} zone="main" />
        <ul className="emp-bullets cv-profile-bullets">
          {getProfilePoints(data.personal.summary).map((para, idx) => {
            const formattedText = /[.!?。！？]$/.test(para) ? para : `${para}.`;
            return (
              <li key={idx} className="cv-profile-text" style={{ marginBottom: '6px', listStyleType: 'disc' }}>
                <EditableText
                  value={formattedText}
                  onChange={(val) => {
                    const points = getProfilePoints(data.personal.summary);
                    points[idx] = val;
                    handlePersonalChange('summary', points.join('\n'));
                  }}
                  placeholder="Profile Statement"
                  tagName="span"
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderEmployment = () => {
    if (!isSectionVisible(data.sections, 'employment') || visibleEmployment.length === 0) return null;
    return (
      <div className="cv-section cv-employment-section">
        <SectionHead title="Employment History" style={titleMain} zone="main" />
        {visibleEmployment.map((emp) => {
          const empBullets = visibleBullets(emp.bullets);
          const bulletsForView = isConciseView(viewMode) ? empBullets.slice(0, 3) : empBullets;
          const empProjects = visibleItems(emp.projects || []);
          return (
            <div key={emp.id} className={empClass}>
              <div className="emp-header-row">
                <span
                  className="emp-company"
                  style={(emp.jobTitleColor || colorOverrides.jobTitle)
                    ? { color: emp.jobTitleColor || colorOverrides.jobTitle }
                    : undefined}
                >
                  <EditableText
                    value={emp.company}
                    onChange={(val) => updateEmployment(emp.id, 'company', val)}
                    placeholder="Company Name"
                  />
                </span>
                {emp.location && (
                  <span className="emp-location">
                    <EditableText
                      value={emp.location}
                      onChange={(val) => updateEmployment(emp.id, 'location', val)}
                      placeholder="Location"
                    />
                  </span>
                )}
              </div>
              {emp.subtext && (
                <div className="emp-subtext">
                  <EditableText
                    value={emp.subtext}
                    onChange={(val) => updateEmployment(emp.id, 'subtext', val)}
                    placeholder="Company Description / Sector"
                  />
                </div>
              )}
              {!usesMultiRoleDisplay(emp) ? (
                <div className="emp-sub-row">
                  <span className="emp-position-title">
                    <EditableText
                      value={emp.role}
                      onChange={(val) => updateEmployment(emp.id, 'role', val)}
                      placeholder="Job Title"
                    />
                  </span>
                  <span className="cv-date">
                    <EditableText
                      value={emp.period}
                      onChange={(val) => updateEmployment(emp.id, 'period', val)}
                      placeholder="Period"
                    />
                  </span>
                </div>
              ) : (
                <div className="emp-sub-row emp-sub-row--dates-only">
                  <span className="cv-date">
                    <EditableText
                      value={emp.period}
                      onChange={(val) => updateEmployment(emp.id, 'period', val)}
                      placeholder="Period"
                    />
                  </span>
                </div>
              )}
              <EmploymentRolesPreview
                employment={emp}
                colorOverrides={colorOverrides}
                updateEmpRole={updateEmpRole}
                updateRoleBullet={updateRoleBullet}
              />
              {bulletsForView.length > 0 && (
                <ul className="emp-bullets">
                  {bulletsForView.map((b, idx) => (
                    <li key={b.id || idx}>
                      <EditableText
                        value={bulletText(b)}
                        onChange={(val) => updateBullet(emp.id, idx, val)}
                        placeholder="Responsibility or Achievement"
                      />
                    </li>
                  ))}
                </ul>
              )}
              {showsInlineProjects(viewMode) && empProjects.length > 0 && (
                <div className="cv-project-nested-list">
                  <div className="cv-project-lead">
                    <div className="cv-project-section-label">Key Project Deliveries:</div>
                    <div className="cv-project-item">
                      <div className="cv-project-title-line">
                        <strong>
                          <EditableText
                            value={empProjects[0].year}
                            onChange={(val) => {
                              const globalProjIdx = emp.projects.findIndex(p => p.id === empProjects[0].id);
                              updateProject(emp.id, globalProjIdx, 'year', val);
                            }}
                            placeholder="Year"
                          />
                        </strong>
                        <span>
                          {' '}—{' '}
                          <EditableText
                            value={cleanProjectTitle(empProjects[0].title, empProjects[0].year)}
                            onChange={(val) => {
                              const globalProjIdx = emp.projects.findIndex(p => p.id === empProjects[0].id);
                              updateProject(emp.id, globalProjIdx, 'title', val);
                            }}
                            placeholder="Project Title"
                          />
                        </span>
                      </div>
                      {empProjects[0].description && (
                        <div className="cv-project-desc">
                          <EditableText
                            value={empProjects[0].description}
                            onChange={(val) => {
                              const globalProjIdx = emp.projects.findIndex(p => p.id === empProjects[0].id);
                              updateProject(emp.id, globalProjIdx, 'description', val);
                            }}
                            placeholder="Project Deliverables Details"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  {empProjects.slice(1).map((proj, idx) => {
                    const globalProjIdx = emp.projects.findIndex(p => p.id === proj.id);
                    return (
                      <div key={proj.id || idx + 1} className="cv-project-item">
                        <div className="cv-project-title-line">
                          <strong>
                            <EditableText
                              value={proj.year}
                              onChange={(val) => updateProject(emp.id, globalProjIdx, 'year', val)}
                              placeholder="Year"
                            />
                          </strong>
                          <span>
                            {' '}—{' '}
                            <EditableText
                              value={cleanProjectTitle(proj.title, proj.year)}
                              onChange={(val) => updateProject(emp.id, globalProjIdx, 'title', val)}
                              placeholder="Project Title"
                            />
                          </span>
                        </div>
                        {proj.description && (
                          <div className="cv-project-desc">
                            <EditableText
                              value={proj.description}
                              onChange={(val) => updateProject(emp.id, globalProjIdx, 'description', val)}
                              placeholder="Project Deliverables Details"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderEducation = () => (
    isSectionVisible(data.sections, 'education') && visibleEducation.length > 0 && (
      <div className="cv-section cv-education-section">
        <SectionHead title="Education" style={titleMain} zone="main" />
        {visibleEducation.map((edu, idx) => {
          const eduBullets = visibleBullets(edu.bullets);
          return (
            <div key={edu.id || idx} className="cv-education-block">
              <div className="cv-split-row cv-education-degree">
                <span>
                  <EditableText
                    value={edu.degree}
                    onChange={(val) => updateEducation(edu.id, 'degree', val)}
                    placeholder="Degree / Qualification"
                  />
                </span>
                <span className="cv-date">
                  <EditableText
                    value={edu.period}
                    onChange={(val) => updateEducation(edu.id, 'period', val)}
                    placeholder="Study Period"
                  />
                </span>
              </div>
              <div className="cv-education-school">
                <EditableText
                  value={edu.school}
                  onChange={(val) => updateEducation(edu.id, 'school', val)}
                  placeholder="School / Institution"
                />
              </div>
              {eduBullets.length > 0 && (
                <ul className="bullets-list">
                  {eduBullets.map((b, bIdx) => (
                    <li key={b.id || bIdx}>
                      <EditableText
                        value={bulletText(b)}
                        onChange={(val) => {
                          const updatedBullets = [...edu.bullets];
                          updatedBullets[bIdx] = typeof b === 'string'
                            ? { id: `edu_bullet_${bIdx}`, text: val, visible: true }
                            : { ...b, text: val };
                          updateEducation(edu.id, 'bullets', updatedBullets);
                        }}
                        placeholder="Details / Grade / Achievements"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    )
  );

  const renderAvailability = () => (
    showAvailabilitySection && (
      <div className="cv-section cv-availability-section">
        <SectionHead title="Availability" style={titleMain} zone="main" />
        <ul className="emp-bullets cv-availability-list">
          {AVAILABILITY_FIELD_DEFS.map((field) => (
            isAvailabilityFieldShown(data.availability, field.key) ? (
              <li key={field.key}>
                <strong>{field.previewLabel}:</strong> {data.availability[field.key]}
              </li>
            ) : null
          ))}
        </ul>
      </div>
    )
  );

  const mainBlocks = {
    profile: renderProfile,
    employment: renderEmployment,
    education: renderEducation,
    skills: () => renderSkillsBlock('main'),
    languages: () => renderLanguages('main'),
    references: () => renderReferences('main'),
    availability: renderAvailability,
  };

  const renderMainCol = () => (
    <div className="cv-main-col">
      {(layout.mainOrder || []).map((key) => {
        const fn = mainBlocks[key];
        return fn ? <React.Fragment key={key}>{fn()}</React.Fragment> : null;
      })}
    </div>
  );

  const sidebarBlocks = {
    photo: () => (
      <>
        {showSidebarPhoto() && (
          <div className="sidebar-avatar-container">
            <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('sidebar')} />
          </div>
        )}
        {!data.personal.photo && layout.photo === 'sidebar' && renderPhotoPlaceholder('sidebar')}
      </>
    ),
    contact: () => layout.contactInSidebar && (
      <div className="cv-sidebar-section cv-sidebar-contact-section">
        <SectionHead title="Contact" style={titleSide} zone="sidebar" />
        {renderContactSidebar()}
      </div>
    ),
    languages: () => renderLanguages('sidebar'),
    skills: () => renderSkillsBlock('sidebar'),
    certifications: () => (
      isSectionVisible(data.sections, 'certifications') && visibleCerts.length > 0 && (
        <div className="cv-sidebar-section cv-certs-section">
          <SectionHead title="Certifications" style={titleSide} zone="sidebar" />
          {visibleCerts.map((cert, idx) => renderCertEntry(cert, idx))}
        </div>
      )
    ),
    references: () => renderReferences('sidebar'),
    sabbatical: () => (
      isSectionVisible(data.sections, 'sabbatical') && data.sabbatical?.enabled && (
        <div className="sabbatical-box">
          <SectionHead title="Notes" style={titleSide} zone="sidebar" />
          <ul className="cv-sabbatical-list">
            {data.sabbatical.bullets.map((b, idx) => (
              <li key={idx}>
                <EditableText
                  value={b}
                  onChange={(val) => {
                    handleSabbaticalBulletChange(idx, val);
                  }}
                  placeholder="Note bullet point"
                />
              </li>
            ))}
          </ul>
        </div>
      )
    ),
  };

  const renderSidebarCol = () => (
    <div className="cv-sidebar-col">
      {(layout.sidebarOrder || []).map((key) => {
        const fn = sidebarBlocks[key];
        return fn ? <React.Fragment key={key}>{fn()}</React.Fragment> : null;
      })}
    </div>
  );

  const renderBody = () => {
    if (layout.body === 'single') {
      return (
        <div className="cv-body cv-body--layout-single">
          <div className="cv-main-col cv-main-col--full">
            {(layout.mainOrder || []).map((key) => {
              const sideFn = sidebarBlocks[key];
              const mainFn = mainBlocks[key];
              if (sideFn) return <React.Fragment key={key}>{sideFn()}</React.Fragment>;
              if (mainFn) return <React.Fragment key={key}>{mainFn()}</React.Fragment>;
              return null;
            })}
          </div>
        </div>
      );
    }
    if (layout.body === 'center-split') {
      return (
        <div className="cv-body cv-body--layout-center-split">
          <div className="cv-col cv-col--left">
            {renderLanguages('sidebar')}
            {renderEducation()}
            {renderSkillsBlock('sidebar')}
            {renderReferences('main')}
          </div>
          <div className="cv-col cv-col--right">
            {renderProfile()}
            {renderEmployment()}
            {renderAvailability()}
          </div>
        </div>
      );
    }
    const isLeft = layout.body === 'sidebar-left';
    return (
      <div className={`cv-body cv-body--layout-duo ${isLeft ? 'cv-body--sidebar-left' : 'cv-body--sidebar-right'}`}>
        <div className="cv-grid-layout cv-grid-layout--layout-engine">
          {/* Sidebar before main so float wrap works; main uses full width below sidebar */}
          {renderSidebarCol()}
          {renderMainCol()}
        </div>
      </div>
    );
  };

  if (isStandaloneProjectList(viewMode)) {
    return <ProjectListAppendix employment={visibleEmployment} colorOverrides={colorOverrides} pageBreakBefore={false} />;
  }

  return (
    <>
      {renderHeader()}
      {renderBody()}
      {showsProjectAppendix(viewMode) && (
        <ProjectListAppendix employment={visibleEmployment} colorOverrides={colorOverrides} />
      )}
    </>
  );
}
