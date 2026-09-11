import { archetypeFromLayoutFamily } from '../../constants.js';
import { registerTemplates, setDefaultTemplateId } from '../../registry.js';
import { BUILTIN_CATALOG } from './catalog.js';
import { BUILTIN_THEMES } from './themes.generated.js';

function buildBuiltinDefinitions() {
  return BUILTIN_CATALOG.map((entry) => {
    const theme = BUILTIN_THEMES[entry.id] ?? {};
    const layoutFamily = entry.layoutFamily;
    return {
      ...entry,
      group: 'builtin',
      version: 1,
      archetype: entry.archetype ?? archetypeFromLayoutFamily(layoutFamily),
      layoutFamily,
      theme,
    };
  });
}

const BUILTIN_DEFINITIONS = buildBuiltinDefinitions();
registerTemplates(BUILTIN_DEFINITIONS);
setDefaultTemplateId('corporate-navy');

export { BUILTIN_DEFINITIONS, BUILTIN_CATALOG };
