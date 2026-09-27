// PlayerState.active_match_id is a presence hint, not an authorization record.
// It can be missing, stale or changed by its owner; verify actual membership.
// Let database failures propagate so callers refuse loadout mutations.
export async function hasLivePvpMatch(svc: any, userId: string): Promise<boolean> {
  const matches = await svc.AIBattleMatch.filter({
    player_ids: { $in: [String(userId)] },
    status: { $in: ['matched', 'countdown', 'fighting'] },
  }, '-created_date', 1);
  return matches.length > 0;
}
