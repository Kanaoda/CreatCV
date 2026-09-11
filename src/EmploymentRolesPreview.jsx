import React from 'react';
import { EditableText } from './components/EditableText.jsx';
import { bulletText } from './visibility';
import { usesMultiRoleDisplay, visibleEmploymentRoles, visibleRoleBullets } from './employmentRoles';

export function EmploymentRolesPreview({ employment, colorOverrides, updateEmpRole, updateRoleBullet }) {
  const roles = visibleEmploymentRoles(employment);
  if (!usesMultiRoleDisplay(employment)) return null;

  return (
    <div className="emp-roles-list">
      {roles.map((role) => {
        const roleBullets = visibleRoleBullets(role);
        return (
          <div key={role.id} className="emp-role-block">
            <div className="emp-role-header">
              <span className="emp-position-title">
                <EditableText
                  value={role.title}
                  onChange={(val) => updateEmpRole(employment.id, role.id, 'title', val)}
                  placeholder="Role Title"
                />
              </span>
              <span className="cv-date cv-date--role">
                <EditableText
                  value={role.period}
                  onChange={(val) => updateEmpRole(employment.id, role.id, 'period', val)}
                  placeholder="Role Period"
                />
              </span>
            </div>
            {roleBullets.length > 0 && (
              <ul className="emp-bullets emp-role-bullets">
                {roleBullets.map((b, idx) => (
                  <li key={b.id || idx}>
                    <EditableText
                      value={bulletText(b)}
                      onChange={(val) => updateRoleBullet(employment.id, role.id, idx, val)}
                      placeholder="Role Responsibility"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
