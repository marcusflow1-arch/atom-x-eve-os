/** One saved Luna/AI (Revo) avatar identity across supported Atom-native games.
 * Game 2 is excluded until its separate remaster character system is approved.
 * This is presentation identity only; server authentication and progression remain separate.
 */
const EXCLUDED_GAMES = new Set(['game2', 'jedioutcast', 'jedi-outcast']);

export function revoEnabledForGame(gameKey) {
  return typeof gameKey === 'string' && gameKey.trim() !== '' &&
    !EXCLUDED_GAMES.has(gameKey.trim().toLowerCase().replace(/[ _]/g, ''));
}

/** Never synthesize a new avatar identity when the signed-in user's saved Avatar is missing. */
export function sharedRevoIdentity(avatar, gameKey) {
  if (!revoEnabledForGame(gameKey) || !avatar || typeof avatar.id !== 'string' || !avatar.id.trim()) return null;
  return Object.freeze({
    avatarId: avatar.id,
    name: typeof avatar.name === 'string' && avatar.name.trim() ? avatar.name.trim() : 'Revo',
    sharedAcrossGames: true,
  });
}
