import * as THREE from 'three';

// Recolour regions for the character bodies, whose skin, hair and clothes share one painted texture atlas.
// tools/avatar-regions/bake-regions.mjs bakes, per body, mask textures (one region per channel) and a manifest with
// each region's reference colour. The body material samples the masks in its fragment shader and recolours each
// region towards the chosen colour while keeping the painted shading, folds and details.
export const BODY_REGION_MANIFESTS = {
  M_Character: '/models/characters/regions/getsuga-v4/regions.json',
  M_Artemis: '/models/characters/regions/artemis-v4/regions.json',
};
// skin and hair use the appearance's own skin_tone / hair_color; every other region is a garment, coloured through
// material_colors['region:<id>']
export const regionColorKey = (id) => 'region:' + id;
const HEX = /^#[0-9a-f]{6}$/i;

// Statistics transfer in gamma-encoded luma / chroma (YCbCr): the region's average moves to the chosen colour and every
// texel keeps its painted offset from that average (folds, muscle lines, strands, rosy cheeks). Contrast scales with
// the change in lightness (black hair made blond keeps visible strands; dark skin softens the painted lines) and the
// chroma offsets with the change in saturation. Very light choices are eased so they read as pale, not glowing.
const RECOLOR = `
vec3 avatarToYcc(vec3 lin) {
 vec3 g = pow(max(lin, vec3(0.0)), vec3(1.0 / 2.2));
 return vec3(dot(g, vec3(.299, .587, .114)), dot(g, vec3(-.168736, -.331264, .5)), dot(g, vec3(.5, -.418688, -.081312)));
}
vec3 avatarFromYcc(vec3 y) {
 vec3 g = vec3(y.x + 1.402 * y.z, y.x - .344136 * y.y - .714136 * y.z, y.x + 1.772 * y.y);
 return pow(max(g, vec3(0.0)), vec3(2.2));
}
vec3 avatarRecolor(vec3 c, vec3 ref, vec3 target) {
 vec3 yc = avatarToYcc(c), yr = avatarToYcc(ref), yt = avatarToYcc(target);
 yt.x = yt.x < .55 ? yt.x : .55 + (yt.x - .55) * .45;
 float contrast = clamp(sqrt(max(yt.x, .02) / max(yr.x, .02)), .55, 2.6);
 float saturation = clamp(length(yt.yz) / max(length(yr.yz), .02), .65, 1.3);
 vec3 o = vec3(yt.x + (yc.x - yr.x) * contrast, yt.yz + (yc.yz - yr.yz) * saturation);
 o.x = o.x < .8 ? o.x : .8 + .2 * (1.0 - exp(-(o.x - .8) / .2)); // painted highlights roll off instead of clipping
 return avatarFromYcc(o);
}
`;

// GLSL for a manifest: declarations and the block that runs right after the base colour texture is applied
export function regionShader(manifest) {
  const n = manifest.regions.length, textures = manifest.textures.length;
  const skin = manifest.regions.findIndex((r) => r.id === 'skin');
  const head = [
    ...Array.from({ length: textures }, (_, t) => `uniform sampler2D avatarRegionMask${t};`),
    `uniform float avatarRegionOn[${n}];`, `uniform vec3 avatarRegionTarget[${n}];`, `uniform vec3 avatarRegionReference[${n}];`,
    'uniform float avatarSkinRoughness;', 'uniform float avatarSkinRoughnessOn;', RECOLOR,
  ].join('\n');
  const body = [
    'float avatarSkinWeight = 0.0;',
    '#ifdef USE_MAP',
    '{',
    ...Array.from({ length: textures }, (_, t) => ` vec4 avatarMask${t} = texture2D(avatarRegionMask${t}, vMapUv);`),
    ...manifest.regions.map((r, i) => ` diffuseColor.rgb = mix(diffuseColor.rgb, avatarRecolor(diffuseColor.rgb, avatarRegionReference[${i}], avatarRegionTarget[${i}]), avatarMask${r.texture}.${r.channel} * avatarRegionOn[${i}]);`),
    skin >= 0 ? ` avatarSkinWeight = avatarMask${manifest.regions[skin].texture}.${manifest.regions[skin].channel};` : '',
    '}',
    '#endif',
  ].join('\n');
  return { head, body };
}

