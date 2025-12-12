import React from 'react';
import ModelViewer3D from '../models/ModelViewer3D';

export default function Luna3DBackground() {
  return (
    <ModelViewer3D 
      url="https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/fa2f97252_scene.gltf"
      className="w-full h-full"
      autoRotate={true}
    />
  );
}