/**
 * Shared editor ↔ preview section keys for hover / click sync.
 * Item-level: `${section}:${id}` e.g. employment:emp_0
 */

const SECTION_EDITOR = {
  personal: { tab: 'personal', id: 'editor-personal' },
  profile: { tab: 'personal', id: 'editor-personal' },
  employment: { tab: 'employment', id: 'editor-employment' },
  education: { tab: 'other', id: 'editor-education' },
  languages: { tab: 'skills', id: 'editor-languages' },
  skills: { tab: 'skills', id: 'editor-skills-display' },
  certifications: { tab: 'other', id: 'editor-certs' },
  references: { tab: 'other', id: 'editor-references' },
  availability: { tab: 'other', id: 'editor-availability' },
  sabbatical: { tab: 'other', id: 'editor-sabbatical' },
};

export function anchorsMatch(hoverAnchor, nodeAnchor) {
  if (!hoverAnchor || !nodeAnchor) return false;
  if (hoverAnchor === nodeAnchor) return true;
  if (nodeAnchor.startsWith(`${hoverAnchor}:`)) return true;
  if (hoverAnchor.startsWith(`${nodeAnchor}:`)) return true;
  if (hoverAnchor === 'personal' && nodeAnchor === 'profile') return true;
  if (hoverAnchor === 'profile' && nodeAnchor === 'personal') return true;
  return false;
}

export function applyCvAnchorHighlights(hoverAnchor) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('[data-cv-anchor]').forEach((node) => {
    const a = node.getAttribute('data-cv-anchor');
    node.classList.toggle('cv-sync-hot', anchorsMatch(hoverAnchor, a));
  });
}

function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function nearestAnchorInContainer(container, clientY) {
  const nodes = [...container.querySelectorAll('[data-cv-anchor]')];
  if (nodes.length === 0) return null;
  let best = null;
  let bestDist = Infinity;
  for (const node of nodes) {
    const r = node.getBoundingClientRect();
    if (r.height < 1) continue;
    const mid = (r.top + r.bottom) / 2;
    const dist = Math.abs(mid - clientY);
    if (dist < bestDist) {
      bestDist = dist;
      best = node.getAttribute('data-cv-anchor');
    }
  }
  return best;
}

/**
 * Resolve which CV/editor anchor is under the pointer.
 * Float layouts make .cv-main-col boxes extend under the sidebar — so we must
 * prefer sidebar hits by geometry, not only DOM closest().
 */
export function resolveAnchorAtPoint(clientX, clientY, root) {
  if (!root || typeof document === 'undefined' || !document.elementsFromPoint) {
    return readAnchorFromEventTarget(document.elementFromPoint?.(clientX, clientY), root);
  }

  const sidebarEl = root.querySelector('.cv-sidebar-col');
  const overSidebar = Boolean(
    sidebarEl && pointInRect(clientX, clientY, sidebarEl.getBoundingClientRect()),
  );

  const stack = document.elementsFromPoint(clientX, clientY);
  for (const el of stack) {
    if (!root.contains(el)) continue;
    const node = typeof el.closest === 'function' ? el.closest('[data-cv-anchor]') : null;
    if (!node || !root.contains(node)) continue;
    const nodeInSidebar = Boolean(node.closest('.cv-sidebar-col'));
    if (overSidebar && !nodeInSidebar) continue;
    if (!overSidebar && nodeInSidebar) continue;
    return node.getAttribute('data-cv-anchor');
  }

  if (overSidebar && sidebarEl) {
    return nearestAnchorInContainer(sidebarEl, clientY);
  }
  return null;
}

/** mouseover / mouseout delegation — works across editor + preview roots */
export function readAnchorFromEventTarget(target, root) {
  if (!target || !root || typeof target.closest !== 'function') return null;
  const node = target.closest('[data-cv-anchor]');
  if (!node || !root.contains(node)) return null;
  // If the event target sits in the sidebar, never return a main-col ancestor
  // (main boxes geometrically extend under the float).
  const targetInSidebar = Boolean(target.closest('.cv-sidebar-col'));
  const nodeInSidebar = Boolean(node.closest('.cv-sidebar-col'));
  if (targetInSidebar && !nodeInSidebar) return null;
  return node.getAttribute('data-cv-anchor');
}

/** Map a sync anchor to left-editor tab + scroll target. */
export function editorTargetForAnchor(anchor) {
  if (!anchor) return null;
  const colon = anchor.indexOf(':');
  const section = colon === -1 ? anchor : anchor.slice(0, colon);
  const itemId = colon === -1 ? null : anchor.slice(colon + 1);

  if (section === 'skills' && itemId) {
    return {
      tab: 'skills',
      elementId: `editor-skills-${itemId}`,
      anchor,
    };
  }

  const base = SECTION_EDITOR[section];
  if (!base) return null;
  return {
    tab: base.tab,
    elementId: base.id,
    anchor: itemId ? anchor : null,
  };
}

/** True when the user is interacting with editable CV chrome (don't steal the click). */
export function isCvInteractiveTarget(target) {
  if (!target || typeof target.closest !== 'function') return false;
  return Boolean(
    target.closest('a, button, input, textarea, select, label, [contenteditable="true"]'),
  );
}
