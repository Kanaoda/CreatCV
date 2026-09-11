import { useId } from 'react';

/**
 * Creat CV logomark — stroke monogram (page + forward mark), pairs with vector wordmark.
 */
export function CreatCvLogo({ size = 40, className = '' }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Orange Background */}
      <rect x="2" y="2" width="36" height="36" fill="#ff801a" />
      
      {/* Hand-drawn style black border */}
      <path 
        d="M2.5 3 C12 2.5 28 2.2 37.5 3 C37.8 12 38 28 37.5 37.5 C28 37.8 12 38 2.5 37.5 C2.2 28 2 12 2.5 3 Z" 
        stroke="#000000" 
        strokeWidth="3" 
        strokeLinejoin="round" 
        strokeLinecap="round"
      />

      {/* The main abstract document-arrow-C shape */}
      {/* Outer folder body outline */}
      <path 
        d="M10 28.5 V11.5 H22 L27.5 17 V28.5 H10" 
        stroke="#000000" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Fold corner detail */}
      <path 
        d="M22 11.5 V17 H27.5" 
        stroke="#000000" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Upward arrow on the right edge */}
      <path 
        d="M27.5 28.5 V20.5 M27.5 20.5 L24 23.5 M27.5 20.5 L31 23.5" 
        stroke="#000000" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />

      {/* Diagonal line extending from bottom left */}
      <path 
        d="M5.5 34 L12 27" 
        stroke="#000000" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
      />

      {/* "C" shape cut-out inside the folder */}
      <path 
        d="M20 16 H15 V24 H20" 
        stroke="#000000" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
}
