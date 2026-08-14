import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    developer_name: { type: 'string' },
    tagline: { type: 'string' },
    studio_type: { type: 'string' },
    description: { type: 'string' },
    founded_year: { type: 'number' },
    headquarters: { type: 'string' },
    employees: { type: 'string' },
    parent_company: { type: 'string' },
    website: { type: 'string' },
    logo_url: { type: 'string' },
    culture: { type: 'string' },
    recruiting: { type: 'string' },
    known_for: { type: 'array', items: { type: 'string' } },
    team: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          role: { type: 'string' },
          image_url: { type: 'string' },
          games: { type: 'array', items: { type: 'string' } },
          previous_studios: { type: 'array', items: { type: 'string' } },
          interests: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    notable_games: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          genre: { type: 'string' },
          year: { type: 'number' },
          description: { type: 'string' },
          image_url: { type: 'string' },
          status: { type: 'string' }
        }
      }
    },
    upcoming_projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          genre: { type: 'string' },
          status: { type: 'string' },
          release_window: { type: 'string' },
          description: { type: 'string' },
          image_url: { type: 'string' }
        }
      }
    }
  }
};

const memoryCache = new Map();
const localCachePrefix = 'atomxe:studio-profile:';
const refreshWindowMs = 24 * 60 * 60 * 1000;

const profileKey = (developer, gameKey) => `${localCachePrefix}${(developer || gameKey || 'unknown').toLowerCase().trim()}`;
const isComplete = profile => Boolean(profile && (Array.isArray(profile.team) || Array.isArray(profile.upcoming_projects)));

function readLocalCache(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalCache(key, profile) {
  try { localStorage.setItem(key, JSON.stringify(profile)); } catch {}
}

function profileTimestamp(profile) {
  return new Date(profile?.last_refreshed_at || profile?.updated_date || profile?.created_date || 0).getTime();
}

export default function useStudioProfile(game) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const title = game?.title || null;
  const knownDev = game?.developer && !/unknown/i.test(game.developer) ? game.developer : null;

  useEffect(() => {
    if (!title) return;
    let cancelled = false;
    const gameKey = title.toLowerCase().trim();
    const cacheKey = profileKey(knownDev, gameKey);

    const local = readLocalCache(cacheKey);
    const memory = memoryCache.get(knownDev || gameKey);
    const immediate = (memory && isComplete(memory) ? memory : null) || (local && isComplete(local) ? local.profile || local : null);

    // Cached studio information is rendered immediately. A refresh never blocks the UI.
    if (immediate) {
      memoryCache.set(gameKey, immediate);
      if (immediate.developer_name) memoryCache.set(immediate.developer_name, immediate);
      setProfile(immediate);
      setLoading(false);
    } else {
      setLoading(true);
      setProfile(null);
    }

    const refreshIfNeeded = async () => {
      try {
        let existing = null;
        if (knownDev) existing = (await base44.entities.StudioProfile.filter({ developer_name: knownDev }))?.[0] || null;
        if (!existing) existing = (await base44.entities.StudioProfile.filter({ game_key: gameKey }))?.[0] || null;

        if (existing && isComplete(existing)) {
          memoryCache.set(gameKey, existing);
          if (existing.developer_name) memoryCache.set(existing.developer_name, existing);
          writeLocalCache(cacheKey, { profile: existing, cached_at: Date.now() });
          if (!cancelled && !immediate) { setProfile(existing); setLoading(false); }

          const age = Date.now() - profileTimestamp(existing);
          if (age < refreshWindowMs) return;

          if (!cancelled) setRefreshing(true);
          const data = await base44.integrations.Core.InvokeLLM({
            prompt: `Refresh the stored Atom XE studio profile for the real game development studio behind "${title}"${knownDev ? ` (listed developer: ${knownDev})` : ''}. Return only factual public information and never invent people, employment, games, projects, or hiring claims. Preserve previously known facts when still correct. Update only information that can be newly verified. Include studio type, description, team members/leaders, games they worked on, previous studios, publicly documented interests/specialties, recruiting/hiring information, and current/upcoming projects with status/release window.`,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
            response_json_schema: RESPONSE_SCHEMA,
          });
          if (cancelled) return;
          const refreshed = { ...existing, ...data, developer_name: data?.developer_name || existing.developer_name, game_key: existing.game_key || gameKey, last_refreshed_at: new Date().toISOString() };
          memoryCache.set(gameKey, refreshed);
          memoryCache.set(refreshed.developer_name, refreshed);
          writeLocalCache(cacheKey, { profile: refreshed, cached_at: Date.now() });
          setProfile(refreshed);
          if (existing.id) await base44.entities.StudioProfile.update(existing.id, refreshed).catch(() => {});
          if (!cancelled) setRefreshing(false);
          return;
        }

        // No usable saved profile: only now do we perform the first lookup.
        if (!cancelled) setLoading(true);
        const data = await base44.integrations.Core.InvokeLLM({
          prompt: `Identify the real game development studio behind "${title}"${knownDev ? ` (listed developer: ${knownDev})` : ''}. Use factual public information only; never invent people, employment, games, projects, or hiring claims. Include the official studio name, studio type, tagline, detailed description, founded year, headquarters, approximate team size, parent company, website, logo URL when publicly available, known-for phrases, culture/work focus, recruiting/hiring information when public, up to 8 notable games, up to 8 publicly verifiable current team members/leaders with role, game credits, previous studios, and interests when documented, and up to 6 publicly documented upcoming/current projects with status, release window, genre, description, and image URL.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: RESPONSE_SCHEMA,
        });
        if (cancelled) return;
        const resolved = { ...data, developer_name: data?.developer_name || knownDev || 'Unknown Studio', game_key: gameKey, last_refreshed_at: new Date().toISOString() };
        memoryCache.set(gameKey, resolved);
        memoryCache.set(resolved.developer_name, resolved);
        writeLocalCache(cacheKey, { profile: resolved, cached_at: Date.now() });
        setProfile(resolved);
        setLoading(false);
        setRefreshing(false);
        if (existing?.id) await base44.entities.StudioProfile.update(existing.id, resolved).catch(() => {});
        else await base44.entities.StudioProfile.create(resolved).catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setRefreshing(false);
          if (!profile) { setError(err); setLoading(false); }
        }
      }
    };

    refreshIfNeeded();
    return () => { cancelled = true; };
  }, [title, knownDev]);

  return { profile, loading, refreshing, error };
}
