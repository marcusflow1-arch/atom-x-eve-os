import React from 'react';
import { Box } from 'lucide-react';

export default function Luna3DBackground() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center text-white/40">
        <Box className="w-8 h-8 mx-auto mb-2" />
        <p className="text-xs">3D Model</p>
      </div>
    </div>
  );
}