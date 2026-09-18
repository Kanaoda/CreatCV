import {
  AVAILABILITY_FIELD_DEFS,
  hasAnyShownAvailabilityField,
  isAvailabilityFieldShown,
} from './availabilityFields.js';
import {
  bulletText,
  isSectionVisible,
  visibleBullets,
  visibleItems,
} from './visibility';
import {
  findSkillSection,
  getVisibleSkillCategories,
  isSkillSectionVisible,
  normalizeSidebarSectionOrder,
  sectionHasVisibleContent,
} from './sidebarSections.js';
import { parseSkillItems } from './cvPreview/helpers.js';
import {
  isConciseView,
  isStandaloneProjectList,
  showsInlineProjects,
  showsProjectAppendix,
} from './viewModes';
import {
  usesMultiRoleDisplay,
  visibleEmploymentRoles,
  visibleRoleBullets,
} from './employmentRoles';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType,
  ExternalHyperlink,
  PageBreak,
} from 'docx';

const normalizeExternalUrl = (url) => {
  const trimmed = (url || '').trim();
  if (!trimmed) return '';
  if (/^(https?:\/\/|mailto:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

/**
 * ATS-oriented Word export: single-column plain text, no sidebar layout,
 * no template colors/photo. Employers typically use .docx for parsing —
 * visual design stays on PDF/print preview.
 */
function pushSeparator(parts) {
  if (parts.length > 0) {
    parts.push(new TextRun({ text: '  |  ', size: 16 }));
  }
}

function buildContactParagraph(personal) {
  const children = [];
  const pushPlain = (text) => {
    const t = (text || '').trim();
    if (!t) return;
    pushSeparator(children);
    children.push(new TextRun({ text: t, size: 16 }));
  };

  pushPlain(personal.email);
  pushPlain(personal.phone);
  pushPlain(personal.address);

  (personal.links || []).forEach((link) => {
    const href = normalizeExternalUrl(link?.url);
    if (!href) return;
    const label = (link.label || 'Link').trim() || 'Link';
    pushSeparator(children);
    children.push(new TextRun({ text: `${label}: `, size: 16 }));
    // Visible URL text helps ATS; hyperlink helps human readers
    children.push(
      new ExternalHyperlink({
        link: href,
        children: [
          new TextRun({
            text: href.replace(/^https?:\/\//i, ''),
            size: 16,
            style: 'Hyperlink',
          }),
        ],
      }),
    );
  });

  if (children.length === 0) return null;
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { after: 240 },
    children,
  });
}

function profileParagraphs(summary) {
  return String(summary || '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function exportToWord(data, viewMode) {
  const children = [];

  const addSectionTitle = (text) => {
    children.push(
      new Paragraph({
        text: text.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        keepWithNext: true,
      }),
    );
  };

  // Header — single column, left-aligned (ATS-friendly)
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [
        new TextRun({
          text: data.personal.name || '',
          bold: true,
          size: 32,
        }),
      ],
    }),
  );

  if ((data.personal.title || '').trim()) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: data.personal.title,
            size: 20,
          }),
        ],
      }),
    );
  }

  const contactPara = buildContactParagraph(data.personal || {});
  if (contactPara) children.push(contactPara);

  // Summary/Profile
  if (isSectionVisible(data.sections, 'profile') && data.personal.summary) {
    addSectionTitle('Professional Profile');
    profileParagraphs(data.personal.summary).forEach((line) => {
      children.push(
        new Paragraph({
          text: line,
          bullet: { level: 0 },
          spacing: { after: 60 },
        }),
      );
    });
  }

  // Handle View Modes
  if (isStandaloneProjectList(viewMode)) {
    // STANDALONE PROJECT LIST
    addSectionTitle("Project Portfolio");
    
    // Group projects from all employment histories
    const allProjects = [];
    visibleItems(data.employment).forEach(emp => {
      if (emp.projects) {
        visibleItems(emp.projects).forEach(proj => {
          allProjects.push({
            ...proj,
            company: emp.company
          });
        });
      }
    });

    allProjects.forEach(proj => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          keepWithNext: true,
          children: [
            new TextRun({
              text: `[${proj.year}] ${proj.title}`,
              bold: true,
            }),
            new TextRun({
              text: ` (at ${proj.company})`,
              italics: true,
              size: 16
            })
          ]
        })
      );
      if (proj.description) {
        children.push(
          new Paragraph({
            text: proj.description,
            spacing: { after: 120 }
          })
        );
      }
    });

  } else {
    // DETAILED CV or CONCISE RESUME — single-column body
    // Employment History
    if (isSectionVisible(data.sections, 'employment') && visibleItems(data.employment).length > 0) {
    addSectionTitle("Employment History");

    visibleItems(data.employment).forEach(emp => {
      if (usesMultiRoleDisplay(emp)) {
        const companyBits = [
          new TextRun({ text: emp.company, bold: true, size: 22 }),
        ];
        if (emp.location) {
          companyBits.push(new TextRun({ text: ` — ${emp.location}`, size: 20 }));
        }
        if (emp.period) {
          companyBits.push(new TextRun({ text: ` (${emp.period})`, size: 20 }));
        }
        children.push(
          new Paragraph({
            spacing: { before: 180, after: 40 },
            keepWithNext: true,
            children: companyBits,
          }),
        );
      } else {
        children.push(
          new Paragraph({
            spacing: { before: 180, after: 40 },
            keepWithNext: true,
            children: [
              new TextRun({
                text: emp.role,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ` at ${emp.company}`,
                bold: true,
                size: 22,
              }),
              new TextRun({
                text: ` (${emp.period})`,
                size: 20
              })
            ]
          })
        );
      }

      if (emp.subtext) {
        children.push(
          new Paragraph({
            text: emp.subtext,
            italics: true,
            spacing: { after: 80 }
          })
        );
      }

      if (usesMultiRoleDisplay(emp)) {
        visibleEmploymentRoles(emp).forEach((role) => {
          children.push(
            new Paragraph({
              spacing: { before: 100, after: 40 },
              children: [
                new TextRun({ text: role.title, bold: true, size: 20 }),
                new TextRun({ text: ` (${role.period})`, size: 20 }),
              ],
            }),
          );
          visibleRoleBullets(role).forEach((bullet) => {
            children.push(
              new Paragraph({
                text: bulletText(bullet),
                bullet: { level: 0 },
                spacing: { after: 40 },
              }),
            );
          });
        });
      } else {
        // Job-level bullets only when not using per-role display
        const empBullets = visibleBullets(emp.bullets);
        if (empBullets.length > 0) {
          const bulletsToShow = isConciseView(viewMode) ? empBullets.slice(0, 3) : empBullets;
          bulletsToShow.forEach(bullet => {
            children.push(
              new Paragraph({
                text: bulletText(bullet),
                bullet: { level: 0 },
                spacing: { after: 60 }
              })
            );
          });
        }
      }

      // Projects (only in Detailed CV)
      const empProjects = visibleItems(emp.projects);
      if (showsInlineProjects(viewMode) && empProjects.length > 0) {
        children.push(
          new Paragraph({
            text: "Key Project Deliveries:",
            bold: true,
            spacing: { before: 80, after: 60 }
          })
        );

        empProjects.forEach(proj => {
          children.push(
            new Paragraph({
              text: `${proj.year} - ${proj.title}`,
              bullet: { level: 1 },
              spacing: { after: 40 }
            })
          );
        });
      }
    });
    }

    // Education
    if (isSectionVisible(data.sections, 'education') && visibleItems(data.education).length > 0) {
    addSectionTitle("Education");
    visibleItems(data.education).forEach(edu => {
      children.push(
        new Paragraph({
          spacing: { before: 120, after: 40 },
          children: [
            new TextRun({
              text: edu.degree,
              bold: true
            }),
            new TextRun({
              text: ` - ${edu.school} (${edu.period})`,
            })
          ]
        })
      );
      const eduBullets = visibleBullets(edu.bullets);
      if (eduBullets.length > 0) {
        eduBullets.forEach(bullet => {
          children.push(
            new Paragraph({
              text: bulletText(bullet),
              bullet: { level: 0 },
              spacing: { after: 40 }
            })
          );
        });
      }
    });
    }

    // Skills / Languages / Certs — follow user sidebar order, but as single-column sections
    const appendCertifications = () => {
      if (!isSectionVisible(data.sections, 'certifications') || visibleItems(data.certifications).length === 0) {
        return;
      }
      addSectionTitle('Certificates & Licenses');
      visibleItems(data.certifications).forEach((cert) => {
        const certUrl = normalizeExternalUrl(cert.url);
        const metaRun = new TextRun({
          text: ` (${cert.issuer}, ${cert.date})`,
        });
        const nameChildren = certUrl
          ? [
              new ExternalHyperlink({
                link: certUrl,
                children: [
                  new TextRun({
                    text: cert.name,
                    bold: true,
                    style: 'Hyperlink',
                  }),
                ],
              }),
              metaRun,
            ]
          : [
              new TextRun({
                text: cert.name,
                bold: true,
              }),
              metaRun,
            ];

        children.push(
          new Paragraph({
            spacing: { after: 60 },
            children: nameChildren,
          }),
        );
      });
    };

    const appendSkillSection = (sectionId) => {
      const section = findSkillSection(data.skillSections, sectionId);
      if (!isSkillSectionVisible(data.sections, section)) return;
      if (!sectionHasVisibleContent(section)) return;
      const cats = getVisibleSkillCategories(section).filter((c) => parseSkillItems(c).length > 0);
      if (cats.length === 0) return;
      addSectionTitle(section.title || 'Skills');
      cats.forEach((skillCat) => {
        const items = parseSkillItems(skillCat);
        const label = skillCat.category && !/^\[.*\]$/.test(String(skillCat.category).trim())
          ? `${skillCat.category}: `
          : '';
        children.push(
          new Paragraph({
            children: [
              ...(label
                ? [new TextRun({ text: label, bold: true })]
                : []),
              new TextRun({ text: items.join(', ') }),
            ],
            spacing: { after: 60 },
          }),
        );
      });
    };

    const appendLanguages = () => {
      const visibleLangs = visibleItems(data.languages);
      if (!isSectionVisible(data.sections, 'languages') || visibleLangs.length === 0) return;
      addSectionTitle('Languages');
      const langText = visibleLangs.map((l) => `${l.name} (${l.level})`).join(', ');
      children.push(
        new Paragraph({
          text: langText,
          spacing: { after: 120 },
        }),
      );
    };

    const sidebarExportBlocks = {
      languages: appendLanguages,
      certifications: appendCertifications,
    };
    (data.skillSections || []).forEach((sec) => {
      sidebarExportBlocks[sec.id] = () => appendSkillSection(sec.id);
    });

    normalizeSidebarSectionOrder(data.sidebarSectionOrder, data.skillSections)
      .forEach((key) => {
        const fn = sidebarExportBlocks[key];
        if (fn) fn();
      });

    if (isSectionVisible(data.sections, 'references') && visibleItems(data.references || []).length > 0) {
      addSectionTitle('References');
      visibleItems(data.references).forEach((ref) => {
        const meta = [ref.company, ref.phone, ref.email].filter(Boolean).join(' · ');
        children.push(
          new Paragraph({
            spacing: { before: 120, after: 40 },
            children: [
              new TextRun({ text: ref.name, bold: true }),
              ...(ref.title ? [new TextRun({ text: ` — ${ref.title}` })] : []),
            ],
          }),
        );
        if (meta) {
          children.push(
            new Paragraph({
              text: meta,
              spacing: { after: 60 },
            }),
          );
        }
      });
    }

    const avail = data.availability;
    if (isSectionVisible(data.sections, 'availability') && avail && hasAnyShownAvailabilityField(avail)) {
      addSectionTitle('Availability');
      const shownFields = AVAILABILITY_FIELD_DEFS.filter((f) => isAvailabilityFieldShown(avail, f.key));
      shownFields.forEach((field, idx) => {
        children.push(
          new Paragraph({
            text: `${field.previewLabel}: ${avail[field.key]}`,
            bullet: { level: 0 },
            spacing: { after: idx === shownFields.length - 1 ? 60 : 40 },
          }),
        );
      });
    }

    // Sabbatical
    if (isSectionVisible(data.sections, 'sabbatical') && data.sabbatical && data.sabbatical.enabled) {
      addSectionTitle("Additional Notes");
      data.sabbatical.bullets.forEach(bullet => {
        children.push(
          new Paragraph({
            text: bullet,
            bullet: { level: 0 },
            spacing: { after: 60 }
          })
        );
      });
    }

    if (showsProjectAppendix(viewMode)) {
      const groups = visibleItems(data.employment || [])
        .map((emp) => ({ emp, projects: visibleItems(emp.projects || []) }))
        .filter(({ projects }) => projects.length > 0);

      if (groups.length > 0) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
        addSectionTitle('Standalone Project Deliveries');

        groups.forEach(({ emp, projects }) => {
          children.push(
            new Paragraph({
              spacing: { before: 180, after: 80 },
              children: [
                new TextRun({
                  text: `Projects at ${emp.company}`,
                  bold: true,
                  size: 22,
                }),
              ],
            }),
          );

          projects.forEach((proj) => {
            children.push(
              new Paragraph({
                spacing: { before: 80, after: 40 },
                keepWithNext: true,
                children: [
                  new TextRun({ text: `[${proj.year}] ${proj.title}`, bold: true }),
                ],
              }),
            );
            if (proj.description) {
              children.push(
                new Paragraph({
                  text: proj.description,
                  spacing: { after: 80 },
                }),
              );
            }
          });
        });
      }
    }
  }

  const doc = new Document({
    creator: 'CreatCV',
    title: `${data.personal?.name || 'CV'} — ATS Word`,
    description: 'Single-column ATS-oriented resume export from CreatCV',
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  return blob;
}
