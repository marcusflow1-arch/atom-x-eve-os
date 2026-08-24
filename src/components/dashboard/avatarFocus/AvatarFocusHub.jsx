import React from 'react';

// Avatar focus mode intentionally leaves the dashboard visually blank on the
// right. LunaTemplate keeps the existing Y-Bot 3D avatar + stats visible.
// This invisible marker lets the dashboard feature rail hide while focused.
export default function AvatarFocusHub() {
  return <div data-avatar-focus-hub="true" aria-hidden="true" style={{ display: 'none' }} />;
}
