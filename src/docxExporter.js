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
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  BorderStyle, 
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

export async function exportToWord(data, viewMode) {
  const children = [];

  // Helper for Section Titles with a nice underline effect
  const addSectionTitle = (text) => {
    children.push(
      new Paragraph({
        text: text.toUpperCase(),
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 240, after: 120 },
        keepWithNext: true
      })
    );
  };

  // Header Section
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: data.personal.name,
          bold: true,
          size: 32,
        })
      ]
    })
  );

  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: data.personal.title,
          italics: true,
          size: 18,
        })
      ]
    })
  );

  // Contact Info
  const contactText = `${data.personal.email} | ${data.personal.phone} | ${data.personal.address}`;
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: contactText,
          size: 16,
        })
      ]
    })
  );

  // Summary/Profile
  if (isSectionVisible(data.sections, 'profile') && data.personal.summary) {
    addSectionTitle("Professional Profile");
    children.push(
      new Paragraph({
        text: data.personal.summary,
        spacing: { after: 180 },
      })
    );
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
    // DETAILED CV or CONCISE RESUME
    // Employment History
    if (isSectionVisible(data.sections, 'employment') && visibleItems(data.employment).length > 0) {
    addSectionTitle("Employment History");

    visibleItems(data.employment).forEach(emp => {
      if (usesMultiRoleDisplay(emp)) {
        children.push(
          new Paragraph({
            spacing: { before: 180, after: 40 },
            keepWithNext: true,
            children: [
              new TextRun({
                text: emp.company,
                bold: true,
                size: 22,
                ...((emp.jobTitleColor || emp.companyColor)
                  ? { color: (emp.jobTitleColor || emp.companyColor).replace(/^#/, '').toUpperCase() }
                  : {}),
              }),
              new TextRun({
                text: ` (${emp.period})`,
                bold: true,
                size: 20,
              }),
            ],
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
                ...((emp.jobTitleColor || emp.companyColor)
                  ? { color: (emp.jobTitleColor || emp.companyColor).replace(/^#/, '').toUpperCase() }
                  : {}),
              }),
              new TextRun({
                text: ` (${emp.period})`,
                bold: true,
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
      }

      // Bullets (only if not Concise Resume or if concise is allowed some summary)
      const empBullets = visibleBullets(emp.bullets);
      if (isConciseView(viewMode) || empBullets.length > 0) {
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

    // Certifications
    if (isSectionVisible(data.sections, 'certifications') && visibleItems(data.certifications).length > 0) {
    addSectionTitle("Certificates & Licenses");
    visibleItems(data.certifications).forEach(cert => {
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
        })
      );
    });
    }

    // Skills
    if (isSectionVisible(data.sections, 'skills') && visibleItems(data.skills).length > 0) {
    addSectionTitle("Skills");
    visibleItems(data.skills).forEach(skillCat => {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${skillCat.category}: `,
              bold: true
            }),
            new TextRun({
              text: skillCat.items.join(", ")
            })
          ],
          spacing: { after: 60 }
        })
      );
    });
    }

    // Languages
    const visibleLangs = visibleItems(data.languages);
    if (isSectionVisible(data.sections, 'languages') && visibleLangs.length > 0) {
    addSectionTitle("Languages");
    const langText = visibleLangs.map(l => `${l.name} (${l.level})`).join(", ");
    children.push(
      new Paragraph({
        text: langText,
        spacing: { after: 120 }
      })
    );
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

  // Create document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children
      }
    ]
  });

  // Pack document
  const blob = await Packer.toBlob(doc);
  return blob;
}
