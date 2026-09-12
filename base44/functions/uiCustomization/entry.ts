import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

type AnyObj = Record<string, any>;

const MAX_ELEMENT_SETTINGS = 160;
const VALID_PRESETS = new Set(['graphite', 'sapphire_green', 'dragon_motion', 'violet_flux']);
const VALID_SURFACES = new Set(['inherit', 'glass', 'matte', 'clear', 'holo']);
const VALID_BORDERS = new Set(['inherit', 'none', 'soft', 'glow']);

function clamp(value: unknown, min: number, max: number, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(min, Math.min(max, n)) : fallback;
}

function safeColor(value: unknown) {
  const color = String(value || '').trim();
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#7dd3fc';
}

function sanitizeElements(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const entries = Object.entries(input as AnyObj).slice(0, MAX_ELEMENT_SETTINGS);
  const clean: AnyObj = {};

  for (const [rawKey, rawValue] of entries) {
    const key = String(rawKey || '').slice(0, 180);
    if (!key || !rawValue || typeof rawValue !== 'object' || Array.isArray(rawValue)) continue;
    const value = rawValue as AnyObj;
    clean[key] = {
      surface: VALID_SURFACES.has(value.surface) ? value.surface : 'inherit',
      border: VALID_BORDERS.has(value.border) ? value.border : 'inherit',
      accent: safeColor(value.accent),
      radius: clamp(value.radius, 0, 48, 18),
      scale: clamp(value.scale, 0.75, 1.25, 1),
      opacity: clamp(value.opacity, 0.35, 1, 1),
    };
  }

  return clean;
}

function normalizeScope(value: unknown) {
  return String(value || 'global:main')
    .replace(/[^a-zA-Z0-9:_\-./]/g, '')
    .slice(0, 160) || 'global:main';
}

function publicState(row: AnyObj | null, pageScope: string) {
  if (!row) {
    return {
      pageScope,
      presetId: 'graphite',
      elementSettings: {},
      updatedAt: 0,
    };
  }
  return {
    pageScope: row.page_scope,
    presetId: VALID_PRESETS.has(row.preset_id) ? row.preset_id : 'graphite',
    elementSettings: sanitizeElements(row.element_settings),
    updatedAt: Number(row.updated_at_client || 0),
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const authed = await base44.auth.me();
    if (!authed?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action || 'getState');
    const payload = body?.payload || {};
    const pageScope = normalizeScope(payload.pageScope);

    const rows = await base44.asServiceRole.entities.UICustomizationPreference.filter(
      { user_id: authed.id, page_scope: pageScope },
      '-updated_date',
      1,
    );
    const existing = rows?.[0] || null;

    if (action === 'getState') {
      return Response.json({ success: true, state: publicState(existing, pageScope) });
    }

    if (action !== 'saveState') {
      return Response.json({ error: 'Invalid action' }, { status: 400 });
    }

    const presetId = VALID_PRESETS.has(payload.presetId) ? payload.presetId : 'graphite';
    const elementSettings = sanitizeElements(payload.elementSettings);
    const updatedAt = Math.max(0, Math.floor(Number(payload.updatedAt || Date.now())));
    const patch = {
      user_id: authed.id,
      page_scope: pageScope,
      preset_id: presetId,
      element_settings: elementSettings,
      updated_at_client: updatedAt,
    };

    let saved;
    if (existing?.id) {
      saved = await base44.asServiceRole.entities.UICustomizationPreference.update(existing.id, patch);
    } else {
      saved = await base44.asServiceRole.entities.UICustomizationPreference.create(patch);
    }

    return Response.json({ success: true, state: publicState(saved, pageScope) });
  } catch (error) {
    return Response.json({ error: error?.message || String(error) }, { status: 400 });
  }
});