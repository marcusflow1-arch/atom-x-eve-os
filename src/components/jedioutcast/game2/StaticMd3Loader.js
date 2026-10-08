import * as THREE from 'three';

const textDecoder = new TextDecoder();
// MD3 stores positions as int16 with 1/64 game-unit precision. Convert the decoded\n// Jedi game unit again into the viewer's 64-units-per-meter world scale.\nconst MD3_XYZ_SCALE = 1 / (64 * 64);

function cString(bytes) {
  const end = bytes.indexOf(0);
  return textDecoder.decode(end >= 0 ? bytes.subarray(0, end) : bytes).trim();
}

function assertRange(view, offset, length, label) {
  if (offset < 0 || length < 0 || offset + length > view.byteLength) {
    throw new Error(`MD3 ${label} is outside the file.`);
  }
}

export function parseStaticMd3(arrayBuffer, { materialFactory } = {}) {
  const view = new DataView(arrayBuffer);
  const bytes = new Uint8Array(arrayBuffer);
  if (view.byteLength < 108) throw new Error('MD3 file is too small.');
  if (cString(bytes.subarray(0, 4)) !== 'IDP3') throw new Error('Expected IDP3 MD3 header.');
  if (view.getInt32(4, true) !== 15) throw new Error('Expected MD3 version 15.');

  const name = cString(bytes.subarray(8, 72));
  const numFrames = view.getInt32(76, true);
  const numSurfaces = view.getInt32(84, true);
  let surfaceOffset = view.getInt32(100, true);
  if (numFrames < 1 || numSurfaces < 1) throw new Error('MD3 contains no renderable frame/surface data.');

  const root = new THREE.Group();
  root.name = name || 'RavenMD3';

  for (let surfaceIndex = 0; surfaceIndex < numSurfaces; surfaceIndex += 1) {
    assertRange(view, surfaceOffset, 108, 'surface header');
    const surfaceMagic = cString(bytes.subarray(surfaceOffset, surfaceOffset + 4));
    if (surfaceMagic !== 'IDP3') throw new Error(`MD3 surface ${surfaceIndex} has invalid magic.`);

    const surfaceName = cString(bytes.subarray(surfaceOffset + 4, surfaceOffset + 68));
    const surfaceFrames = view.getInt32(surfaceOffset + 72, true);
    const numShaders = view.getInt32(surfaceOffset + 76, true);
    const numVerts = view.getInt32(surfaceOffset + 80, true);
    const numTriangles = view.getInt32(surfaceOffset + 84, true);
    const ofsTriangles = view.getInt32(surfaceOffset + 88, true);
    const ofsShaders = view.getInt32(surfaceOffset + 92, true);
    const ofsST = view.getInt32(surfaceOffset + 96, true);
    const ofsXYZNormal = view.getInt32(surfaceOffset + 100, true);
    const ofsEnd = view.getInt32(surfaceOffset + 104, true);

    if (surfaceFrames < 1 || numVerts < 1 || numTriangles < 1 || ofsEnd <= 0) {
      surfaceOffset += Math.max(108, ofsEnd);
      continue;
    }

    const positions = new Float32Array(numVerts * 3);
    const uvs = new Float32Array(numVerts * 2);
    const indices = new Uint32Array(numTriangles * 3);

    assertRange(view, surfaceOffset + ofsXYZNormal, numVerts * 8, 'first-frame vertices');
    for (let i = 0; i < numVerts; i += 1) {
      const p = surfaceOffset + ofsXYZNormal + i * 8;
      const x = view.getInt16(p, true) * MD3_XYZ_SCALE;
      const y = view.getInt16(p + 2, true) * MD3_XYZ_SCALE;
      const z = view.getInt16(p + 4, true) * MD3_XYZ_SCALE;
      // id Tech/Raven is Z-up; the Atom viewer is Y-up.
      positions[i * 3] = x;
      positions[i * 3 + 1] = z;
      positions[i * 3 + 2] = -y;
    }

    assertRange(view, surfaceOffset + ofsST, numVerts * 8, 'texture coordinates');
    for (let i = 0; i < numVerts; i += 1) {
      const p = surfaceOffset + ofsST + i * 8;
      uvs[i * 2] = view.getFloat32(p, true);
      uvs[i * 2 + 1] = 1 - view.getFloat32(p + 4, true);
    }

    assertRange(view, surfaceOffset + ofsTriangles, numTriangles * 12, 'triangles');
    for (let i = 0; i < numTriangles * 3; i += 1) {
      indices[i] = view.getInt32(surfaceOffset + ofsTriangles + i * 4, true);
    }

    let shaderName = '';
    if (numShaders > 0) {
      assertRange(view, surfaceOffset + ofsShaders, 68, 'shader');
      shaderName = cString(bytes.subarray(surfaceOffset + ofsShaders, surfaceOffset + ofsShaders + 64));
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(new THREE.BufferAttribute(indices, 1));
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    const material = materialFactory?.({ surfaceName, shaderName })
      || new THREE.MeshStandardMaterial({ color: 0x777d84, metalness: 0.82, roughness: 0.3 });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = surfaceName || `surface_${surfaceIndex}`;
    mesh.castShadow = true;
    root.add(mesh);

    surfaceOffset += ofsEnd;
  }

  if (!root.children.length) throw new Error('MD3 did not contain a usable surface.');
  return root;
}
