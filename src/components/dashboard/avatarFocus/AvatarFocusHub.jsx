import React from 'react';

// Avatar Focus mode intentionally keeps the dashboard visually blank on the
// right-hand side. The Y-Bot 3D avatar + stats remain visible in LunaTemplate.
// This hidden marker lets the dashboard feature rail know that focus mode is active.
export default function AvatarFocusHub() {
  return <div data-avatar-focus-hub="true" aria-hidden="true" style={{ display: 'none' }} />;
}
