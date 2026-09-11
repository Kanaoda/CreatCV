/**
 * @typedef {'standard'|'timeline'|'timeline-rail'|'cards'} EmploymentStyle
 * @typedef {'tags'|'dots'|'list'} SkillDisplay
 * @typedef {'bars'|'text'|'dots'} LangDisplay
 * @typedef {'stacked'|'sidebar-card'|'grid-two-col'} ReferenceStyle
 * @typedef {'main'|'sidebar'} ReferencesZone
 * @typedef {'plain'|'underline'|'bar'|'pill'|'italic'|'caps'|'minimal'} SectionTitleStyle
 *
 * @typedef {Object} LayoutDefinition
 * @property {string} id
 * @property {string} name
 * @property {'single'|'sidebar-left'|'sidebar-right'|'center-split'|'header-stack'} body
 * @property {'standard'|'centered'|'band'|'dark-band'|'split'|'hero-card'|'minimal'|'initials'} header
 * @property {'header'|'sidebar'|'hero'|'none'} photo
 * @property {EmploymentStyle} employment
 * @property {ReferencesZone} referencesZone
 * @property {ReferenceStyle} referenceStyle
 * @property {SectionTitleStyle} sectionTitleMain
 * @property {SectionTitleStyle} [sectionTitleSidebar]
 * @property {SkillDisplay} skills
 * @property {LangDisplay} [langDisplay]
 * @property {boolean} [contactInSidebar]
 * @property {boolean} [summaryInHeader]
 * @property {boolean} [skillsInMain]
 * @property {string[]} [mainOrder]
 * @property {string[]} [sidebarOrder]
 */

export {};
