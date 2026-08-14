import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    developer_name: { type: 'string' }, tagline: { type: 'string' }, studio_type: { type: 'string' }, description: { type: 'string' }, founded_year: { type: 'number' }, headquarters: { type: 'string' }, employees: { type: 'string' }, parent_company: { type: 'string' }, website: { type: 'string' }, logo_url: { type: 'string' }, culture: { type: 'string' }, recruiting: { type: 'string' },
    known_for: { type: 'array', items: { type: 'string' } },
    team: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, role: { type: 'string' }, image_url: { type: 'string' }, games: { type: 'array', items: { type: 'string' } }, previous_studios: { type: 'array', items: { type: 'string' } }, interests: { type: 'array', items: { type: 'string' } } } } },
    notable_games: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, genre: { type: 'string' }, year: { type: 'number' }, description: { type: 'string' }, image_url: { type: 'string' }, status: { type: 'string' } } } },
    upcoming_projects: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, genre: { type: 'string' }, status: { type: 'string' }, release_window: { type: 'string' }, description: { type: 'string' }, image_url: { type: 'string' } } } },
  },
};

const memoryCache = new Map();
const profileIsModern = profile => Array.isArray(profile?.team) || Array.isArray(profile?.upcoming_projects);

export default function useStudioProfile(game) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const title = game?.title || null;
  const knownDev = game?.developer && !/unknown/i.test(game.developer) ? game.developer : null;

  useEffect(() => {
    if (!title) return;
    let cancelled = false;
    const gameKey = title.toLowerCase().trim();
    const cached = memoryCache.get(knownDev || gameKey);
    if (cached && profileIsModern(cached)) { setProfile(cached); setLoading(false); return; }

    const run = async () => {
      setLoading(true); setError(null); setProfile(null);
      if (knownDev) {
        const byDev = await base44.entities.StudioProfile.filter({ developer_name: knownDev });
        if (byDev?.length && profileIsModern(byDev[0])) { memoryCache.set(knownDev, byDev[0]); if (!cancelled) { setProfile(byDev[0]); setLoading(false); } return; }
      }
      const byGame = await base44.entities.StudioProfile.filter({ game_key: gameKey });
      if (byGame?.length && profileIsModern(byGame[0])) { memoryCache.set(gameKey, byGame[0]); if (byGame[0].developer_name) memoryCache.set(byGame[0].developer_name, byGame[0]); if (!cancelled) { setProfile(byGame[0]); setLoading(false); } return; }

      try {
        const data = await base44.integrations.Core.InvokeLLM({
          prompt: `Identify the real game development studio behind "${title}"${knownDev ? ` (listed developer: ${knownDev})` : ''}. Use factual public information only; never invent people, employment, games, projects, or hiring claims. Include the official studio name, studio type, tagline, detailed description, founded year, headquarters, approximate team size, parent company, website, logo URL when publicly available, known-for phrases, culture/work focus, recruiting/hiring information when public, up to 8 notable games, up to 8 publicly verifiable current team members/leaders with role, game credits, previous studios, and interests when documented, and up to 6 publicly documented upcoming/current projects with status, release window, genre, description, and image URL.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: RESPONSE_SCHEMA,
        });
        if (cancelled) return;
        const resolved = { ...data, developer_name: data?.developer_name || knownDev || 'Unknown Studio', game_key: gameKey };
        memoryCache.set(gameKey, resolved); memoryCache.set(resolved.developer_name, resolved); setProfile(resolved); setLoading(false);
        if (byDev?.[0]?.id) await base44.entities.StudioProfile.update(byDev[0].id, resolved).catch(() => {});
        else if (byGame?.[0]?.id) await base44.entities.StudioProfile.update(byGame[0].id, resolved).catch(() => {});
        else await base44.entities.StudioProfile.create(resolved).catch(() => {});
      } catch (err) { if (!cancelled) { setError(err); setLoading(false); } }
    };
    run();
    return () => { cancelled = true; };
  }, [title, knownDev]);

  return { profile, loading, error };
}
