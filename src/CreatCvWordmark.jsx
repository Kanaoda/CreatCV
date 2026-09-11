import { useId } from 'react';
import {
  WORDMARK_VIEWBOX,
  CREAT_PATH,
  CV_PATH,
  RULE_PATH,
  ACCENT_PATH,
  WORDMARK_WIDTH,
} from './brand/wordmarkPaths';

const VIEW_H = 44;

/**
 * Horizontal vector logotype — Syne ExtraBold SVG paths (not HTML / system fonts).
 */
export function CreatCvWordmark({ className = '', height = 28 }) {
  const uid = useId().replace(/:/g, '');
  const cvFill = `creatCvCv-${uid}`;
  const width = (WORDMARK_WIDTH / VIEW_H) * height;

  return (
    <svg
      className={`creat-cv-wordmark ${className}`.trim()}
      viewBox={WORDMARK_VIEWBOX}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Creat CV"
    >
      <defs>
        <linearGradient id={cvFill} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffe1cc" />
          <stop offset="100%" stopColor="#ff801a" />
        </linearGradient>
      </defs>
      <path className="creat-cv-wordmark__creat" d={CREAT_PATH} fill="#fafafa" />
      <path className="creat-cv-wordmark__cv" d={CV_PATH} fill={`url(#${cvFill})`} />
      <path
        className="creat-cv-wordmark__rule"
        d={RULE_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="0.5"
      />
      <path
        className="creat-cv-wordmark__accent"
        d={ACCENT_PATH}
        fill="none"
        stroke="#ffe1cc"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
}
