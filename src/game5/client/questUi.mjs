/** UI derives state only from server snapshots; never optimistically awards/progresses. */
export const initialUiState = () => ({ snapshot: null, notice: '', error: '', busy: false });
export function reduceQuestUi(previous, action) {
  if (action.type === 'loading') return { ...previous, busy: true, error: '', notice: '' };
  if (action.type === 'response') {
    if (!action.payload || !action.payload.snapshot || !action.payload.snapshot.quest) {
      return { ...previous, busy: false, error: 'Invalid server quest snapshot' };
    }
    return { snapshot: structuredClone(action.payload.snapshot), notice: action.payload.notice || '', error: '', busy: false };
  }
  if (action.type === 'error') return { ...previous, busy: false, notice: '', error: String(action.message || 'Quest request failed') };
  return previous;
}
export function presentation(snapshot) {
  if (!snapshot?.quest) return { title: 'Connecting to development quest…', objective: '', status: 'loading', marker: '?' };
  const { quest } = snapshot;
  const current = quest.objective?.current ?? 0;
  const required = quest.objective?.required ?? 1;
  const statuses = {
    not_started: { objective: 'Speak with Elder Shen', marker: '!', button: 'Accept quest' },
    active: { objective: `Recover Lost Card · ${current}/${required}`, marker: '!', button: 'Quest in progress' },
    ready_to_complete: { objective: 'Return to Elder Shen · 1/1', marker: '?', button: 'Complete quest' },
    completed: { objective: 'Quest complete · 1/1', marker: '✓', button: 'Completed' },
  };
  const currentStatus = statuses[quest.status] ?? statuses.not_started;
  return { title: 'Retrieve the Lost Card', status: quest.status, ...currentStatus,
    testWallet: snapshot.testWallet ?? 0, cardCollected: snapshot.cardCollected === true };
}
