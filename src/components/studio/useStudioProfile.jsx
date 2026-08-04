import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    developer_name: { type: 'string' },
    tagline: { type: 'string' },
    description: { type: 'string' },
    founded_year: { type: 'number' },
    headquarters: { type: 'string' },
    employees: { type: 'string' },
    parent_company: { type: 'string' },
    website: { type: 'string' },
    logo_url: { type: 'string' },
    known_for: { type: 'array', items: { type: 'string' } },
    notable_games: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          genre: { type: 'string' },
          year: { type: 'number' },
        },
      },
    },
  },
};

/**
 * Resolves the REAL developer/studio behind a specific game, live from the web.
 * Results are cached per studio (and per game) so games sharing a developer
 * reuse the same profile instead of re-fetching.
 */
// In-session cache so re-opening the same studio is instant (no re-lookup).
const memoryCache = new Map();

export default function useStudioProfile(game) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const title = game?.title || null;
  const knownDev =
    game?.developer && !/unknown/i.test(game.developer) ? game.developer : null;

  useEffect(() => {
    if (!title) return;
    let cancelled = false;

    const gameKey = title.toLowerCase().trim();

    // 0. Instant: already resolved this session
    const cached = memoryCache.get(knownDev || gameKey);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      setError(null);
      setProfile(null);

      // 1. Cached by studio name (shared across that studio's games)
      if (knownDev) {
        const byDev = await base44.entities.StudioProfile.filter({ developer_name: knownDev });
        if (byDev?.length) {
          memoryCache.set(knownDev, byDev[0]);
          if (!cancelled) { setProfile(byDev[0]); setLoading(false); }
          return;
        }
      }

      // 2. Cached by game
      const byGame = await base44.entities.StudioProfile.filter({ game_key: gameKey });
      if (byGame?.length) {
        memoryCache.set(gameKey, byGame[0]);
        if (byGame[0].developer_name) memoryCache.set(byGame[0].developer_name, byGame[0]);
        if (!cancelled) { setProfile(byGame[0]); setLoading(false); }
        return;
      }

      // 3. Look it up live
      try {
        const data = await base44.integrations.Core.InvokeLLM({
          prompt: `Identify the real game development studio that developed the video game "${title}"${knownDev ? ` (listed developer: ${knownDev})` : ''}.
Return factual, real-world information about that studio only — never invent a studio.
Include: official studio name, a short tagline, a 2-3 sentence description of the studio and what it is known for, the year it was founded, headquarters city and country, approximate studio size, parent company (empty string if independent), official website URL, a direct URL to the studio's logo image if one is publicly available (otherwise empty string), 3-6 short "known for" phrases, and up to 8 notable games the studio developed with each game's primary genre and release year.`,
          add_context_from_internet: true,
          model: 'gemini_3_flash',
          response_json_schema: RESPONSE_SCHEMA,
        });

        if (cancelled) return;

        const resolved = {
          ...data,
          developer_name: data?.developer_name || knownDev || 'Unknown Studio',
          game_key: gameKey,
        };
        memoryCache.set(gameKey, resolved);
        memoryCache.set(resolved.developer_name, resolved);
        setProfile(resolved);
        setLoading(false);

        // Auto-save so it never has to be looked up again
        base44.entities.StudioProfile.create(resolved).catch(() => {});
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setLoading(false);
        }
      }
    };

    run();
    return () => { cancelled = true; };
  }, [title, knownDev]);

  return { profile, loading, error };
}