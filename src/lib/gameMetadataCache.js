const PREFIX = 'atomxe:metadata:';

export function normalizeGameMetadata(game = {}) {
  const developer = game.developer || game.developer_name || game.studio || game.studio_name || game.developerStudio || '';
  const publisher = game.publisher || game.publisher_name || game.publishing_company || '';
  return {
    ...game,
    developer: developer || 'Developer Unknown',
    developer_name: developer || 'Developer Unknown',
    studio: developer || 'Developer Unknown',
    studio_name: developer || 'Developer Unknown',
    publisher: publisher || developer || 'Publisher Unknown',
    publisher_name: publisher || developer || 'Publisher Unknown',
    retailer: 'Atom X Eve',
    retailer_type: 'Digital Retailer / Platform Storefront',
    metadata_cached_at: new Date().toISOString(),
  };
}

export function getCachedGame(id) {
  if (!id || typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(`${PREFIX}game:${id}`) || 'null'); } catch { return null; }
}

export function cacheGame(game) {
  if (!game?.id || typeof window === 'undefined') return game;
  const normalized = normalizeGameMetadata(game);
  try { localStorage.setItem(`${PREFIX}game:${game.id}`, JSON.stringify(normalized)); } catch (e) { console.warn('Game metadata cache unavailable:', e); }
  return normalized;
}

export function getCachedStudio(key = 'default') {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(`${PREFIX}studio:${key}`) || 'null'); } catch { return null; }
}

export function cacheStudio(studio, key = 'default') {
  if (typeof window === 'undefined' || !studio) return studio;
  const normalized = {
    ...studio,
    developer: studio.developer || studio.name || 'Developer Unknown',
    publisher: studio.publisher || studio.developer || studio.name || 'Publisher Unknown',
    retailer: 'Atom X Eve',
    retailer_type: 'Digital Retailer / Platform Storefront',
    metadata_cached_at: new Date().toISOString(),
  };
  try { localStorage.setItem(`${PREFIX}studio:${key}`, JSON.stringify(normalized)); } catch (e) { console.warn('Studio metadata cache unavailable:', e); }
  return normalized;
}
