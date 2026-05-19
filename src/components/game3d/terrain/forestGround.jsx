// ─── Forest Ground ────────────────────────────────────────────────────────
// Procedural rolling-hill terrain mesh with vertex-color blending between
// grass / dirt / rock based on elevation and slope. Pure data + a small
// THREE.Mesh factory — no scene side effects.
//
// Height is sampled from a deterministic multi-octave value-noise function
// so other systems (prop placement, player foot-snap, colliders) can ask
// "what is Y at (x,z)?" without raycasting.

import * as THREE from 'three';

// Deterministic 2D hash → [0,1)
function hash2(ix, iz) {
  let h = (ix | 0) * 374761393 + (iz | 0) * 668265263;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function smooth(t) { return t * t * (3 - 2 * t); }

// Value noise — cheap, smooth, deterministic. Returns ~[-1, 1].
function valueNoise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const a = hash2(ix,     iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix,     iz + 1);
  const d = hash2(ix + 1, iz + 1);
  const u = smooth(fx), v = smooth(fz);
  const ab = a + (b - a) * u;
  const cd = c + (d - c) * u;
  return (ab + (cd - ab) * v) * 2 - 1;
}

/**
 * Sample terrain height at world-space (x, z).
 * Multi-octave so we get broad hills + medium bumps + fine roughness.
 */
export function sampleGroundY(x, z) {
  const big    = valueNoise(x * 0.012, z * 0.012) * 4.0;  // rolling hills
  const medium = valueNoise(x * 0.040, z * 0.040) * 1.2;  // mounds
  const small  = valueNoise(x * 0.130, z * 0.130) * 0.35; // roughness
  return big + medium + small;
}

/**
 * Approximate ground slope (0 = flat, ~1 = steep) using a 4-tap finite
 * difference. Used by the placement system to keep trees off cliff faces.
 */
export function sampleGroundSlope(x, z, eps = 1.2) {
  const hL = sampleGroundY(x - eps, z);
  const hR = sampleGroundY(x + eps, z);
  const hD = sampleGroundY(x, z - eps);
  const hU = sampleGroundY(x, z + eps);
  const dx = (hR - hL) / (2 * eps);
  const dz = (hU - hD) / (2 * eps);
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Build the ground mesh. Size = world units across, segments = grid
 * resolution. Vertex colors are baked from elevation + slope so the
 * terrain looks like blended grass/dirt/rock without any texture.
 */
export function buildForestGround({ size = 220, segments = 160 } = {}) {
  const geo = new THREE.PlaneGeometry(size, size, segments, segments);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  // Palette
  const cGrassDark  = new THREE.Color(0x3a5a2e);
  const cGrassLight = new THREE.Color(0x6e8f3e);
  const cDirt       = new THREE.Color(0x6b4a2b);
  const cMud        = new THREE.Color(0x4a341f);
  const cRock       = new THREE.Color(0x6a6a6a);

  const tmp = new THREE.Color();

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const y = sampleGroundY(x, z);
    pos.setY(i, y);

    const slope = sampleGroundSlope(x, z);

    // Base grass mix — vary light/dark by a low-frequency noise
    const grassMix = (valueNoise(x * 0.05, z * 0.05) + 1) * 0.5;
    tmp.copy(cGrassDark).lerp(cGrassLight, grassMix);

    // Low areas → muddier; very low → mud
    if (y < -0.2) {
      const t = THREE.MathUtils.clamp((-y - 0.2) / 1.5, 0, 1);
      tmp.lerp(cDirt, t * 0.55);
      if (y < -1.2) tmp.lerp(cMud, THREE.MathUtils.clamp((-y - 1.2) / 1.0, 0, 0.6));
    }

    // Steep slopes → rocky
    if (slope > 0.35) {
      const t = THREE.MathUtils.clamp((slope - 0.35) / 0.6, 0, 1);
      tmp.lerp(cRock, t * 0.75);
    }

    // High exposed peaks → lighter rocky tint
    if (y > 2.5) {
      const t = THREE.MathUtils.clamp((y - 2.5) / 2.0, 0, 1);
      tmp.lerp(cRock, t * 0.4);
    }

    colors[i * 3 + 0] = tmp.r;
    colors[i * 3 + 1] = tmp.g;
    colors[i * 3 + 2] = tmp.b;
  }

  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();

  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    flatShading: false,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'forest_ground';
  mesh.receiveShadow = true;
  return mesh;
}