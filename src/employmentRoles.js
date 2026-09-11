import { bulletText, isVisible, normalizeBullets, visibleBullets, visibleItems } from './visibility';

export function normalizeEmploymentRoles(emp, empIndex) {
  const empId = emp.id || `emp_${empIndex}`;
  return (emp.roles || []).map((role, j) => ({
    id: role.id || `role_${empId}_${j}`,
    title: role.title || '',
    period: role.period || '',
    visible: role.visible !== false,
    bullets: normalizeBullets(role.bullets, `role_bullet_${empId}_${j}`),
  }));
}

/** True when structured roles should appear as separate blocks on the CV (not merged). */
export function usesMultiRoleDisplay(emp) {
  if (emp.splitRoles === false) return false;
  return visibleItems(emp.roles || []).length > 0;
}

export function hasStructuredRoles(emp) {
  return (emp.roles || []).length > 0;
}

export function visibleEmploymentRoles(emp) {
  return visibleItems(emp.roles || []);
}

export function visibleRoleBullets(role) {
  return visibleBullets(role.bullets || []);
}

/** Remove legacy "Career Progression:" bullet once structured roles are present. */
export function stripLegacyCareerProgressionBullets(emp, empIndex) {
  const bullets = normalizeBullets(emp.bullets, `bullet_${emp.id || empIndex}`);
  if (!usesMultiRoleDisplay(emp)) return bullets;
  return bullets.filter((b) => !/^career progression:/i.test(bulletText(b)));
}
