import React, { useState } from 'react';
import defaultResumeData from '../reference/default_resume.json';
import defaultAppSettings from '../reference/default_app_settings.json';
import { exportToWord } from './docxExporter';
import { reorderArray, useSortableList } from './useSortableList';
import { DEFAULT_TEMPLATE_FILENAME, loadDefaultTemplate } from './resumeDefaults';
import {
  readTemplateIdFromSettings,
  buildAppSettingsExport,
  readShowSkillRatingsFromSettings,
} from './templates/index.js';
import { parseSkillItems } from './cvPreview/helpers.js';
import { normalizeSkillItemRatings } from './cvPreview/skillRatings.js';
import {
  optimizePhotoDataUrl,
  shouldOptimizePhoto,
} from './photoOptimizer';
import {
  buildColorsExportPayload,
  readColorOverridesFromSettings,
} from './cvColorPalette';
import {
  isSectionVisible,
  normalizeBullets,
  patchBulletText,
  patchBulletVisible,
} from './visibility';
import { exportCvToPdf } from './printCv';
import {
  normalizeAvailability,
} from './availabilityFields.js';

// Helper formatters
const formatTypoPercent = (ratio) => `${Math.round(ratio * 100)}%`;
const formatSpacingFactor = (val) => Number(val).toFixed(2);

