/**
 * @typedef {Object} TemplateTheme
 * @property {string} [fontTitle]
 * @property {string} [fontBody]
 * @property {string} [bg]
 * @property {string} [sidebarBg]
 * @property {string} [primary]
 * @property {string} [secondary]
 * @property {string} [accent]
 * @property {string} [text]
 * @property {string} [textLight]
 * @property {string} [border]
 * @property {string} [sidebarWidth]
 * @property {string} [headerBg]
 * @property {string} [headerColor]
 * @property {string} [sidebarPrimary]
 */

/**
 * @typedef {Object} TemplateDefinitionInput
 * @property {string} id
 * @property {string} name
 * @property {string} [group]
 * @property {number} [sortOrder]
 * @property {string} layoutFamily — decorative CSS hook (data-layout-family)
 * @property {string} [archetype] — physical layout; derived from layoutFamily if omitted
 * @property {string} langStyle
 * @property {'header'|'sidebar'} photoPlacement
 * @property {string} [photoShape]
 * @property {TemplateTheme} [theme]
 * @property {boolean} [legacyPreview] — keep original preview DOM (preset 12)
 */

/**
 * @typedef {Object} ResolvedTemplate
 * @property {TemplateDefinitionInput} template
 * @property {string} templateId
 * @property {string} name
 * @property {string} group
 * @property {string} archetype
 * @property {string} layoutFamily
 * @property {string} langStyle
 * @property {string} layoutClass
 * @property {boolean} singleColumn
 * @property {'header'|'sidebar'} photoPlacement
 * @property {string} photoShape
 * @property {Record<string, string>} themeCssVars
 * @property {boolean} usesLegacyPreview
 * @property {import('../layouts/types.js').LayoutDefinition|null} [layout]
 */

export {};
