import React from 'react';

export default function SewingMachineIcon({ className = "w-3.5 h-3.5" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 20h18" />
      <path d="M4 17h16" />
      <path d="M5 17V8a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9" />
      <circle cx="17" cy="9" r="1.5" />
      <path d="M9 7v6" />
      <path d="M8 13h2" />
      <path d="M9 13l-1.5 2.5h3L9 13z" />
    </svg>
  );
}

