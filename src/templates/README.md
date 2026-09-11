# CV Template System

## Layers

| Layer | Role | Scales to 100+? |
|-------|------|-----------------|
| **archetype** | Physical layout (sidebar left/right, single column) | 3–10 archetypes |
| **layoutFamily** | Decorative CSS (`data-layout-family`) | Shared across many templates |
| **theme** | Colors, fonts, spacing tokens → CSS variables via JS | One JSON object per template |
| **langStyle** | Language block presentation | ~6 variants |

## Frozen legacy preview (Preset 12)

`modern-tech` has `legacyPreview: true` in `catalog.js` and is listed in `src/layouts/legacy.js`.  
It always renders via `LegacyCvPreview` (original DOM). Do not map it in `templateLayoutMap.js`.

## Layout engine (Canva-level structure)

| File | Role |
|------|------|
| `src/layouts/definitions.js` | 12 structural layouts |
| `src/layouts/templateLayoutMap.js` | 39 templates → layout id |
| `src/layouts/CvLayoutRenderer.jsx` | Preview DOM for non-legacy templates |
| `src/layouts/layouts.css` | Scoped styles via `[data-layout-id]` |

`resolveTemplate()` returns `layout` + `usesLegacyPreview`. Preview in `main.jsx` branches on that flag.

## Add a template

```js
import { registerTemplate } from './templates';

registerTemplate({
  id: 'my-agency-2026',
  name: 'Agency 2026',
  group: 'agency',
  sortOrder: 100,
  archetype: 'sidebar-right',
  layoutFamily: 'classic-sidebar',
  langStyle: 'sidebar-bar',
  photoPlacement: 'header',
  photoShape: 'rounded',
  theme: {
    fontTitle: "'Poppins', sans-serif",
    fontBody: "'Inter', sans-serif",
    primary: '#111827',
    accent: '#6366f1',
    // ...
  },
});
```

No new `[data-preset="..."]` CSS block required if `theme` is complete.

## Files

- `registry.js` — register / list / lookup
- `resolveTemplate.js` — runtime view-model for preview
- `themeCss.js` — theme → `--cv-*` variables
- `settings.js` — `templateId` + legacy `preset` alias
- `definitions/builtin/` — shipped templates
- `definitions/builtin/themes.generated.js` — run `node scripts/extract-preset-themes.mjs` after CSS token edits

## Future: external templates

Load JSON from `/public/templates/{id}.json` and `registerTemplate()` at startup or on demand.
