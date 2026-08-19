import React from 'react';

// The Game Viewer already mounts the original GameWorldEditController.
// This gate intentionally renders nothing so a second, duplicate editor cannot appear.
export default function GameWorldEditorGate() {
  return null;
}