export function useResumeState(normalizeResumeData) {
  const [data, setData] = useState(() => normalizeResumeData(defaultResumeData));
  const [templateId, setTemplateId] = useState(
    () => readTemplateIdFromSettings(defaultAppSettings),
  );
  const [viewMode, setViewMode] = useState('detailed');
  const [activeTab, setActiveTab] = useState('personal'); // 'personal', 'employment', 'skills', 'other'

  // Advanced customization state (Canva-like custom controls over presets)
  const [fontSizeRatio, setFontSizeRatio] = useState(defaultAppSettings.fontSizeRatio || '100%');
  const [spacingFactor, setSpacingFactor] = useState(defaultAppSettings.spacingFactor || '1.0');
  const [paperTexture, setPaperTexture] = useState(defaultAppSettings.paperTexture || 'none');
  const [photoFrameStyle, setPhotoFrameStyle] = useState(defaultAppSettings.photoFrameStyle || 'preset');
  const [photoScale, setPhotoScale] = useState(defaultAppSettings.photoScale || '1.1');
  const [showSkillRatings, setShowSkillRatings] = useState(
    () => readShowSkillRatingsFromSettings(defaultAppSettings),
  );

  const [colorOverrides, setColorOverrides] = useState(() => readColorOverridesFromSettings(defaultAppSettings));

  const setColorOverride = (key, value) => {
    setColorOverrides((prev) => ({ ...prev, [key]: value }));
  };

  const resetColorOverrides = () => {
    setColorOverrides(readColorOverridesFromSettings({ colors: {} }));
  };

  // Dynamic A4 Page break width and height tracking
  const [pageWidth, setPageWidth] = useState(820);
  const [pageHeight, setPageHeight] = useState(1159);

  const sort = useSortableList();

  // General field handlers
  const handlePersonalChange = (field, value) => {
    setData(prev => ({
      ...prev,
      personal: {
        ...prev.personal,
        [field]: value
      }
    }));
  };

  const applyOptimizedPhoto = async (dataUrl) => {
    const optimized = await optimizePhotoDataUrl(dataUrl);
    handlePersonalChange('photo', optimized);
    return optimized;
  };

  // Photo upload → resize/compress so PDF export does not embed multi‑MB originals
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      applyOptimizedPhoto(reader.result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Employment handlers
  const addEmployment = () => {
    const newEmp = {
      id: 'emp_' + Date.now(),
      company: 'New Company',
      jobTitleColor: '',
      location: 'Location',
      role: 'Role Title',
      period: 'Period',
      subtext: 'Description details',
      visible: true,
      roles: [],
      bullets: [{ id: `bullet_${Date.now()}`, text: 'Key task/achievement 1', visible: true }],
      projects: [],
    };
    setData(prev => ({
      ...prev,
      employment: [...prev.employment, newEmp]
    }));
  };

  const removeEmployment = (id) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.filter(e => e.id !== id)
    }));
  };

  const updateEmployment = (id, field, value) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const addEmpRole = (empId) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => {
        if (e.id !== empId) return e;
        const roles = e.roles || [];
        if (roles.length === 0) {
          return {
            ...e,
            roles: [
              { id: `role_${Date.now()}`, title: e.role || 'Current Role', period: e.period || 'Period', visible: true, bullets: [] },
              { id: `role_${Date.now() + 1}`, title: 'Previous Role', period: 'Earlier period', visible: true, bullets: [] },
            ],
          };
        }
        return {
          ...e,
          roles: [...roles, { id: `role_${Date.now()}`, title: 'Role Title', period: 'Period', visible: true, bullets: [] }],
        };
      }),
    }));
  };

  const removeEmpRole = (empId, roleId) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => (e.id === empId ? {
        ...e,
        roles: (e.roles || []).filter((r) => r.id !== roleId),
      } : e)),
    }));
  };

  const updateEmpRole = (empId, roleId, field, value) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => {
        if (e.id !== empId) return e;
        return {
          ...e,
          roles: (e.roles || []).map((r) => (r.id === roleId ? { ...r, [field]: value } : r)),
        };
      }),
    }));
  };

  const reorderEmpRoles = (empId, fromIndex, toIndex) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => (e.id === empId ? {
        ...e,
        roles: reorderArray(e.roles || [], fromIndex, toIndex),
      } : e)),
    }));
  };

  const addRoleBullet = (empId, roleId) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => {
        if (e.id !== empId) return e;
        return {
          ...e,
          roles: (e.roles || []).map((r) => (r.id === roleId ? {
            ...r,
            bullets: [...(r.bullets || []), { id: `role_bullet_${Date.now()}`, text: '', visible: true }],
          } : r)),
        };
      }),
    }));
  };

  const removeRoleBullet = (empId, roleId, index) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => {
        if (e.id !== empId) return e;
        return {
          ...e,
          roles: (e.roles || []).map((r) => (r.id === roleId ? {
            ...r,
            bullets: r.bullets.filter((_, i) => i !== index),
          } : r)),
        };
      }),
    }));
  };

  const updateRoleBullet = (empId, roleId, index, value) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => e.id !== empId ? e : {
        ...e,
        roles: (e.roles || []).map((r) => r.id !== roleId ? r : {
          ...r,
          bullets: patchBulletText(r.bullets, index, value, `role_bullet_${roleId}`),
        }),
      }),
    }));
  };

  const updateRoleBulletVisible = (empId, roleId, index, visible) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => e.id !== empId ? e : {
        ...e,
        roles: (e.roles || []).map((r) => r.id !== roleId ? r : {
          ...r,
          bullets: patchBulletVisible(r.bullets, index, visible, `role_bullet_${roleId}`),
        }),
      }),
    }));
  };

  const reorderRoleBullets = (empId, roleId, fromIndex, toIndex) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => {
        if (e.id !== empId) return e;
        return {
          ...e,
          roles: (e.roles || []).map((r) => (r.id === roleId ? {
            ...r,
            bullets: reorderArray(r.bullets, fromIndex, toIndex),
          } : r)),
        };
      }),
    }));
  };

  const setSectionVisibility = (key, visible) => {
    setData((prev) => ({
      ...prev,
      sections: { ...prev.sections, [key]: visible },
    }));
  };

  const removeEducation = (id) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.filter((e) => e.id !== id),
    }));
  };

  const reorderSection = (key, fromIndex, toIndex) =>
    setData(prev => ({ ...prev, [key]: reorderArray(prev[key], fromIndex, toIndex) }));

  const addEducation = () => {
    setData((prev) => ({
      ...prev,
      education: [
        ...(prev.education || []),
        {
          id: `edu_${Date.now()}`,
          degree: 'Degree / Qualification',
          school: 'Institution Name',
          period: 'Start - End',
          visible: true,
          bullets: [],
        },
      ],
    }));
  };

  const updateEducation = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === id ? { ...e, [field]: value } : e)),
    }));
  };

  const reorderEducation = (f, t) => reorderSection('education', f, t);

  const addEduBullet = (eduId) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === eduId ? {
        ...e,
        bullets: [...(e.bullets || []), { id: `edu_bullet_${Date.now()}`, text: '', visible: true }],
      } : e)),
    }));
  };

  const removeEduBullet = (eduId, index) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === eduId ? {
        ...e,
        bullets: e.bullets.filter((_, i) => i !== index),
      } : e)),
    }));
  };

  const updateEduBullet = (eduId, index, value) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => e.id !== eduId ? e : {
        ...e,
        bullets: patchBulletText(e.bullets, index, value, `edu_bullet_${eduId}`),
      }),
    }));
  };

  const updateEduBulletVisible = (eduId, index, visible) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => e.id !== eduId ? e : {
        ...e,
        bullets: patchBulletVisible(e.bullets, index, visible, `edu_bullet_${eduId}`),
      }),
    }));
  };

  const reorderEduBullets = (eduId, fromIndex, toIndex) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((e) => (e.id === eduId ? {
        ...e,
        bullets: reorderArray(e.bullets, fromIndex, toIndex),
      } : e)),
    }));
  };

  const updateEmpBulletVisible = (empId, index, visible) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => e.id !== empId ? e : {
        ...e,
        bullets: patchBulletVisible(e.bullets, index, visible, `bullet_${empId}`),
      }),
    }));
  };

  const updateProjectVisible = (empId, projIndex, visible) => {
    setData((prev) => ({
      ...prev,
      employment: prev.employment.map((e) => {
        if (e.id !== empId || !e.projects) return e;
        const projects = [...e.projects];
        projects[projIndex] = { ...projects[projIndex], visible };
        return { ...e, projects };
      }),
    }));
  };

  const updateAvailability = (field, value) => {
    setData((prev) => ({
      ...prev,
      availability: { ...prev.availability, [field]: value },
    }));
  };

  const addReference = () => {
    setData((prev) => ({
      ...prev,
      references: [
        ...(prev.references || []),
        {
          id: `ref_${Date.now()}`,
          name: 'Contact Name',
          title: 'Job Title',
          company: 'Company',
          phone: '',
          email: '',
          visible: true,
        },
      ],
    }));
  };

  const removeReference = (index) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.filter((_, i) => i !== index),
    }));
  };

  const updateReference = (index, field, value) => {
    setData((prev) => ({
      ...prev,
      references: prev.references.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const reorderReferences = (f, t) => reorderSection('references', f, t);

  // Nested bullets
  const addBullet = (empId) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id === empId ? {
        ...e,
        bullets: [...e.bullets, { id: `bullet_${Date.now()}`, text: '', visible: true }],
      } : e)
    }));
  };

  const removeBullet = (empId, index) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id === empId ? { ...e, bullets: e.bullets.filter((_, i) => i !== index) } : e)
    }));
  };

  const updateBullet = (empId, index, value) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id !== empId ? e : {
        ...e,
        bullets: patchBulletText(e.bullets, index, value, `bullet_${empId}`),
      }),
    }));
  };

  // Nested projects inside Employment
  const addProject = (empId) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id === empId ? {
        ...e,
        projects: [...(e.projects || []), {
          id: `proj_${Date.now()}`,
          title: 'Project Title',
          year: 'Year',
          description: '',
          visible: true,
        }],
      } : e)
    }));
  };

  const reorderEmpBullets = (empId, fromIndex, toIndex) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id !== empId
        ? e
        : { ...e, bullets: reorderArray(e.bullets, fromIndex, toIndex) }),
    }));
  };

  const reorderEmpProjects = (empId, fromIndex, toIndex) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id !== empId
        ? e
        : { ...e, projects: reorderArray(e.projects || [], fromIndex, toIndex) }),
    }));
  };

  const removeProject = (empId, index) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => e.id === empId ? {
        ...e,
        projects: e.projects.filter((_, i) => i !== index)
      } : e)
    }));
  };

  const updateProject = (empId, index, field, value) => {
    setData(prev => ({
      ...prev,
      employment: prev.employment.map(e => {
        if (e.id === empId) {
          const updated = [...e.projects];
          updated[index] = { ...updated[index], [field]: value };
          return { ...e, projects: updated };
        }
        return e;
      })
    }));
  };

  // Certifications
  const addCert = () => {
    setData(prev => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        { id: `cert_${Date.now()}`, name: 'Certificate Name', issuer: 'Issuer', date: 'Date', url: '', visible: true },
      ],
    }));
  };

  const removeCert = (index) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const updateCert = (index, field, value) => {
    setData(prev => ({
      ...prev,
      certifications: prev.certifications.map((c, i) => i === index ? { ...c, [field]: value } : c)
    }));
  };

  const reorderCertifications  = (f, t) => reorderSection('certifications', f, t);
  const reorderEmployment      = (f, t) => reorderSection('employment',     f, t);
  const reorderLanguages       = (f, t) => reorderSection('languages',      f, t);
  const reorderSkills          = (f, t) => reorderSection('skills',         f, t);

  const reorderSabbaticalBullets = (fromIndex, toIndex) =>
    setData(prev => ({
      ...prev,
      sabbatical: { ...prev.sabbatical, bullets: reorderArray(prev.sabbatical.bullets, fromIndex, toIndex) },
    }));

  // Language Handlers
  const updateLanguageLevel = (index, value) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.map((l, i) => i === index ? { ...l, level: value } : l)
    }));
  };

  const addLanguage = () => {
    setData(prev => ({
      ...prev,
      languages: [...prev.languages, { id: `lang_${Date.now()}`, name: 'New Language', level: 'Intermediate', visible: true }],
    }));
  };

  const removeLanguage = (index) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const updateLanguageName = (index, value) => {
    setData(prev => ({
      ...prev,
      languages: prev.languages.map((l, i) => i === index ? { ...l, name: value } : l)
    }));
  };

  // Skills
  const addSkillCategory = () => {
    setData(prev => ({
      ...prev,
      skills: [...prev.skills, { id: `skill_${Date.now()}`, category: 'Category', items: [], itemsText: '', itemRatings: [], visible: true }],
    }));
  };

  const removeSkillCategory = (index) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const updateSkillCategory = (index, field, value) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => i === index ? { ...s, [field]: value } : s)
    }));
  };

  const updateSkillItemsText = (index, value) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => (i === index ? { ...s, itemsText: value } : s)),
    }));
  };

  const commitSkillItems = (index) => {
    setData(prev => ({
      ...prev,
      skills: prev.skills.map((s, i) => {
        if (i !== index) return s;
        const text = s.itemsText != null ? s.itemsText : (s.items || []).join(', ');
        const items = text.split(',').map((item) => item.trim()).filter(Boolean);
        return {
          ...s,
          itemsText: text,
          items,
          itemRatings: normalizeSkillItemRatings(items, s.itemRatings),
        };
      }),
    }));
  };

  const updateSkillItemRating = (categoryIndex, itemIndex, value) => {
    const rating = Number(value);
    setData((prev) => ({
      ...prev,
      skills: prev.skills.map((s, i) => {
        if (i !== categoryIndex) return s;
        const items = parseSkillItems(s);
        const itemRatings = normalizeSkillItemRatings(items, s.itemRatings);
        itemRatings[itemIndex] = rating >= 1 && rating <= 5 ? rating : 0;
        return { ...s, itemRatings };
      }),
    }));
  };

  // Sabbatical
  const handleSabbaticalBulletChange = (index, value) => {
    setData(prev => {
      const updated = [...prev.sabbatical.bullets];
      updated[index] = value;
      return {
        ...prev,
        sabbatical: {
          ...prev.sabbatical,
          bullets: updated
        }
      };
    });
  };

  const addSabbaticalBullet = () => {
    setData(prev => ({
      ...prev,
      sabbatical: {
        ...prev.sabbatical,
        bullets: [...prev.sabbatical.bullets, '']
      }
    }));
  };

  const removeSabbaticalBullet = (index) => {
    setData(prev => ({
      ...prev,
      sabbatical: {
        ...prev.sabbatical,
        bullets: prev.sabbatical.bullets.filter((_, i) => i !== index)
      }
    }));
  };

  const buildExportPayload = (dataOverride = data) => ({
    version: 2,
    data: dataOverride,
    settings: buildAppSettingsExport({
      templateId,
      paperTexture,
      fontSizeRatio,
      spacingFactor,
      photoFrameStyle,
      photoScale,
      showSkillRatings,
      colors: buildColorsExportPayload(colorOverrides),
      viewMode,
    }),
  });

  const applyImportedPayload = async (parsed) => {
    if (parsed?.version >= 2 && parsed.data) {
      let resumeData = normalizeResumeData(parsed.data);
      if (shouldOptimizePhoto(resumeData.personal?.photo)) {
        resumeData = {
          ...resumeData,
          personal: { ...resumeData.personal, photo: await optimizePhotoDataUrl(resumeData.personal.photo) },
        };
      }
      setData(resumeData);
      const s = parsed.settings;
      if (s) {
        setTemplateId(readTemplateIdFromSettings(s));
        if (s.paperTexture) setPaperTexture(s.paperTexture);
        if (s.fontSizeRatio) setFontSizeRatio(formatTypoPercent(s.fontSizeRatio));
        if (s.spacingFactor) setSpacingFactor(formatSpacingFactor(s.spacingFactor));
        if (s.photoFrameStyle) setPhotoFrameStyle(s.photoFrameStyle);
        if (s.photoScale) setPhotoScale(s.photoScale);
        setShowSkillRatings(readShowSkillRatingsFromSettings(s));
        setColorOverrides(readColorOverridesFromSettings(s));
        if (s.viewMode) setViewMode(s.viewMode);
      }
      return;
    }
    if (parsed?.personal) {
      let resumeData = normalizeResumeData(parsed);
      if (shouldOptimizePhoto(resumeData.personal?.photo)) {
        resumeData = {
          ...resumeData,
          personal: { ...resumeData.personal, photo: await optimizePhotoDataUrl(resumeData.personal.photo) },
        };
      }
      setData(resumeData);
      return;
    }
    throw new Error('Invalid resume JSON');
  };

  const resetToDefaultTemplate = async () => {
    if (!window.confirm('Reset to the starter template? All unsaved changes will be lost.')) return;
    try {
      applyImportedPayload(await loadDefaultTemplate());
    } catch (err) {
      console.warn(err);
      applyImportedPayload({ version: 2, data: defaultResumeData, settings: defaultAppSettings });
      alert(
        `Could not load ${DEFAULT_TEMPLATE_FILENAME}. Loaded bundled defaults instead.\n\nRun: npm run sync:defaults`,
      );
    }
  };

  const triggerDownload = (url, filename) => {
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', filename);
    a.click();
  };

  const exportJSON = async () => {
    let exportData = data;
    if (shouldOptimizePhoto(data.personal?.photo)) {
      exportData = {
        ...data,
        personal: { ...data.personal, photo: await optimizePhotoDataUrl(data.personal.photo) },
      };
      setData(exportData);
    }
    const payload = buildExportPayload(exportData);
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    triggerDownload(dataStr, `${exportData.personal.name.toLowerCase().replace(/ /g, '_')}_resume.json`);
  };

  const importJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        await applyImportedPayload(JSON.parse(e.target.result));
      } catch (err) {
        alert("Invalid JSON format!");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handlePrint = (continuous = false) => {
    const filename = data.personal?.name ? `${data.personal.name.trim()} - CV` : 'CV';
    return exportCvToPdf({ continuous, photo: data.personal?.photo, optimizePhotoDataUrl, filename });
  };

  const handleWordExport = async () => {
    const blob = await exportToWord(data, viewMode);
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${data.personal.name.toLowerCase().replace(/ /g, '_')}_cv.docx`);
    URL.revokeObjectURL(url);
  };

  return {
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
    reorderSkills,
    reorderSabbaticalBullets,
    updateLanguageLevel,
    addLanguage,
    removeLanguage,
    updateLanguageName,
    addSkillCategory,
    removeSkillCategory,
    updateSkillCategory,
    updateSkillItemsText,
    commitSkillItems,
    updateSkillItemRating,
    handleSabbaticalBulletChange,
    addSabbaticalBullet,
    removeSabbaticalBullet,
    buildExportPayload,
    applyImportedPayload,
    resetToDefaultTemplate,
    triggerDownload,
    exportJSON,
    importJSON,
    handlePrint,
    handleWordExport,
  };
}
