import React from 'react';

const STYLE_CLASS = {
  plain: 'cv-sec-head--plain',
  underline: 'cv-sec-head--underline',
  bar: 'cv-sec-head--bar',
  pill: 'cv-sec-head--pill',
  italic: 'cv-sec-head--italic',
  caps: 'cv-sec-head--caps',
  minimal: 'cv-sec-head--minimal',
};

export function SectionHead({ title, style = 'plain', zone = 'main' }) {
  const cls = STYLE_CLASS[style] || STYLE_CLASS.plain;
  return (
    <div className={`cv-sec-head ${cls} cv-sec-head--zone-${zone}`}>
      <span className="cv-sec-head-text">{title}</span>
    </div>
  );
}
