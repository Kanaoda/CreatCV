import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import defaultResumeData from '../reference/default_resume.json';
import defaultAppSettings from '../reference/default_app_settings.json';
import { exportToWord } from './docxExporter';
import { reorderArray, useSortableList, SortableToolbar } from './useSortableList';
import { useResumeState } from './useResumeState';
import { DEFAULT_TEMPLATE_FILENAME, loadDefaultTemplate } from './resumeDefaults';
import {
  listTemplateOptions,
  resolveTemplate,
  readTemplateIdFromSettings,
  buildAppSettingsExport,
  readShowSkillRatingsFromSettings,
  PHOTO_PLACEMENT,
} from './templates/index.js';
import { CvLayoutRenderer, LegacyCvPreview } from './layouts/index.js';
import { EditableText } from './components/EditableText.jsx';
import { parseSkillItems } from './cvPreview/helpers.js';
import { getSkillEntries, normalizeSkillItemRatings } from './cvPreview/skillRatings.js';
import './layouts/layouts.css';
import { CreatCvLogo } from './CreatCvLogo';
import { CreatCvWordmark } from './CreatCvWordmark';
import {
  formatPhotoSizeLabel,
  optimizePhotoDataUrl,
  shouldOptimizePhoto,
} from './photoOptimizer';
import {
  CV_COLOR_GROUPS,
  buildColorsExportPayload,
  buildCvColorCssVars,
  hasAnyColorOverride,
  readColorOverridesFromSettings,
} from './cvColorPalette';
import {
  DEFAULT_SECTION_VISIBILITY,
  bulletText,
  isSectionVisible,
  isVisible,
  normalizeBullets,
  patchBulletText,
  patchBulletVisible,
  visibleBullets,
  visibleItems,
} from './visibility';
import {
  flattenSkillCategories,
  isSkillSectionVisible,
  normalizeSidebarSectionOrder,
  normalizeSkillSections,
  sidebarSectionLabel,
} from './sidebarSections.js';
import { VisibilityToggle } from './VisibilityToggle';
import {
  hasStructuredRoles,
  normalizeEmploymentRoles,
  stripLegacyCareerProgressionBullets,
  usesMultiRoleDisplay,
} from './employmentRoles';
import { exportCvToPdf } from './printCv';
import {
  AVAILABILITY_FIELD_DEFS,
  availabilityFieldVisibleKey,
  hasAnyShownAvailabilityField,
  normalizeAvailability,
} from './availabilityFields.js';
import {
  TYPO_SCALE_MIN,
  TYPO_SCALE_MAX,
  TYPO_SCALE_STEP,
  LINE_SPACING_MIN,
  LINE_SPACING_MAX,
  LINE_SPACING_STEP,
  parseTypoPercent,
  formatTypoPercent,
  parseSpacingFactor,
  formatSpacingFactor,
  typoScaleLabel,
  lineSpacingLabel,
} from './fineTuningControls.js';

const normalizeExternalUrl = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};


const cleanProfilePoint = (text) => text.replace(/^[\s•*\-–—]+/, '').trim();

/** Split stored summary into bullet lines (editor + preview use the same logic) */
const getProfilePoints = (summary) => {
  if (!summary?.trim()) return [];

  if (summary.includes('\n')) {
    return summary
      .split(/\n+/)
      .map(cleanProfilePoint)
      .filter(Boolean);
  }

  const bySentence = summary
    .split(/(?<=[.!?。！？])\s+/)
    .map(cleanProfilePoint)
    .filter(Boolean);

  if (bySentence.length > 1) return bySentence;

  return [cleanProfilePoint(summary)].filter(Boolean);
};

/** One paragraph in JSON → newline-separated lines for editing */
const normalizeSummaryStorage = (summary) => {
  if (!summary?.trim()) return '';
  const points = getProfilePoints(summary);
  if (points.length > 1) return points.join('\n');
  return summary.trim();
};


const normalizeResumeData = (raw) => {
  const skillSections = normalizeSkillSections(raw).map((sec) => ({
    ...sec,
    categories: (sec.categories || []).map((cat) => {
      const itemsText = cat.itemsText ?? (cat.items || []).join(', ');
      const items = itemsText.split(',').map((item) => item.trim()).filter(Boolean);
      return {
        ...cat,
        items,
        itemsText,
        itemRatings: normalizeSkillItemRatings(items, cat.itemRatings),
      };
    }),
  }));

  return {
  ...raw,
  sections: { ...DEFAULT_SECTION_VISIBILITY, ...(raw.sections || {}) },
  skillSections,
  sidebarSectionOrder: normalizeSidebarSectionOrder(raw.sidebarSectionOrder, skillSections),
  // Keep flat skills for any legacy consumers / export compatibility
  skills: flattenSkillCategories(skillSections),
  personal: {
    ...raw.personal,
    summary: normalizeSummaryStorage(raw.personal?.summary || ''),
  },
  employment: (raw.employment || []).map((emp, i) => {
    const id = emp.id || `emp_${i}`;
    const roles = normalizeEmploymentRoles(emp, i);
    const base = {
      ...emp,
      id,
      roles,
      splitRoles: roles.length > 0 ? emp.splitRoles !== false : true,
      visible: emp.visible !== false,
      jobTitleColor: emp.jobTitleColor || emp.companyColor || '',
      projects: (emp.projects || []).map((proj, j) => ({
        ...proj,
        id: proj.id || `proj_${i}_${j}`,
        visible: proj.visible !== false,
      })),
    };
    return {
      ...base,
      bullets: stripLegacyCareerProgressionBullets(base, i),
    };
  }),
  education: (raw.education || []).map((edu, i) => ({
    ...edu,
    id: edu.id || `edu_${i}`,
    visible: edu.visible !== false,
    bullets: normalizeBullets(edu.bullets, `edu_bullet_${i}`),
  })),
  languages: (raw.languages || []).map((lang, i) => ({
    id: lang.id || `lang_${i}`,
    name: lang.name || '',
    level: lang.level || 'Intermediate',
    visible: lang.visible !== false,
  })),
  certifications: (raw.certifications || []).map((cert, i) => ({
    id: cert.id || `cert_${i}_${(cert.name || 'item').replace(/\s+/g, '_').slice(0, 24)}`,
    name: cert.name || '',
    issuer: cert.issuer || '',
    date: cert.date || '',
    url: cert.url || '',
    visible: cert.visible !== false,
  })),
  references: (raw.references || []).map((ref, i) => ({
    id: ref.id || `ref_${i}`,
    name: ref.name || '',
    title: ref.title || '',
    company: ref.company || '',
    phone: ref.phone || '',
    email: ref.email || '',
    visible: ref.visible !== false,
  })),
  availability: normalizeAvailability(raw.availability),
};
};


