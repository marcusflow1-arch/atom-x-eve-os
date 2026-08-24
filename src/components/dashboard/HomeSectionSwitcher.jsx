import React from 'react';

// The dashboard no longer changes sections when the user clicks the open canvas.
// Full Library/game navigation owns those transitions explicitly.
export default function HomeSectionSwitcher() {
  return null;
}

export const SECTIONS = [
  { id: 'avatar', label: 'AI Avatar Home' },
  { id: 'developer', label: 'Developer Spotlight' },
];
