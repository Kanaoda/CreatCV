import React from 'react';
import { EditableText } from './EditableText.jsx';

/**
 * Clickable external link for CV contact rows (LinkedIn, portfolio, etc.).
 * Label stays editable on screen; real <a href> is preserved for PDF print.
 */
export function ContactLink({
  href,
  label,
  onLabelChange,
  placeholder = 'Link Label',
  style,
}) {
  const display = (label || '').trim() || href || '';

  if (!href) {
    return (
      <EditableText
        value={label || ''}
        onChange={onLabelChange}
        placeholder={placeholder}
        style={style}
      />
    );
  }

  return (
    <a
      href={href}
      className="cv-contact-link"
      target="_blank"
      rel="noopener noreferrer"
      title={href}
      onClick={(e) => {
        // Keep label editable in the live preview without navigating away.
        if (e.target.closest('.cv-editable-text')) {
          e.preventDefault();
        }
      }}
    >
      <EditableText
        value={display}
        onChange={onLabelChange}
        placeholder={placeholder}
        style={style}
      />
    </a>
  );
}