function App() {
  const {
    data, setData,
    templateId, setTemplateId,
    viewMode, setViewMode,
    activeTab, setActiveTab,
    fontSizeRatio, setFontSizeRatio,
    spacingFactor, setSpacingFactor,
    paperTexture, setPaperTexture,
    photoFrameStyle, setPhotoFrameStyle,
    photoScale, setPhotoScale,
    showSkillRatings, setShowSkillRatings,
    colorOverrides, setColorOverrides,
    setColorOverride,
    resetColorOverrides,
    pageWidth, setPageWidth,
    pageHeight, setPageHeight,
    sort,
    handlePersonalChange,
    applyOptimizedPhoto,
    handlePhotoUpload,
    addEmployment,
    removeEmployment,
    updateEmployment,
    addEmpRole,
    removeEmpRole,
    updateEmpRole,
    reorderEmpRoles,
    addRoleBullet,
    removeRoleBullet,
    updateRoleBullet,
    updateRoleBulletVisible,
    reorderRoleBullets,
    setSectionVisibility,
    removeEducation,
    addEducation,
    updateEducation,
    reorderEducation,
    addEduBullet,
    removeEduBullet,
    updateEduBullet,
    updateEduBulletVisible,
    reorderEduBullets,
    updateEmpBulletVisible,
    updateProjectVisible,
    updateAvailability,
    addReference,
    removeReference,
    updateReference,
    reorderReferences,
    addBullet,
    removeBullet,
    updateBullet,
    addProject,
    reorderEmpBullets,
    reorderEmpProjects,
    removeProject,
    updateProject,
    addCert,
    removeCert,
    updateCert,
    reorderCertifications,
    reorderEmployment,
    reorderLanguages,
    reorderSidebarSections,
    reorderSabbaticalBullets,
    updateLanguageLevel,
    addLanguage,
    removeLanguage,
    updateLanguageName,
    addSkillSection,
    removeSkillSection,
    updateSkillSection,
    addSkillCategory,
    removeSkillCategory,
    updateSkillCategory,
    updateSkillItemsText,
    commitSkillItems,
    updateSkillItemRating,
    reorderSkillCategories,
    handleSabbaticalBulletChange,
    addSabbaticalBullet,
    removeSabbaticalBullet,
    buildExportPayload,
    applyImportedPayload,
    resetToDefaultTemplate,
    exportJSON,
    importJSON,
    handlePrint,
    handleWordExport,
  } = useResumeState(normalizeResumeData);

  React.useEffect(() => {
    const pageEl = document.querySelector('.cv-page');
    if (!pageEl) return;

    setPageWidth(pageEl.offsetWidth);
    setPageHeight(pageEl.scrollHeight);

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        setPageWidth(entry.target.offsetWidth);
        setPageHeight(entry.target.scrollHeight);
      }
    });

    resizeObserver.observe(pageEl);
    return () => resizeObserver.disconnect();
  }, [data, templateId, viewMode, spacingFactor, fontSizeRatio]);

  React.useEffect(() => {
    if (data.personal?.name) {
      document.title = `${data.personal.name.trim()} - CV`;
    } else {
      document.title = 'Creat CV — Premium CV & Resume Engine';
    }
  }, [data.personal?.name]);

  React.useEffect(() => {
    const photo = data.personal?.photo;
    if (!shouldOptimizePhoto(photo)) return undefined;

    let cancelled = false;
    optimizePhotoDataUrl(photo).then((optimized) => {
      if (cancelled || !optimized || optimized === photo || optimized.length >= photo.length * 0.9) return;
      setData((prev) => ({
        ...prev,
        personal: { ...prev.personal, photo: optimized },
      }));
    });
    return () => { cancelled = true; };
  }, [data.personal?.photo]);

  const visibleEmployment = visibleItems(data.employment);
  const visibleLanguages = visibleItems(data.languages);
  const visibleSkills = visibleItems(flattenSkillCategories(data.skillSections));
  const visibleCerts = visibleItems(data.certifications);
  const visibleEducation = visibleItems(data.education);
  const visibleReferences = visibleItems(data.references || []);
  const showAvailabilitySection = isSectionVisible(data.sections, 'availability')
    && hasAnyShownAvailabilityField(data.availability);

  const CertLinkIcon = () => (
    <svg className="cert-link-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 3h2a5 5 0 0 1 5 5v2h-2V8a3 3 0 0 0-3-3h-2V3zm-4 18H8a5 5 0 0 1-5-5v-2h2v2a3 3 0 0 0 3 3h2v2zm9-13v2h-6.17L7 15.83V18h2v-2.83L14.83 9H18V7h-3z"
      />
    </svg>
  );

  const getPhotoClassName = (placement) => {
    const base = placement === 'sidebar' ? 'sidebar-avatar cv-profile-photo' : 'cv-profile-photo cv-header-photo';
    if (photoFrameStyle === 'preset') return base;
    return `${base} photo-frame-${photoFrameStyle}`;
  };

  const renderCertEntry = (cert, idx) => {
    const certUrl = normalizeExternalUrl(cert.url);
    const globalIdx = data.certifications.findIndex(c => c.id === cert.id);
    return (
      <div key={cert.id || idx} className="sidebar-item">
        <strong className="cert-name-row">
          {certUrl ? (
            <a
              href={certUrl}
              className="cert-name-link"
              target="_blank"
              rel="noopener noreferrer"
              title={certUrl}
              onClick={(e) => {
                // If the user clicks inside the editable area, prevent navigating away
                if (e.target.closest('.cv-editable-text')) {
                  e.preventDefault();
                }
              }}
            >
              <EditableText
                value={cert.name}
                onChange={(val) => updateCert(globalIdx, 'name', val)}
                placeholder="Certificate Name"
              />
            </a>
          ) : (
            <EditableText
              value={cert.name}
              onChange={(val) => updateCert(globalIdx, 'name', val)}
              placeholder="Certificate Name"
            />
          )}
          {certUrl && (
            <a
              href={certUrl}
              className="cert-verify-link"
              target="_blank"
              rel="noopener noreferrer"
              title={`Verify: ${cert.name}`}
              aria-label={`Open certificate link for ${cert.name}`}
            >
              <CertLinkIcon />
            </a>
          )}
        </strong>
        <span style={{ fontSize: '0.78rem', color: 'var(--cv-cert-meta, var(--cv-text-light))' }}>
          <EditableText
            value={cert.issuer}
            onChange={(val) => updateCert(globalIdx, 'issuer', val)}
            placeholder="Issuer"
          />{' '}
          (
          <EditableText
            value={cert.date}
            onChange={(val) => updateCert(globalIdx, 'date', val)}
            placeholder="Date"
          />
          )
        </span>
      </div>
    );
  };

  const getLanguagePercentage = (level) => {
    const l = level.toLowerCase();
    if (l.includes('native')) return '100%';
    if (l.includes('fluent') || l.includes('level 4') || l.includes('n1')) return '90%';
    if (l.includes('professional') || l.includes('higher')) return '78%';
    if (l.includes('intermediate') || l.includes('conversational') || l.includes('level 3') || l.includes('n2')) return '58%';
    if (l.includes('basic')) return '48%';
    if (l.includes('elementary') || l.includes('n3') || l.includes('n4')) return '30%';
    return '50%';
  };

  const template = resolveTemplate(templateId);

  const cvDynamicStyles = {
    ...template.themeCssVars,
    ...buildCvColorCssVars(colorOverrides),
    '--cv-spacing-factor': spacingFactor,
    '--cv-photo-scale': photoScale,
    fontSize: fontSizeRatio,
  };

  // Dynamic A4 Page Break Calculations (based on 15mm page margin printable ratio: 267mm/210mm = 1.2714)
  const singlePageHeight = pageWidth * 1.2714;
  const totalPages = Math.ceil(pageHeight / singlePageHeight) || 1;
  const dividers = [];
  for (let i = 1; i < totalPages; i++) {
    dividers.push(Math.round(singlePageHeight * i));
  }

  return (
    <div className="app-container">
      {/* LEFT: Editor Console */}
      <div className="editor-panel">
        <div className="editor-header">
          <div className="editor-brand">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Create CV Logo" className="editor-brand-logo-img" />
          </div>

          <div className="editor-header-actions">
            <button className="btn btn-primary" onClick={exportJSON}>Save JSON</button>
            <label className="btn" style={{ position: 'relative', overflow: 'hidden' }}>
              Load JSON
              <input type="file" accept=".json" onChange={importJSON} style={{ position: 'absolute', opacity: 0, right: 0, top: 0, width: '100%', height: '100%', cursor: 'pointer' }} />
            </label>
            <button type="button" className="btn" onClick={resetToDefaultTemplate} title="Reset to starter template">
              Reset to Template
            </button>
          </div>

          {/* Section Tab navigation to clean up form view */}
          <div className="tab-navigation">
            <button className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`} onClick={() => setActiveTab('personal')}>Profile</button>
            <button className={`tab-btn ${activeTab === 'employment' ? 'active' : ''}`} onClick={() => setActiveTab('employment')}>Work</button>
            <button className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`} onClick={() => setActiveTab('skills')}>Skills / Lang</button>
            <button className={`tab-btn ${activeTab === 'other' ? 'active' : ''}`} onClick={() => setActiveTab('other')}>Other</button>
          </div>
        </div>

        <div className="editor-sections-scroll">
          {/* TAB 1: Profile & Contact */}
          {activeTab === 'personal' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="section-card section-visibility-card">
                <h2 style={{ marginTop: 0 }}>CV Sections</h2>
                <p className="sortable-list-hint" style={{ marginTop: 0 }}>
                  Turn sections off to tailor each export — content stays in your JSON and editor.
                </p>
                <div className="section-visibility-grid">
                  {[
                    { key: 'profile', label: 'Profile summary' },
                    { key: 'employment', label: 'Employment history' },
                    { key: 'education', label: 'Education' },
                    { key: 'references', label: 'References' },
                    { key: 'availability', label: 'Salary & availability' },
                    { key: 'languages', label: 'Languages' },
                    ...((data.skillSections || []).map((sec) => ({
                      key: sec.id,
                      label: sec.title || 'Skills section',
                    }))),
                    { key: 'certifications', label: 'Certificates' },
                    { key: 'sabbatical', label: 'Notes / sabbatical' },
                  ].map(({ key, label }) => {
                    const skillSec = (data.skillSections || []).find((s) => s.id === key);
                    return (
                    <div key={key} className="section-visibility-row">
                      <span>{label}</span>
                      <VisibilityToggle
                        visible={
                          skillSec
                            ? isSkillSectionVisible(data.sections, skillSec)
                            : isSectionVisible(data.sections, key)
                        }
                        onChange={(v) => {
                          if (skillSec) {
                            updateSkillSection(key, 'visible', v);
                            setSectionVisibility(key, v);
                          } else {
                            setSectionVisibility(key, v);
                          }
                        }}
                        title={`${label} on CV`}
                      />
                    </div>
                    );
                  })}
                </div>
              </div>
              {/* Canva-like Fine Tuning panel */}
              <div className="section-card" style={{ borderLeft: '3px solid var(--accent-ui)' }}>
                <h2 style={{ fontSize: '0.85rem', color: '#a5b4fc', marginBottom: '12px', fontWeight: 800 }}>🎨 Canva Fine-Tuning Controls</h2>
                <div className="fine-tune-controls-grid">
                  <div className="form-group fine-tune-slider-group">
                    <div className="fine-tune-slider-head">
                      <label htmlFor="typo-scale-range">Typography Scale</label>
                      <span className="fine-tune-slider-value">{typoScaleLabel(fontSizeRatio)}</span>
                    </div>
                    <input
                      id="typo-scale-range"
                      type="range"
                      className="fine-tune-range"
                      min={TYPO_SCALE_MIN}
                      max={TYPO_SCALE_MAX}
                      step={TYPO_SCALE_STEP}
                      value={parseTypoPercent(fontSizeRatio)}
                      onChange={(e) => setFontSizeRatio(formatTypoPercent(e.target.value))}
                      aria-valuemin={TYPO_SCALE_MIN}
                      aria-valuemax={TYPO_SCALE_MAX}
                      aria-valuenow={parseTypoPercent(fontSizeRatio)}
                      aria-valuetext={typoScaleLabel(fontSizeRatio)}
                    />
                    <div className="fine-tune-range-ticks" aria-hidden="true">
                      <span>{TYPO_SCALE_MIN}%</span>
                      <span>100%</span>
                      <span>{TYPO_SCALE_MAX}%</span>
                    </div>
                  </div>
                  <div className="form-group fine-tune-slider-group">
                    <div className="fine-tune-slider-head">
                      <label htmlFor="line-spacing-range">Line Spacing</label>
                      <span className="fine-tune-slider-value">{lineSpacingLabel(spacingFactor)}</span>
                    </div>
                    <input
                      id="line-spacing-range"
                      type="range"
                      className="fine-tune-range"
                      min={LINE_SPACING_MIN}
                      max={LINE_SPACING_MAX}
                      step={LINE_SPACING_STEP}
                      value={parseSpacingFactor(spacingFactor)}
                      onChange={(e) => setSpacingFactor(formatSpacingFactor(e.target.value))}
                      aria-valuemin={LINE_SPACING_MIN}
                      aria-valuemax={LINE_SPACING_MAX}
                      aria-valuenow={parseSpacingFactor(spacingFactor)}
                      aria-valuetext={lineSpacingLabel(spacingFactor)}
                    />
                    <div className="fine-tune-range-ticks" aria-hidden="true">
                      <span>{LINE_SPACING_MIN}</span>
                      <span>1.0</span>
                      <span>{LINE_SPACING_MAX}</span>
                    </div>
                  </div>
                  <div className="form-group fine-tune-texture-group">
                    <label htmlFor="paper-texture-select">Paper Texture</label>
                    <select
                      id="paper-texture-select"
                      value={paperTexture}
                      onChange={(e) => setPaperTexture(e.target.value)}
                    >
                      <option value="none">Smooth Matte</option>
                      <option value="oatmeal-fiber">Oatmeal Fiber</option>
                      <option value="grid-blueprint">Grid Blueprint</option>
                      <option value="linear-corduroy">Linear Corduroy</option>
                    </select>
                  </div>
                </div>

                <h3 style={{ fontSize: '0.78rem', color: '#a5b4fc', marginBottom: '8px', fontWeight: 700 }}>Custom Palette Overrides</h3>
                <p className="sortable-list-hint" style={{ marginTop: 0, marginBottom: '10px' }}>Each control maps to one element only. Per-job Job Title override: Work tab.</p>

                {CV_COLOR_GROUPS.map((group) => (
                  <div key={group.id}>
                    <p className="color-group-label">{group.label}</p>
                    <div className={`color-picker-grid${group.fields.length <= 2 ? ' color-picker-grid--pair' : ''}`}>
                      {group.fields.map((field) => (
                        <div key={field.key} className="form-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontSize: '0.7rem' }}>{field.label}</label>
                          <input
                            type="color"
                            value={colorOverrides[field.key] || field.default}
                            onChange={(e) => setColorOverride(field.key, e.target.value)}
                            style={{ padding: '2px', height: '32px', cursor: 'pointer', width: '100%' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {hasAnyColorOverride(colorOverrides) && (
                  <button className="btn btn-danger" style={{ marginTop: '12px', width: '100%', padding: '4px' }} onClick={resetColorOverrides}>
                    Reset Color Overrides to Preset Default
                  </button>
                )}
              </div>

              <div className="section-card">
                <div className="section-title-bar">
                  <h2>Personal Information</h2>
                </div>
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={data.personal.name} onChange={e => handlePersonalChange('name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Professional Sub-title</label>
                  <input type="text" value={data.personal.title} onChange={e => handlePersonalChange('title', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" value={data.personal.email} onChange={e => handlePersonalChange('email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Contact Phone</label>
                  <input type="text" value={data.personal.phone} onChange={e => handlePersonalChange('phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Location Address</label>
                  <input type="text" value={data.personal.address} onChange={e => handlePersonalChange('address', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>LinkedIn URL</label>
                  <input type="text" value={data.personal.links && data.personal.links[0] ? data.personal.links[0].url : ''} onChange={e => {
                    const newLinks = [...(data.personal.links || [])];
                    if (newLinks[0]) {
                      newLinks[0].url = e.target.value;
                    } else {
                      newLinks.push({ label: 'LinkedIn', url: e.target.value });
                    }
                    handlePersonalChange('links', newLinks);
                  }} />
                </div>
                <div className="form-group">
                  <label>Upload Profile Photo</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ padding: '6px' }} />
                  <p className="sortable-list-hint" style={{ marginTop: '6px' }}>
                    Photos are auto-compressed (max 400px edge) to keep PDF exports under 5MB.
                    {data.personal.photo ? ` Current size: ${formatPhotoSizeLabel(data.personal.photo)}.` : ''}
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Photo Frame</label>
                      <select value={photoFrameStyle} onChange={(e) => setPhotoFrameStyle(e.target.value)}>
                        <option value="preset">Follow Preset Default</option>
                        <option value="circle">Circle</option>
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                        <option value="arch">Arch</option>
                        <option value="thin-ring">Thin Ring</option>
                      </select>
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <label style={{ marginBottom: 0 }}>Photo Size</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-ui)' }}>
                          {Math.round(parseFloat(photoScale) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        className="fine-tune-range"
                        min="0.5"
                        max="1.8"
                        step="0.05"
                        value={parseFloat(photoScale)}
                        onChange={(e) => setPhotoScale(e.target.value)}
                        style={{ display: 'block', width: '100%', height: '6px', margin: 0, padding: 0, cursor: 'pointer' }}
                      />
                      <div className="fine-tune-range-ticks" aria-hidden="true" style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: '#64748b' }}>
                        <span>50%</span>
                        <span>100%</span>
                        <span>180%</span>
                      </div>
                    </div>
                  </div>
                  {data.personal.photo && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <div
                        className="editor-photo-preview-wrap"
                        data-photo-frame={photoFrameStyle}
                        style={{
                          '--cv-photo-scale': photoScale,
                          '--cv-accent': colorOverrides.accent || '#2563eb',
                          '--cv-primary': colorOverrides.sectionTitle || '#0f172a',
                          '--cv-bg': colorOverrides.paperBg || '#ffffff',
                          '--cv-border': '#e2e8f0',
                        }}
                      >
                        <img
                          src={data.personal.photo}
                          alt="Photo preview"
                          className={getPhotoClassName('header')}
                        />
                      </div>
                      <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => handlePersonalChange('photo', '')}>Remove Photo</button>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label>Professional Profile Summary</label>
                  <p className="sortable-list-hint" style={{ marginTop: 0 }}>
                    One bullet per line. The preview matches this list; press Enter for a new point.
                  </p>
                  <textarea
                    rows={Math.max(6, getProfilePoints(data.personal.summary).length + 1)}
                    className="profile-summary-editor"
                    value={data.personal.summary}
                    onChange={(e) => handlePersonalChange('summary', e.target.value)}
                    placeholder={'e.g.\nProfessional Scrum Master with 10+ years PM experience.\nPragmatic stakeholder coordination across enterprise clients.'}
                  />
                  <p className="sortable-list-hint">
                    {getProfilePoints(data.personal.summary).length} point(s) · Paste a paragraph, then use Split by Sentences
                  </p>
                  <button
                    type="button"
                    className="btn"
                    style={{ marginTop: '6px' }}
                    onClick={() => handlePersonalChange('summary', normalizeSummaryStorage(data.personal.summary))}
                  >
                    Split by Sentences
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Employment History & Projects */}
          {activeTab === 'employment' && (
            <div className="section-card">
              <div className="section-title-bar">
                <h2>Work Experience</h2>
                <button className="btn btn-primary" onClick={addEmployment}>+ Add Job</button>
              </div>
              <p className="sortable-list-hint">Drag ⋮⋮ to reorder jobs, bullets, and projects</p>
              <div className="sortable-list">
              {data.employment.map((emp, empIdx) => (
                <div
                  key={emp.id}
                  className={`${sort.itemClassName('employment', empIdx)}${isVisible(emp) ? '' : ' editor-item--hidden'}`}
                  {...sort.containerProps('employment', empIdx)}
                >
                  <SortableToolbar
                    index={empIdx}
                    handleProps={sort.handleProps('employment', empIdx, reorderEmployment)}
                  >
                    <VisibilityToggle
                      visible={emp.visible}
                      onChange={(v) => updateEmployment(emp.id, 'visible', v)}
                    />
                    <button className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => removeEmployment(emp.id)}>✕ Delete</button>
                  </SortableToolbar>
                  <div className="form-group">
                    <label>Company Name</label>
                    <input
                      type="text"
                      value={emp.company}
                      onChange={e => updateEmployment(emp.id, 'company', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label>Job Title Color</label>
                    <div className="form-inline-color">
                      <input
                        type="color"
                        title="Job title color for this position"
                        value={emp.jobTitleColor || colorOverrides.jobTitle || '#0f172a'}
                        onChange={e => updateEmployment(emp.id, 'jobTitleColor', e.target.value)}
                      />
                      {emp.jobTitleColor ? (
                        <button
                          type="button"
                          className="btn"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', flexShrink: 0 }}
                          onClick={() => updateEmployment(emp.id, 'jobTitleColor', '')}
                        >
                          Use global default
                        </button>
                      ) : (
                        <span className="sortable-list-hint" style={{ margin: 0 }}>Uses Design → Job Title Color</span>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{usesMultiRoleDisplay(emp) ? 'Overall Tenure at Company' : 'Time Duration (e.g. Mar 2023 - May 2025)'}</label>
                    <input type="text" value={emp.period} onChange={e => updateEmployment(emp.id, 'period', e.target.value)} />
                  </div>
                  {!usesMultiRoleDisplay(emp) && (
                    <div className="form-group">
                      <label>Role / Position Title</label>
                      <input type="text" value={emp.role} onChange={e => updateEmployment(emp.id, 'role', e.target.value)} />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Sub-Description (e.g. Interactive Projects)</label>
                    <input type="text" value={emp.subtext} onChange={e => updateEmployment(emp.id, 'subtext', e.target.value)} />
                  </div>

                  <div className="nested-form-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>Positions at this Company</label>
                      <button className="btn" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => addEmpRole(emp.id)}>+ Add Role</button>
                    </div>
                    {hasStructuredRoles(emp) && (
                      <label className="employment-split-toggle" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.8rem', color: 'var(--text-ui-secondary)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={emp.splitRoles !== false}
                          onChange={(e) => updateEmployment(emp.id, 'splitRoles', e.target.checked)}
                          style={{ width: 'auto' }}
                        />
                        Show each position separately on CV (split roles)
                      </label>
                    )}
                    <p className="sortable-list-hint" style={{ marginTop: 0 }}>
                      {usesMultiRoleDisplay(emp)
                        ? 'Each role appears with its own title and dates on the CV. Shared achievements stay in Key Responsibilities below.'
                        : 'Roles are stored here for your records but the CV shows a single title and period above. Uncheck split to keep this layout.'}
                    </p>
                    {(emp.roles || []).length > 0 && (
                      <div className="nested-sortable-list">
                        {(emp.roles || []).map((role, roleIdx) => (
                          <div
                            key={role.id}
                            className={`${sort.itemClassName(`roles-${emp.id}`, roleIdx, 'dynamic-item sortable-nested-role')}${isVisible(role) ? '' : ' editor-item--hidden'}`}
                            {...sort.containerProps(`roles-${emp.id}`, roleIdx)}
                          >
                            <SortableToolbar
                              index={roleIdx}
                              handleProps={sort.handleProps(`roles-${emp.id}`, roleIdx, (from, to) => reorderEmpRoles(emp.id, from, to))}
                            >
                              <VisibilityToggle
                                visible={role.visible}
                                onChange={(v) => updateEmpRole(emp.id, role.id, 'visible', v)}
                              />
                              <button className="btn btn-danger" style={{ padding: '2px 4px', fontSize: '0.65rem' }} onClick={() => removeEmpRole(emp.id, role.id)}>Delete</button>
                            </SortableToolbar>
                            <div className="form-group" style={{ marginBottom: '6px' }}>
                              <label>Role Title</label>
                              <input type="text" value={role.title} onChange={(e) => updateEmpRole(emp.id, role.id, 'title', e.target.value)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: '6px' }}>
                              <label>Role Period</label>
                              <input type="text" value={role.period} onChange={(e) => updateEmpRole(emp.id, role.id, 'period', e.target.value)} />
                            </div>
                            <div className="nested-form-list" style={{ marginTop: '8px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94a3b8' }}>Role-specific bullets (optional)</label>
                                <button className="btn" style={{ padding: '2px 6px', fontSize: '0.65rem' }} onClick={() => addRoleBullet(emp.id, role.id)}>+ Bullet</button>
                              </div>
                              {(role.bullets || []).map((bullet, bIdx) => (
                                <div
                                  key={bullet.id || `${role.id}-b-${bIdx}`}
                                  className={`${sort.itemClassName(`role-bullets-${role.id}`, bIdx, 'sortable-inline-row')}${isVisible(bullet) ? '' : ' editor-item--hidden'}`}
                                  {...sort.containerProps(`role-bullets-${role.id}`, bIdx)}
                                >
                                  <button {...sort.handleProps(`role-bullets-${role.id}`, bIdx, (from, to) => reorderRoleBullets(emp.id, role.id, from, to))}>⋮⋮</button>
                                  <VisibilityToggle
                                    visible={isVisible(bullet)}
                                    onChange={(v) => updateRoleBulletVisible(emp.id, role.id, bIdx, v)}
                                  />
                                  <input type="text" value={bulletText(bullet)} onChange={(e) => updateRoleBullet(emp.id, role.id, bIdx, e.target.value)} style={{ flexGrow: 1 }} />
                                  <button className="btn btn-danger" style={{ padding: '4px' }} onClick={() => removeRoleBullet(emp.id, role.id, bIdx)}>✕</button>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Bullet points */}
                  <div className="nested-form-list">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>
                        {usesMultiRoleDisplay(emp) ? 'Shared Responsibilities & Achievements' : 'Key Responsibilities'}
                      </label>
                      <button className="btn" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => addBullet(emp.id)}>+ Add Bullet</button>
                    </div>
                    <div className="nested-sortable-list">
                    {emp.bullets.map((bullet, idx) => (
                      <div
                        key={bullet.id || `${emp.id}-bullet-${idx}`}
                        className={`${sort.itemClassName(`bullets-${emp.id}`, idx, 'sortable-inline-row')}${isVisible(bullet) ? '' : ' editor-item--hidden'}`}
                        {...sort.containerProps(`bullets-${emp.id}`, idx)}
                      >
                        <button {...sort.handleProps(`bullets-${emp.id}`, idx, (from, to) => reorderEmpBullets(emp.id, from, to))}>⋮⋮</button>
                        <VisibilityToggle
                          visible={isVisible(bullet)}
                          onChange={(v) => updateEmpBulletVisible(emp.id, idx, v)}
                        />
                        <input type="text" value={bulletText(bullet)} onChange={e => updateBullet(emp.id, idx, e.target.value)} style={{ flexGrow: 1 }} />
                        <button className="btn btn-danger" style={{ padding: '4px' }} onClick={() => removeBullet(emp.id, idx)}>✕</button>
                      </div>
                    ))}
                    </div>
                  </div>

                  {/* Projects List nested under this employment */}
                  <div className="nested-form-list" style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>Project Deliveries</label>
                      <button className="btn" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => addProject(emp.id)}>+ Add Project</button>
                    </div>
                    <div className="nested-sortable-list">
                    {emp.projects && emp.projects.map((proj, idx) => (
                      <div
                        key={proj.id || `${emp.id}-proj-${idx}`}
                        className={`${sort.itemClassName(`projects-${emp.id}`, idx, 'dynamic-item sortable-nested-project')}${isVisible(proj) ? '' : ' editor-item--hidden'}`}
                        {...sort.containerProps(`projects-${emp.id}`, idx)}
                      >
                        <SortableToolbar
                          index={idx}
                          handleProps={sort.handleProps(`projects-${emp.id}`, idx, (from, to) => reorderEmpProjects(emp.id, from, to))}
                        >
                          <VisibilityToggle
                            visible={proj.visible}
                            onChange={(v) => updateProjectVisible(emp.id, idx, v)}
                          />
                          <button className="btn btn-danger" style={{ padding: '2px 4px', fontSize: '0.65rem' }} onClick={() => removeProject(emp.id, idx)}>Delete</button>
                        </SortableToolbar>
                        <div className="form-group" style={{ marginBottom: '6px' }}>
                          <input type="text" placeholder="Project Year" value={proj.year} onChange={e => updateProject(emp.id, idx, 'year', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '6px' }}>
                          <input type="text" placeholder="Project Title" value={proj.title} onChange={e => updateProject(emp.id, idx, 'title', e.target.value)} />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0' }}>
                          <input type="text" placeholder="Project Brief" value={proj.description} onChange={e => updateProject(emp.id, idx, 'description', e.target.value)} />
                        </div>
                      </div>
                    ))}
                    </div>
                  </div>
                </div>
              ))}
              </div>
            </div>
          )}

          {/* TAB 3: Skills & Languages */}
          {activeTab === 'skills' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="section-card">
                <h2 style={{ marginTop: 0 }}>Skills display</h2>
                <label className="editor-toggle-row" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={showSkillRatings}
                    onChange={(e) => setShowSkillRatings(e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <span>
                    <strong>Show skill ratings on CV</strong>
                    <span style={{ display: 'block', fontSize: '0.85em', color: 'var(--text-muted, #94a3b8)', marginTop: '4px', fontWeight: 400 }}>
                      Only skills you rate below (1–5) show dots on the preview. Unrated skills stay as plain names. Set ratings after entering comma-separated skill tags.
                    </span>
                  </span>
                </label>
              </div>

              <div className="section-card">
                <div className="section-title-bar">
                  <h2 style={{ marginTop: 0 }}>Sidebar section order</h2>
                  <button className="btn btn-primary" onClick={addSkillSection}>+ Add Section</button>
                </div>
                <p className="sortable-list-hint" style={{ marginTop: 0 }}>
                  Drag ⋮⋮ to reorder Languages, skill sections, and Certificates on the right column. Use + Add Section for more skill blocks.
                </p>
                <div className="sortable-list">
                  {normalizeSidebarSectionOrder(data.sidebarSectionOrder, data.skillSections).map((key, idx) => (
                    <div
                      key={key}
                      className={sort.itemClassName('sidebarSectionOrder', idx, 'dynamic-item sortable-lang-card')}
                      {...sort.containerProps('sidebarSectionOrder', idx)}
                    >
                      <SortableToolbar
                        index={idx}
                        handleProps={sort.handleProps('sidebarSectionOrder', idx, reorderSidebarSections)}
                      >
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted, #94a3b8)' }}>
                          {sidebarSectionLabel(key, data.skillSections)}
                        </span>
                      </SortableToolbar>
                    </div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="section-card">
                <div className="section-title-bar">
                  <h2>Languages</h2>
                  <button className="btn btn-primary" onClick={addLanguage}>+ Add Language</button>
                </div>
                <p className="sortable-list-hint">Drag ⋮⋮ to reorder languages</p>
                <div className="sortable-list">
                {data.languages && data.languages.map((lang, idx) => (
                  <div
                    key={lang.id || idx}
                    className={`${sort.itemClassName('languages', idx, 'dynamic-item sortable-lang-card')}${isVisible(lang) ? '' : ' editor-item--hidden'}`}
                    {...sort.containerProps('languages', idx)}
                  >
                    <SortableToolbar
                      index={idx}
                      handleProps={sort.handleProps('languages', idx, reorderLanguages)}
                    >
                      <VisibilityToggle
                        visible={lang.visible}
                        onChange={(v) => setData((prev) => ({
                          ...prev,
                          languages: prev.languages.map((l, i) => (i === idx ? { ...l, visible: v } : l)),
                        }))}
                      />
                      <button className="btn btn-danger" style={{ padding: '6px 10px' }} onClick={() => removeLanguage(idx)}>✕</button>
                    </SortableToolbar>
                    <div className="sortable-lang-fields">
                      <input
                        type="text"
                        className="sortable-lang-name"
                        placeholder="Language"
                        value={lang.name}
                        onChange={e => updateLanguageName(idx, e.target.value)}
                      />
                      <select
                        className="sortable-lang-level"
                        value={lang.level}
                        onChange={e => updateLanguageLevel(idx, e.target.value)}
                      >
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Professional">Professional / Higher</option>
                        <option value="Conversational">Conversational / Intermediate</option>
                        <option value="Basic">Basic</option>
                        <option value="Elementary">Elementary</option>
                      </select>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* Skill sections + subcategories */}
              {(data.skillSections || []).map((section) => (
                <div key={section.id} className="section-card">
                  <div className="section-title-bar">
                    <h2>{section.title || 'Skills section'}</h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <VisibilityToggle
                        visible={isSkillSectionVisible(data.sections, section)}
                        onChange={(v) => {
                          updateSkillSection(section.id, 'visible', v);
                          setSectionVisibility(section.id, v);
                        }}
                        title={`${section.title} on CV`}
                      />
                      <button className="btn btn-primary" onClick={() => addSkillCategory(section.id)}>
                        + Add Subcategory
                      </button>
                      {(data.skillSections || []).length > 1 && (
                        <button
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => removeSkillSection(section.id)}
                        >
                          Delete section
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Section Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={(e) => updateSkillSection(section.id, 'title', e.target.value)}
                      placeholder="Section title"
                    />
                  </div>
                  <p className="sortable-list-hint">Drag ⋮⋮ to reorder subcategories</p>
                  <div className="sortable-list">
                    {(section.categories || []).map((skill, idx) => (
                      <div
                        key={skill.id || idx}
                        className={`${sort.itemClassName(`skillcats_${section.id}`, idx)}${isVisible(skill) ? '' : ' editor-item--hidden'}`}
                        {...sort.containerProps(`skillcats_${section.id}`, idx)}
                      >
                        <SortableToolbar
                          index={idx}
                          handleProps={sort.handleProps(
                            `skillcats_${section.id}`,
                            idx,
                            (from, to) => reorderSkillCategories(section.id, from, to),
                          )}
                        >
                          <VisibilityToggle
                            visible={skill.visible}
                            onChange={(v) => updateSkillCategory(section.id, idx, 'visible', v)}
                          />
                          <button
                            className="btn btn-danger"
                            style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                            onClick={() => removeSkillCategory(section.id, idx)}
                          >
                            ✕ Delete
                          </button>
                        </SortableToolbar>
                        <div className="form-group">
                          <label>Subcategory Title</label>
                          <input
                            type="text"
                            value={skill.category}
                            onChange={(e) => updateSkillCategory(section.id, idx, 'category', e.target.value)}
                            placeholder="Subcategory"
                          />
                        </div>
                        <div className="form-group">
                          <label>Skill Tags (Comma-separated)</label>
                          <input
                            type="text"
                            value={skill.itemsText != null ? skill.itemsText : (skill.items || []).join(', ')}
                            onChange={(e) => updateSkillItemsText(section.id, idx, e.target.value)}
                            onBlur={() => commitSkillItems(section.id, idx)}
                            placeholder="Scrum, PMO, Logistics"
                          />
                        </div>
                        {showSkillRatings && parseSkillItems(skill).length > 0 && (
                          <div className="form-group skill-ratings-editor">
                            <label>Skill ratings (1–5, optional per skill)</label>
                            <p className="sortable-list-hint" style={{ marginTop: 0 }}>
                              Leave as &quot;No rating&quot; to hide dots for that skill on the CV.
                            </p>
                            <ul className="skill-ratings-list">
                              {getSkillEntries(skill).map((entry, ri) => (
                                <li key={ri} className="skill-ratings-row">
                                  <span className="skill-ratings-name">{entry.name}</span>
                                  <select
                                    className="skill-ratings-select"
                                    value={entry.rating || 0}
                                    onChange={(e) => updateSkillItemRating(section.id, idx, ri, e.target.value)}
                                    aria-label={`Rating for ${entry.name}`}
                                  >
                                    <option value={0}>No rating</option>
                                    <option value={1}>1 / 5</option>
                                    <option value={2}>2 / 5</option>
                                    <option value={3}>3 / 5</option>
                                    <option value={4}>4 / 5</option>
                                    <option value={5}>5 / 5</option>
                                  </select>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: Certifications & Sabbaticals */}
          {activeTab === 'other' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Certifications */}
              <div className="section-card">
                <div className="section-title-bar">
                  <h2>Certificates & Licenses</h2>
                  <button className="btn btn-primary" onClick={addCert}>+ Add</button>
                </div>
                <p className="sortable-list-hint">Drag ⋮⋮ to reorder certificates</p>
                <div className="sortable-list">
                  {data.certifications.map((cert, idx) => (
                    <div
                      key={cert.id || idx}
                      className={`${sort.itemClassName('certifications', idx)}${isVisible(cert) ? '' : ' editor-item--hidden'}`}
                      {...sort.containerProps('certifications', idx)}
                    >
                      <SortableToolbar
                        index={idx}
                        handleProps={sort.handleProps('certifications', idx, reorderCertifications)}
                      >
                        <VisibilityToggle
                          visible={cert.visible}
                          onChange={(v) => updateCert(idx, 'visible', v)}
                        />
                        <button
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => removeCert(idx)}
                        >
                          Delete
                        </button>
                      </SortableToolbar>
                      <div className="form-group">
                        <label>Certificate Title</label>
                        <input type="text" value={cert.name} onChange={e => updateCert(idx, 'name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Issuer / Body</label>
                        <input type="text" value={cert.issuer} onChange={e => updateCert(idx, 'issuer', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Date / Validity Info</label>
                        <input type="text" value={cert.date} onChange={e => updateCert(idx, 'date', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Verification URL (optional)</label>
                      <input
                        type="text"
                        value={cert.url || ''}
                        onChange={e => updateCert(idx, 'url', e.target.value)}
                        placeholder="www.scrum.org/certificates/... (https:// added automatically)"
                      />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="section-card">
                <div className="section-title-bar">
                  <h2>Education</h2>
                  <button className="btn btn-primary" onClick={addEducation}>+ Add Entry</button>
                </div>
                <p className="sortable-list-hint">Drag ⋮⋮ to reorder entries and bullet points</p>
                <div className="sortable-list">
                  {(data.education || []).map((edu, eduIdx) => (
                    <div
                      key={edu.id}
                      className={`${sort.itemClassName('education', eduIdx)}${isVisible(edu) ? '' : ' editor-item--hidden'}`}
                      {...sort.containerProps('education', eduIdx)}
                    >
                      <SortableToolbar
                        index={eduIdx}
                        handleProps={sort.handleProps('education', eduIdx, reorderEducation)}
                      >
                        <VisibilityToggle
                          visible={edu.visible}
                          onChange={(v) => updateEducation(edu.id, 'visible', v)}
                        />
                        <button
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => removeEducation(edu.id)}
                        >
                          Delete
                        </button>
                      </SortableToolbar>
                      <div className="form-group">
                        <label>Degree / Qualification</label>
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => updateEducation(edu.id, 'degree', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Institution</label>
                        <input
                          type="text"
                          value={edu.school}
                          onChange={(e) => updateEducation(edu.id, 'school', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Period (e.g. Sep 2007 - June 2010)</label>
                        <input
                          type="text"
                          value={edu.period}
                          onChange={(e) => updateEducation(edu.id, 'period', e.target.value)}
                        />
                      </div>
                      <div className="nested-form-list">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#a5b4fc' }}>Details / Grades</label>
                          <button className="btn" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={() => addEduBullet(edu.id)}>+ Add Bullet</button>
                        </div>
                        <div className="nested-sortable-list">
                          {(edu.bullets || []).map((bullet, idx) => (
                            <div
                              key={bullet.id || `${edu.id}-bullet-${idx}`}
                              className={`${sort.itemClassName(`edu-bullets-${edu.id}`, idx, 'sortable-inline-row')}${isVisible(bullet) ? '' : ' editor-item--hidden'}`}
                              {...sort.containerProps(`edu-bullets-${edu.id}`, idx)}
                            >
                              <button {...sort.handleProps(`edu-bullets-${edu.id}`, idx, (from, to) => reorderEduBullets(edu.id, from, to))}>⋮⋮</button>
                              <VisibilityToggle
                                visible={isVisible(bullet)}
                                onChange={(v) => updateEduBulletVisible(edu.id, idx, v)}
                              />
                              <input
                                type="text"
                                value={bulletText(bullet)}
                                onChange={(e) => updateEduBullet(edu.id, idx, e.target.value)}
                                style={{ flexGrow: 1 }}
                              />
                              <button className="btn btn-danger" style={{ padding: '4px' }} onClick={() => removeEduBullet(edu.id, idx)}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* References */}
              <div className="section-card">
                <div className="section-title-bar">
                  <h2>References</h2>
                  <button className="btn btn-primary" onClick={addReference}>+ Add Contact</button>
                </div>
                <p className="sortable-list-hint">Drag ⋮⋮ to reorder reference contacts</p>
                <div className="sortable-list">
                  {(data.references || []).map((ref, idx) => (
                    <div
                      key={ref.id || idx}
                      className={`${sort.itemClassName('references', idx)}${isVisible(ref) ? '' : ' editor-item--hidden'}`}
                      {...sort.containerProps('references', idx)}
                    >
                      <SortableToolbar
                        index={idx}
                        handleProps={sort.handleProps('references', idx, reorderReferences)}
                      >
                        <VisibilityToggle
                          visible={ref.visible}
                          onChange={(v) => updateReference(idx, 'visible', v)}
                        />
                        <button
                          className="btn btn-danger"
                          style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                          onClick={() => removeReference(idx)}
                        >
                          Delete
                        </button>
                      </SortableToolbar>
                      <div className="form-group">
                        <label>Name</label>
                        <input type="text" value={ref.name} onChange={(e) => updateReference(idx, 'name', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Title / Relationship</label>
                        <input type="text" value={ref.title} onChange={(e) => updateReference(idx, 'title', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Company / Organisation</label>
                        <input type="text" value={ref.company} onChange={(e) => updateReference(idx, 'company', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Phone</label>
                        <input type="text" value={ref.phone} onChange={(e) => updateReference(idx, 'phone', e.target.value)} />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Email</label>
                        <input type="text" value={ref.email} onChange={(e) => updateReference(idx, 'email', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Salary & availability */}
              <div className="section-card">
                <div className="section-title-bar">
                  <h2>Expected Salary &amp; Availability</h2>
                </div>
                <p className="sortable-list-hint" style={{ marginTop: 0, marginBottom: '12px' }}>
                  Each line has its own On CV toggle. Use Section Visibility above for the whole block.
                </p>
                {AVAILABILITY_FIELD_DEFS.map((field, idx) => {
                  const visKey = availabilityFieldVisibleKey(field.key);
                  const fieldOn = data.availability?.[visKey] !== false;
                  return (
                    <div
                      key={field.key}
                      className={`form-group availability-field-group${fieldOn ? '' : ' availability-field-group--off'}`}
                      style={{ marginBottom: idx === AVAILABILITY_FIELD_DEFS.length - 1 ? 0 : undefined }}
                    >
                      <div className="availability-field-head">
                        <label htmlFor={`availability-${field.key}`}>{field.label}</label>
                        <VisibilityToggle
                          visible={data.availability?.[visKey]}
                          onChange={(v) => updateAvailability(visKey, v)}
                        />
                      </div>
                      <input
                        id={`availability-${field.key}`}
                        type="text"
                        value={data.availability?.[field.key] || ''}
                        onChange={(e) => updateAvailability(field.key, e.target.value)}
                        placeholder={field.placeholder}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Sabbatical */}
              <div className="section-card">
                <div className="section-title-bar">
                  <h2>Sabbatical & Custom Notes</h2>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-ui-secondary)', cursor: 'pointer' }}>
                      <input type="checkbox" checked={data.sabbatical.enabled} onChange={e => setData(prev => ({ ...prev, sabbatical: { ...prev.sabbatical, enabled: e.target.checked } }))} style={{ marginRight: '6px', width: 'auto' }} />
                      Enable Note Box
                    </label>
                    <button className="btn" style={{ padding: '2px 6px', fontSize: '0.7rem' }} onClick={addSabbaticalBullet}>+ Add Note</button>
                  </div>
                </div>
                {data.sabbatical.enabled && (
                  <>
                    <p className="sortable-list-hint">Drag ⋮⋮ to reorder notes</p>
                    <div className="nested-sortable-list">
                    {data.sabbatical.bullets.map((bullet, idx) => (
                      <div
                        key={`sabb-${idx}`}
                        className={sort.itemClassName('sabbatical-bullets', idx, 'sortable-inline-row')}
                        {...sort.containerProps('sabbatical-bullets', idx)}
                      >
                        <button {...sort.handleProps('sabbatical-bullets', idx, reorderSabbaticalBullets)}>⋮⋮</button>
                        <input type="text" value={bullet} onChange={e => handleSabbaticalBulletChange(idx, e.target.value)} style={{ flexGrow: 1 }} />
                        <button className="btn btn-danger" style={{ padding: '4px' }} onClick={() => removeSabbaticalBullet(idx)}>✕</button>
                      </div>
                    ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <footer className="editor-foot">
          <p className="foot-copy">© 2026 <strong>Kanaoda</strong> · CreatCV</p>
          <p className="foot-links">
            <a href="https://github.com/Kanaoda/CreatCV" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://buymeacoffee.com/kanaoda" target="_blank" rel="noopener noreferrer">Support</a>
            <a href="https://github.com/sponsors/Kanaoda" target="_blank" rel="noopener noreferrer">Sponsors</a>
          </p>
          <p className="foot-privacy">Like it? Support this project.</p>
        </footer>
      </div>

      {/* RIGHT: Live Preview Workspace */}
      <div className="preview-panel">

        {/* Dynamic A4 Preview Sheet */}
        <div className="cv-page-container">
          <div
            className={`cv-page ${template.layoutClass}`}
            data-template-id={template.templateId}
            data-preset={template.templateId}
            data-archetype={template.archetype}
            data-layout-family={template.layoutFamily}
            data-lang-style={template.langStyle}
            data-photo-placement={template.photoPlacement}
            data-photo-shape={template.photoShape}
            data-photo-frame={photoFrameStyle}
            data-layout-id={template.layout?.id}
            data-skill-ratings={showSkillRatings ? 'on' : 'off'}
            style={cvDynamicStyles}
            data-texture={paperTexture}
          >
            {/* Paper texture only when enabled — mix-blend-mode rasterizes PDF text if always mounted */}
            {paperTexture !== 'none' && <div className="cv-page-texture"></div>}

            {/* Dynamic A4 Page Break Indicators (Screen-only) */}
            {dividers.map((top, idx) => (
              <div key={idx} className="page-break-indicator" style={{ top: `${top}px` }}>
                <span>A4 PAGE {idx + 1} BREAK (ESTIMATE)</span>
              </div>
            ))}

            {template.usesLegacyPreview ? (
              <LegacyCvPreview
                model={{
                  data,
                  viewMode,
                  colorOverrides,
                  template,
                  visibleEmployment,
                  visibleLanguages,
                  visibleSkills,
                  visibleCerts,
                  visibleEducation,
                  visibleReferences,
                  showAvailabilitySection,
                  getPhotoClassName,
                  renderCertEntry,
                  getLanguagePercentage,
                  normalizeExternalUrl,
                  showSkillRatings,
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
                }}
              />
            ) : template.layout ? (
              <CvLayoutRenderer
                layout={template.layout}
                model={{
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
                  showSkillRatings,
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
                }}
              />
            ) : (
              <LegacyCvPreview
                model={{
                  data,
                  viewMode,
                  colorOverrides,
                  template,
                  visibleEmployment,
                  visibleLanguages,
                  visibleSkills,
                  visibleCerts,
                  visibleEducation,
                  visibleReferences,
                  showAvailabilitySection,
                  getPhotoClassName,
                  renderCertEntry,
                  getLanguagePercentage,
                  normalizeExternalUrl,
                  showSkillRatings,
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
                }}
              />
            )}
          </div>
        </div>

        {/* Floating Control Card (Bottom-Right overlay) */}
        <div className="floating-control-card">
          <div className="control-field control-field--preset">
            <label htmlFor="cv-template-select">Template</label>
            <select
              id="cv-template-select"
              className="control-select control-select--accent"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {listTemplateOptions().map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="control-field control-field--format">
            <label htmlFor="cv-format-select">Output Format</label>
            <select
              id="cv-format-select"
              className="control-select"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="detailed">Detailed CV</option>
              <option value="concise">Concise Resume</option>
              <option value="full-projects">Full CV + Projects (new page)</option>
              <option value="project-list">Project List only</option>
            </select>
          </div>
          <div className="control-bar__exports">
            <button
              type="button"
              className="btn btn-primary btn-export"
              onClick={() => handlePrint(false)}
              title="Standard A4 pages — set Margins to 'None' in print dialog for exact match"
            >
              PDF
            </button>
            <button
              type="button"
              className="btn btn-export"
              onClick={() => handlePrint(true)}
              title="One tall page with no page breaks — good for sharing or scrolling PDFs"
            >
              1-Page
            </button>
            <button type="button" className="btn btn-export" onClick={handleWordExport} title="Download as Word document">
              Word
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Creat CV render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', color: '#f9fafb', background: '#0b0f19', minHeight: '100vh' }}>
          <h1 style={{ marginTop: 0 }}>Creat CV failed to load</h1>
          <p style={{ color: '#a5b4fc' }}>Open DevTools (F12) → Console for details. Try a hard refresh (Ctrl+F5) or restart with <code>npm run dev</code>.</p>
          <pre style={{ background: '#111827', padding: 16, borderRadius: 8, overflow: 'auto', color: '#fca5a5' }}>
            {this.state.error.message}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

const mountEl = document.getElementById('app');
if (!mountEl) {
  throw new Error('Missing #app mount node in index.html');
}

const root = ReactDOM.createRoot(mountEl);
root.render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>,
);
