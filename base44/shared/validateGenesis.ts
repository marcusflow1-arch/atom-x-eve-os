import {normalizeAvatarAppearance} from './normalizeAvatarAppearance.ts';
const APP_FILE_PREFIX = 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/';
const GLOBAL_AVATAR_MODEL = '/models/luna-hi3d/warrior.glb';
const STYLE_PRESETS = new Set(['heroic_fantasy', 'graphic_ink', 'grounded_rpg']);
const LASH_STYLES = new Set(['soft', 'natural', 'bold']);

function validHex(value, fallback) {
  return /^#[0-9a-f]{6}$/i.test(String(value || '')) ? String(value) : fallback;
}

function bounded(value, min, max, fallback = 1) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : fallback;
}

export function validateGenesis(input) {
  const p = input.profile || {}, c = input.companion || {};
  const display_name = String(p.display_name || '').trim(), username = String(p.username || '').trim();
  if (!display_name || display_name.length > 80 || username.length < 3 || username.length > 30) throw new Error('Enter your name and a username between 3 and 30 characters.');
  const dob = String(p.date_of_birth || '');
  const birthday = new Date(dob + 'T00:00:00Z'), cutoff = new Date();
  cutoff.setUTCFullYear(cutoff.getUTCFullYear() - 13);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !Number.isFinite(birthday.getTime()) || birthday.toISOString().slice(0,10) !== dob || birthday > cutoff || birthday < new Date('1900-01-01')) throw new Error('Enter a valid date of birth. You must be at least 13.');
  const phone = String(p.phone || '').trim();
  if (phone && (!/^[+\d\s().-]{7,30}$/.test(phone) || phone.replace(/\D/g,'').length < 7)) throw new Error('Enter a valid phone number or leave it blank.');
  if (!['male','female'].includes(c.gender) || !String(c.name || '').trim() || String(c.name).length > 40) throw new Error('Choose a companion and enter a name up to 40 characters.');
  if (!['calm','warm','curious'].includes(c.personality)) throw new Error('Choose a personality.');

  const height = Number(c.height_scale), pitch = Number(c.voice?.pitch), rate = Number(c.voice?.rate);
  if (!(height >= .84 && height <= 1.18 && pitch >= .6 && pitch <= 1.4 && rate >= .7 && rate <= 1.3)) throw new Error('Appearance or voice settings are outside the supported range.');
  const bodyWidth = bounded(c.body_proportions?.width, .88, 1.12, 1);
  const bodyDepth = bounded(c.body_proportions?.depth, .9, 1.1, 1);
  const colors = Object.entries(c.material_colors || {}), morphs = Object.entries(c.morph_targets || {});
  if (colors.length > 100 || morphs.length > 100 || colors.some(([k,v]) => k.length > 200 || !/^#[0-9a-f]{6}$/i.test(String(v))) || morphs.some(([k,v]) => k.length > 200 || typeof v !== 'number' || v < 0 || v > 1)) throw new Error('Invalid appearance settings.');

  const defaultModel = GLOBAL_AVATAR_MODEL;
  const requestedModel = String(c.model_url || '');
  const model_url = requestedModel === GLOBAL_AVATAR_MODEL || requestedModel.startsWith(APP_FILE_PREFIX)
    ? requestedModel.slice(0, 1000)
    : defaultModel;
  const style_preset = STYLE_PRESETS.has(c.style_preset) ? c.style_preset : 'heroic_fantasy';
  const eyelash_style = LASH_STYLES.has(c.eyelash_style) ? c.eyelash_style : 'natural';
  const faceModelRequested = String(c.face_model_url || '');
  const face_model_url = faceModelRequested.startsWith(APP_FILE_PREFIX) ? faceModelRequested.slice(0, 1000) : '';
  const base_body_gender = c.gender === 'female' ? 'female' : 'male';
  const requestedBaseBody = String(c.base_body_model_url || model_url || defaultModel);
  const base_body_model_url = requestedBaseBody === GLOBAL_AVATAR_MODEL || requestedBaseBody.startsWith(APP_FILE_PREFIX)
    ? requestedBaseBody.slice(0, 1000)
    : defaultModel;

  return {
    profile: { display_name, username, date_of_birth: dob, phone },
    companion: {
      name: String(c.name).trim(),
      gender: c.gender,
      model_url,
      personality: c.personality,
      height_scale: height,
      body_proportions: { width: bodyWidth, depth: bodyDepth },
      style_preset,
      skin_tone: validHex(c.skin_tone, '#b97855'),
      eye_color: validHex(c.eye_color, '#5ca9c9'),
      hair_color: validHex(c.hair_color, '#2a1d18'),
      eyelash_style,
      hood_enabled: c.hood_enabled !== false,
      weapon_visible: c.weapon_visible !== false,
      face_scan_generated: Boolean(c.face_scan_generated && face_model_url),
      face_model_url,
      base_body_gender,
      base_body_model_url,
      tripo_model_id: String(c.tripo_model_id || '').slice(0, 120),
      material_colors: Object.fromEntries(colors),
      morph_targets: Object.fromEntries(morphs),
      voice: { uri: String(c.voice?.uri || '').slice(0,200), pitch, rate },
      ...normalizeAvatarAppearance(c),
      setup_version: 3,
    },
  };
}
