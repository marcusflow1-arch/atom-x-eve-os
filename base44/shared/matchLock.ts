// PlayerState.active_match_id is a presence hint, not an authorization record.
// It can be missing, stale or changed by its owner; verify actual membership.
// Let database failures propagate so callers refuse loadout mutations.
export async function hasLivePvpMatch(svc: any, userId: string): Promise<boolean> {
  const id = String(userId);
  const matches = await svc.AIBattleMatch.filter({
    player_ids: { $in: [id] },
    status: { $in: ['countdown', 'fighting'] },
  }, '-created_date', 10);
  if (!matches.length) return false;

  // Loadouts remain editable while matchmaking is only `matched/loading`;
  // aiBattleMatchmaker re-freezes them immediately before countdown. Once the
  // countdown/fight begins, a stale/orphaned row must still not lock the Skill
  // Book forever. Treat it as live only with a live queue heartbeat or a valid
  // reconnect grace period.
  const queues = await svc.AIBattleQueueEntry.filter({ user_id: id }, '-created_date', 30);
  const now = Date.now();
  for (const match of matches) {
    const reconnectDeadline = Date.parse(match?.disconnects?.[id]?.reconnect_deadline || 0);
    if (reconnectDeadline > now) return true;
    const queue = queues.find((row: any) => row.status === 'matched' && String(row.match_id || '') === String(match.id));
    const lastSeen = Date.parse(queue?.last_seen_at || 0);
    if (queue && lastSeen > now - 30000) return true;
  }
  return false;
}
