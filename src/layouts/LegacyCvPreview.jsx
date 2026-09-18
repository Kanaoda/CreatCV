import React from 'react';
import { EditableText } from '../components/EditableText.jsx';
import { EmploymentRolesPreview } from '../EmploymentRolesPreview';
import { ProjectListAppendix } from '../ProjectListAppendix';
import { PHOTO_PLACEMENT } from '../templates/constants.js';
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
import {
  cleanProjectTitle,
  getProfilePoints,
  parseSkillItems,
} from '../cvPreview/helpers.js';
import { formatSkillDots, getSkillEntries } from '../cvPreview/skillRatings.js';
import { getEffectiveSkillDisplay } from './skillDisplay.js';
import { AVAILABILITY_FIELD_DEFS, isAvailabilityFieldShown } from '../availabilityFields.js';
import {
  findSkillSection,
  getVisibleSkillCategories,
  isSkillSectionVisible,
  resolveSidebarOrder,
  sectionHasVisibleContent,
} from '../sidebarSections.js';

/**
 * Frozen preview path for legacy templates (e.g. preset 12 modern-tech).
 * DOM and class names must not change without explicit approval.
 */
export function LegacyCvPreview({ model }) {
  const {
    data,
    viewMode,
    colorOverrides,
    template,
    visibleEmployment,
    visibleLanguages,
    visibleCerts,
    visibleEducation,
    visibleReferences,
    showAvailabilitySection,
    getPhotoClassName,
    renderCertEntry,
    getLanguagePercentage,
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

  const renderLegacySkillSection = (sectionId) => {
    const section = findSkillSection(data.skillSections, sectionId);
    if (!isSkillSectionVisible(data.sections, section)) return null;
    if (!sectionHasVisibleContent(section)) return null;
    const visibleCats = getVisibleSkillCategories(section).filter((cat) => parseSkillItems(cat).length > 0);
    if (visibleCats.length === 0) return null;
    const display = getEffectiveSkillDisplay({ skills: 'tags' }, showSkillRatings, visibleCats);
    const showCatTitles = visibleCats.length > 1
      || visibleCats.some((c) => c.category && !/^\[.*\]$/.test(String(c.category).trim()));

    return (
      <div className="cv-sidebar-section cv-skills-section">
        <div className="sidebar-section-title">{section.title || 'Skills'}</div>
        {visibleCats.map((skillCat) => {
          const catIndex = (section.categories || []).findIndex((c) => c.id === skillCat.id);
          const rawItems = parseSkillItems(skillCat);
          return (
            <div key={skillCat.id || catIndex} className="sidebar-skills-cat">
              {showCatTitles && skillCat.category && !/^\[.*\]$/.test(String(skillCat.category).trim()) && (
                <div className="sidebar-skills-cat-title">
                  <EditableText
                    value={skillCat.category}
                    onChange={(val) => updateSkillCategory(sectionId, catIndex, 'category', val)}
                    placeholder="Category"
                  />
                </div>
              )}
              {display === 'dots' ? (
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
                                updateSkillCategory(sectionId, catIndex, 'itemsText', newItems.join(', '));
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
                              updateSkillCategory(sectionId, catIndex, 'itemsText', newItems.join(', '));
                            }}
                            placeholder="Skill"
                          />
                        </span>
                        <span className="cv-skill-dots" aria-hidden="true">{dots}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="sidebar-skills-tags">
                  {rawItems.map((item, itemIdx) => (
                    <span key={itemIdx} className="sidebar-skill-tag">
                      <EditableText
                        value={item}
                        onChange={(val) => {
                          const newItems = [...rawItems];
                          newItems[itemIdx] = val;
                          updateSkillCategory(sectionId, catIndex, 'itemsText', newItems.join(', '));
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

  const orderedSidebarKeys = resolveSidebarOrder(
    ['languages', 'coreCompetencies', 'toolsDelivery', 'certifications'],
    data.sidebarSectionOrder,
    data.skillSections,
  );

  if (isStandaloneProjectList(viewMode)) {
    return (
      <ProjectListAppendix employment={visibleEmployment} colorOverrides={colorOverrides} pageBreakBefore={false} />
    );
  }

  return (
    <>
      <div className="cv-header">
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
        </div>
        {data.personal.photo && template.photoPlacement === PHOTO_PLACEMENT.HEADER && (
          <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('header')} />
        )}
      </div>

      <div className="cv-grid-layout">
        <div className="cv-sidebar-col">
          {data.personal.photo && template.photoPlacement === PHOTO_PLACEMENT.SIDEBAR && (
            <div className="sidebar-avatar-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <img src={data.personal.photo} alt={data.personal.name} className={getPhotoClassName('sidebar')} />
            </div>
          )}
          {orderedSidebarKeys.map((key) => {
            if (key === 'languages') {
              return (
                isSectionVisible(data.sections, 'languages') && visibleLanguages.length > 0 && (
                  <div key={key} className="cv-sidebar-section cv-languages-section">
                    <div className="sidebar-section-title">Languages</div>
                    <div className={template.singleColumn ? 'cv-languages-grid' : 'cv-languages-list'}>
                      {visibleLanguages.map((lang, idx) => (
                        <div key={idx} className="lang-item">
                          <div className="lang-header">
                            <span>
                              <EditableText
                                value={lang.name}
                                onChange={(val) => updateLanguageName(idx, val)}
                                placeholder="Language"
                              />
                            </span>
                            <span className="lang-level-label">{lang.level}</span>
                          </div>
                          <div className="lang-bar-bg" aria-hidden="true">
                            <div className="lang-bar-fill" style={{ width: getLanguagePercentage(lang.level) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              );
            }
            if (key === 'certifications') {
              return (
                isSectionVisible(data.sections, 'certifications') && visibleCerts.length > 0 && (
                  <div key={key} className="cv-sidebar-section cv-certs-section">
                    <div className="sidebar-section-title">Certifications</div>
                    {visibleCerts.map((cert, idx) => renderCertEntry(cert, idx))}
                  </div>
                )
              );
            }
            return <React.Fragment key={key}>{renderLegacySkillSection(key)}</React.Fragment>;
          })}
          {isSectionVisible(data.sections, 'sabbatical') && data.sabbatical?.enabled && (
            <div className="sabbatical-box">
              <strong>Notes:</strong>
              <ul style={{ marginLeft: '12px', marginTop: '4px', listStyleType: 'circle' }}>
                {data.sabbatical.bullets.map((b, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>
                    <EditableText
                      value={b}
                      onChange={(val) => handleSabbaticalBulletChange(idx, val)}
                      placeholder="Note bullet point"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="cv-main-col">
          {isSectionVisible(data.sections, 'profile') && data.personal.summary && (
            <div className="cv-section cv-profile-section">
              <div className="cv-section-title">Profile</div>
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
          )}
          {isSectionVisible(data.sections, 'employment') && visibleEmployment.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title">Employment History</div>
              {visibleEmployment.map((emp) => {
                const empBullets = visibleBullets(emp.bullets);
                const bulletsForView = isConciseView(viewMode) ? empBullets.slice(0, 3) : empBullets;
                const empProjects = visibleItems(emp.projects || []);
                return (
                  <div key={emp.id} className="emp-block">
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
          )}
          {isSectionVisible(data.sections, 'education') && visibleEducation.length > 0 && (
            <div className="cv-section">
              <div className="cv-section-title">Education</div>
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
                      <ul className="bullets-list" style={{ marginTop: '6px' }}>
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
          )}
          {isSectionVisible(data.sections, 'references') && visibleReferences.length > 0 && (
            <div className="cv-section cv-references-section">
              <div className="cv-section-title">References</div>
              {visibleReferences.map((ref) => (
                <div key={ref.id} className="cv-reference-entry">
                  <div className="cv-split-row cv-reference-name-row">
                    <span className="cv-reference-name">{ref.name}</span>
                    {ref.title && <span className="cv-reference-title">{ref.title}</span>}
                  </div>
                  {(ref.company || ref.phone || ref.email) && (
                    <div className="cv-reference-meta">
                      {[ref.company, ref.phone, ref.email].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {showAvailabilitySection && (
            <div className="cv-section cv-availability-section">
              <div className="cv-section-title">Availability</div>
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
          )}
        </div>
      </div>

      {showsProjectAppendix(viewMode) && (
        <ProjectListAppendix employment={visibleEmployment} colorOverrides={colorOverrides} />
      )}
    </>
  );
}
