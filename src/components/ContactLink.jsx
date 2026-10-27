import React from 'react';

/**
 * Contact / LinkedIn link for CV preview + PDF.
 * Entire row is a plain <a href> with text only (no contentEditable),
 * so clicks open the URL in the browser and Chrome Save-as-PDF keeps
 * a working hyperlink annotation — same idea as certificate icons.
 */
export function ContactLink({
  href,
  label,
  placeholder = 'Link Label',
  style,
  showIcon = true,
}) {
  const display = (label || '').trim() || href || placeholder;

  if (!href) {
    return (
      <span className="cv-contact-link-row">
        {showIcon ? <span aria-hidden="true">🔗</span> : null}
        <span className="cv-contact-link-label" style={style}>{display}</span>
      </span>
    );
  }

  return (
    <a
      href={href}
      className="cv-contact-link-row cv-contact-open-link"
      target="_blank"
      rel="noopener noreferrer"
      title={href}
    >
      {showIcon ? <span className="cv-contact-link-icon" aria-hidden="true">🔗</span> : null}
      <span className="cv-contact-link-label" style={style}>{display}</span>
    </a>
  );
}