export function patchRegionMaterial(material, manifest, textures) {
  const n = manifest.regions.length;
  const uniforms = {
    avatarRegionOn: { value: new Array(n).fill(0) },
    avatarRegionTarget: { value: manifest.regions.map(() => new THREE.Vector3(1, 1, 1)) },
    avatarRegionReference: { value: manifest.regions.map((r) => new THREE.Vector3(...r.reference)) },
    avatarSkinRoughness: { value: 0.6 },
    avatarSkinRoughnessOn: { value: 0 },
  };
  textures.forEach((texture, t) => { uniforms['avatarRegionMask' + t] = { value: texture }; });
  const { head, body } = regionShader(manifest);
  material.userData.avatarRegions = { manifest, uniforms };
  // defines are part of three's program cache key, so this program is never shared with an unpatched material
  // (other appearance code sets its own customProgramCacheKey)
  material.defines = { ...(material.defines || {}), AVATAR_REGIONS: n };
  const previous = material.onBeforeCompile;
  material.onBeforeCompile = function (shader, renderer) {
    previous?.call(this, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + head)
      .replace('#include <map_fragment>', '#include <map_fragment>\n' + body)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, avatarSkinRoughness, avatarSkinWeight * avatarSkinRoughnessOn);');
  };
  material.needsUpdate = true;
  return material.userData.avatarRegions;
}

// the colour each region should take for an appearance, or null for the painted original
export function regionTargets(manifest, appearance = {}) {
  return manifest.regions.map((r) => {
    const value = r.id === 'skin' ? (appearance.skin_tint_enabled ? appearance.skin_tone : null)
      : r.id === 'hair' ? (appearance.hair_tint_enabled ? appearance.hair_color : null)
        : appearance.material_colors?.[regionColorKey(r.id)];
    return HEX.test(String(value || '')) ? value : null;
  });
}

export function applyRegionAppearance(material, appearance = {}) {
  const state = material?.userData?.avatarRegions;
  if (!state) return false;
  const color = new THREE.Color();
  regionTargets(state.manifest, appearance).forEach((hex, i) => {
    state.uniforms.avatarRegionOn.value[i] = hex ? 1 : 0;
    if (hex) { color.set(hex); state.uniforms.avatarRegionTarget.value[i].set(color.r, color.g, color.b); } // linear
  });
  state.uniforms.avatarSkinRoughnessOn.value = appearance.skin_finish_enabled ? 1 : 0;
  state.uniforms.avatarSkinRoughness.value = THREE.MathUtils.lerp(0.9, 0.23, THREE.MathUtils.clamp(appearance.skin_finish ?? 0.35, 0, 1));
  return true;
}

export function regionCapabilities(root) {
  const out = { skin: false, hair: false, garments: [] };
  root?.traverse((node) => {
    if (!node.isMesh) return;
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
      for (const r of material?.userData?.avatarRegions?.manifest.regions || []) {
        if (r.id === 'skin') out.skin = true;
        else if (r.id === 'hair') out.hair = true;
        else if (!out.garments.some((g) => g.id === r.id)) out.garments.push({ id: r.id, label: r.label });
      }
    });
  });
  return out;
}

const manifests = new Map(), textureCache = new Map();
const loadManifest = (url) => {
  if (!manifests.has(url)) manifests.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error('region manifest ' + r.status); return r.json(); }).catch((error) => { manifests.delete(url); throw error; }));
  return manifests.get(url);
};
const loadMask = (url) => {
  if (!textureCache.has(url)) {
    textureCache.set(url, new THREE.TextureLoader().loadAsync(url).then((texture) => {
      texture.flipY = false; // glTF UV convention, like the atlas itself
      texture.colorSpace = THREE.NoColorSpace; // data, not colour
      texture.needsUpdate = true;
      return texture;
    }).catch((error) => { textureCache.delete(url); throw error; }));
  }
  return textureCache.get(url);
};

// Binds the region masks to every body material that has a baked manifest. Resolves to true when anything was bound;
// a body without masks (or a failed download) keeps its painted original and simply exposes no region controls.
export async function bindBodyRegions(root) {
  const targets = [];
  root?.traverse((node) => {
    if (!node.isMesh) return;
    (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) => {
      const url = BODY_REGION_MANIFESTS[material?.name];
      if (url && material.map && !material.userData.avatarRegions && !targets.some((t) => t.material === material)) targets.push({ material, url });
    });
  });
  let bound = false;
  for (const { material, url } of targets) {
    try {
      const manifest = await loadManifest(url);
      if (manifest.material !== material.name) continue;
      const base = url.slice(0, url.lastIndexOf('/') + 1);
      const textures = await Promise.all(manifest.textures.map((name) => loadMask(base + name)));
      if (!material.userData.avatarRegions) patchRegionMaterial(material, manifest, textures);
      bound = true;
    } catch (error) {
      console.warn('Body recolour regions unavailable:', error);
    }
  }
  return bound;
}
