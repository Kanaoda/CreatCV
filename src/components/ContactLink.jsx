import React from 'react';
import { EditableText } from './EditableText.jsx';

function OpenLinkIcon() {
  return (
    <svg className="cv-contact-open-icon" viewBox="0 0 24 24" width="11" height="11" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 3h2a5 5 0 0 1 5 5v2h-2V8a3 3 0 0 0-3-3h-2V3zm-4 18H8a5 5 0 0 1-5-5v-2h2v2a3 3 0 0 0 3 3h2v2zm9-13v2h-6.17L7 15.83V18h2v-2.83L14.83 9H18V7h-3z"
      />
    </svg>
  );
}

/**
 * Contact / LinkedIn link for CV preview.
 * - Label stays editable on screen
 * - A separate plain <a> icon (no contentEditable) carries the real URL —
 *   same pattern as certificate verify links, which Chrome Save-as-PDF keeps
 */
export function ContactLink({
  href,
  label,
  onLabelChange,
  placeholder = 'Link Label',
  style,
}) {
  const display = (label || '').trim() || href || '';

  return (
    <span className="cv-contact-link-row">
      {href ? (
        <a
          href={href}
          className="cv-contact-link"
          target="_blank"
          rel="noopener noreferrer"
          title={href}
          onClick={(e) => {
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
      ) : (
        <EditableText
          value={label || ''}
          onChange={onLabelChange}
          placeholder={placeholder}
          style={style}
        />
      )}
      {href ? (
        <a
          href={href}
          className="cv-contact-open-link"
          target="_blank"
          rel="noopener noreferrer"
          title={href}
          aria-label={`Open ${display || 'link'}`}
        >
          <OpenLinkIcon />
        </a>
      ) : null}
    </span>
  );
}
