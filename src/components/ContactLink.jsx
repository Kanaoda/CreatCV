import React from 'react';

/**
 * Contact / LinkedIn link for CV preview + PDF.
 * Icon and label are each a plain <a href={sameUrl}> (no contentEditable),
 * so clicking either one opens the profile — in the browser and in Save-as-PDF.
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
    <span className="cv-contact-link-row">
      {showIcon ? (
        <a
          href={href}
          className="cv-contact-open-link"
          target="_blank"
          rel="noopener noreferrer"
          title={href}
          aria-label={`Open ${display}`}
        >
          🔗
        </a>
      ) : null}
      <a
        href={href}
        className="cv-contact-text-link"
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        style={style}
      >
        {display}
      </a>
    </span>
  );
}
