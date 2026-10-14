import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { BODY_REGION_MANIFESTS, regionShader, patchRegionMaterial, regionTargets, applyRegionAppearance, regionColorKey } from '../src/components/onboarding/bodyRegions.js';
import { inspectCustomization, applyCustomizationAppearance } from '../src/components/onboarding/customizationRuntime.js';

const manifestOf = (material) => JSON.parse(fs.readFileSync('public' + BODY_REGION_MANIFESTS[material], 'utf8'));
const pngSize = (file) => { const b = fs.readFileSync(file); assert.equal(b.readUInt32BE(0), 0x89504e47, file + ' is a PNG'); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('both bodies ship region masks that match their manifests', () => {
  for (const [material, url] of Object.entries(BODY_REGION_MANIFESTS)) {
    const m = manifestOf(material), dir = 'public' + url.slice(0, url.lastIndexOf('/') + 1);
    assert.equal(m.material, material);
    assert.ok(fs.existsSync(m.source), m.source);
    assert.deepEqual(m.regions.slice(0, 2).map((r) => r.id), ['skin', 'hair']);
    assert.ok(m.regions.length >= 4, 'skin, hair and at least two garments');
    assert.equal(m.textures.length, Math.ceil(m.regions.length / 4));
    for (const name of m.textures) assert.deepEqual(pngSize(dir + name), [m.size, m.size]);
    m.regions.forEach((r, i) => {
      assert.equal(r.texture, i >> 2); assert.equal(r.channel, 'rgba'[i & 3]);
      assert.ok(r.reference.every((v) => v > 0 && v < 1), r.id + ' reference colour');
      assert.ok(r.coverage > 0.03, `${material} ${r.id} covers ${r.coverage} of the body`);
    });
    const total = m.regions.reduce((a, r) => a + r.coverage, 0);
    assert.ok(total > 0.8 && total < 1.05, `${material}: regions cover ${total.toFixed(2)} of the atlas without double counting`);
  }
});

test('the region shader samples every mask channel once and recolours only enabled regions', () => {
  const m = manifestOf('M_Character'), { head, body } = regionShader(m);
  assert.match(head, /uniform sampler2D avatarRegionMask0;/); assert.match(head, /uniform sampler2D avatarRegionMask1;/);
  assert.match(head, new RegExp(`uniform float avatarRegionOn\\[${m.regions.length}\\];`));
  m.regions.forEach((r, i) => assert.ok(body.includes(`avatarMask${r.texture}.${r.channel} * avatarRegionOn[${i}]`), r.id));
  assert.match(body, /avatarSkinWeight = avatarMask0\.r;/);
  assert.match(body, /#ifdef USE_MAP/);
});

test('patching keeps earlier shader hooks, separates the program and injects after the base colour', () => {
  const m = manifestOf('M_Artemis'), material = new THREE.MeshStandardMaterial({ name: 'M_Artemis', map: new THREE.Texture() });
  let earlier = 0; material.onBeforeCompile = () => { earlier++; };
  patchRegionMaterial(material, m, m.textures.map(() => new THREE.Texture()));
  assert.equal(material.defines.AVATAR_REGIONS, m.regions.length);
  const shader = { uniforms: {}, fragmentShader: '#include <common>\nvoid main(){\n#include <map_fragment>\n#include <roughnessmap_fragment>\n}', vertexShader: '' };
  material.onBeforeCompile(shader, null);
  assert.equal(earlier, 1, 'the earlier hook (style / luna surface) still runs');
  assert.ok(shader.uniforms.avatarRegionMask0 && shader.uniforms.avatarRegionTarget);
  assert.ok(shader.fragmentShader.indexOf('avatarRecolor(diffuseColor.rgb') > shader.fragmentShader.indexOf('#include <map_fragment>'));
  assert.match(shader.fragmentShader, /roughnessFactor = mix\(roughnessFactor, avatarSkinRoughness/);
});

test('appearance maps to region colours: skin and hair from their fields, garments from material_colors', () => {
  const m = manifestOf('M_Character');
  assert.deepEqual(regionTargets(m, {}), m.regions.map(() => null));
  const appearance = { skin_tint_enabled: true, skin_tone: '#503326', hair_tint_enabled: false, hair_color: '#d4b278', material_colors: { [regionColorKey('shirt')]: '#6b2b2b', [regionColorKey('shorts')]: 'not-a-colour' } };
  const targets = Object.fromEntries(m.regions.map((r, i) => [r.id, regionTargets(m, appearance)[i]]));
  assert.deepEqual(targets, { skin: '#503326', hair: null, shirt: '#6b2b2b', shorts: null, leather: null });
  const material = new THREE.MeshStandardMaterial({ name: 'M_Character', map: new THREE.Texture() });
  patchRegionMaterial(material, m, m.textures.map(() => new THREE.Texture()));
  applyRegionAppearance(material, { ...appearance, skin_finish_enabled: true, skin_finish: 1 });
  const u = material.userData.avatarRegions.uniforms;
  assert.deepEqual(u.avatarRegionOn.value, [1, 0, 1, 0, 0]);
  const skin = new THREE.Color('#503326');
  assert.ok(Math.abs(u.avatarRegionTarget.value[0].x - skin.r) < 1e-6, 'targets are linear colours');
  assert.equal(u.avatarSkinRoughnessOn.value, 1); assert.ok(Math.abs(u.avatarSkinRoughness.value - 0.23) < 1e-6);
});

test('the editor sees skin, hair and garments on a masked body, and appearance updates reach the shader', () => {
  const m = manifestOf('M_Artemis'), material = new THREE.MeshStandardMaterial({ name: 'M_Artemis', map: new THREE.Texture(), color: 0xffffff });
  patchRegionMaterial(material, m, m.textures.map(() => new THREE.Texture()));
  const root = new THREE.Group(); root.add(new THREE.Mesh(new THREE.BufferGeometry(), material));
  const caps = inspectCustomization(root);
  assert.equal(caps.skin, true); assert.equal(caps.hair, true); assert.equal(caps.skinMask, true);
  assert.deepEqual(caps.garments.map((g) => g.id), m.regions.slice(2).map((r) => r.id));
  applyCustomizationAppearance(root, { hair_tint_enabled: true, hair_color: '#8670bc', skin_tint_enabled: true, skin_tone: '#32211b' });
  assert.deepEqual(material.userData.avatarRegions.uniforms.avatarRegionOn.value.slice(0, 2), [1, 1]);
  assert.equal(material.color.getHexString(), 'ffffff', 'the whole material is never tinted');
});
