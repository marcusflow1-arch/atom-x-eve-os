import React from 'react';

export default function ClanQuietPanel({ children, className = '', onClick }) {
  return <div onClick={onClick} className={`clan-quiet-panel ${className}`}>{children}</div>;
}