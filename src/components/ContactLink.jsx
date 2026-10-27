import React from 'react';

/** Same external-link glyph as certificate verify buttons (PDF-safe). */
function LinkIcon() {
  return (
    <svg className="cert-link-icon" viewBox="0 0 24 24" width="12" height="12" aria-hidden="true">
      <path
        fill="currentColor"
        d="M14 3h2a5 5 0 0 1 5 5v2h-2V8a3 3 0 0 0-3-3h-2V3zm-4 18H8a5 5 0 0 1-5-5v-2h2v2a3 3 0 0 0 3 3h2v2zm9-13v2h-6.17L7 15.83V18h2v-2.83L14.83 9H18V7h-3z"
      />
    </svg>
  );
}

/**
 * LinkedIn / portfolio link — mirrors the working Certificate pattern:
 * plain text <a> + separate SVG icon <a>, both with the same href.
 * No contentEditable inside anchors (Chrome Save-as-PDF keeps those clickable).
 */
export function ContactLink({
  href,
  label,
  placeholder = 'Link Label',
  style,
  showIcon = true,
}) {
  const display = (label || '').trim() || href || placeholder;

  const open = (e) => {
    if (!href) return;
    // Preview: force navigation (PDF still uses the href annotation).
    e.preventDefault();
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  if (!href) {
    return (
      <span className="cert-name-row cv-contact-link-row">
        {showIcon ? <span aria-hidden="true">🔗</span> : null}
        <span style={style}>{display}</span>
      </span>
    );
  }

  return (
    <span className="cert-name-row cv-contact-link-row">
      <a
        href={href}
        className="cert-name-link cv-contact-text-link"
        target="_blank"
        rel="noopener noreferrer"
        title={href}
        style={style}
        onClick={open}
      >
        {display}
      </a>
      {showIcon ? (
        <a
          href={href}
          className="cert-verify-link"
          target="_blank"
          rel="noopener noreferrer"
          title={href}
          aria-label={`Open ${display}`}
          onClick={open}
        >
          <LinkIcon />
        </a>
      ) : null}
    </span>
  );
}
