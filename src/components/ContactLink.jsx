import React from 'react';
import { EditableText } from './EditableText.jsx';

/**
 * Contact / LinkedIn link for CV preview.
 * The 🔗 emoji is a plain <a href> (no contentEditable) — same pattern as
 * certificate verify icons, which Chrome Save-as-PDF keeps clickable.
 * The label text stays editable beside it.
 */
export function ContactLink({
  href,
  label,
  onLabelChange,
  placeholder = 'Link Label',
  style,
  showIcon = true,
}) {
  const display = (label || '').trim() || href || '';

  return (
    <span className="cv-contact-link-row">
      {showIcon ? (
        href ? (
          <a
            href={href}
            className="cv-contact-open-link"
            target="_blank"
            rel="noopener noreferrer"
            title={href}
            aria-label={`Open ${display || 'link'}`}
          >
            🔗
          </a>
        ) : (
          <span className="cv-contact-open-link cv-contact-open-link--dead" aria-hidden="true">
            🔗
          </span>
        )
      ) : null}
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
    </span>
  );
}
