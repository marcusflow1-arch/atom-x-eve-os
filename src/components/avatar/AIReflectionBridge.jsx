import { useEffect } from 'react';
import { trackPlayerDecision } from '@/lib/atomTelemetry';

// Runtime bridge for games and interactive experiences hosted inside Atom × Eve.
// A supported game can dispatch:
// window.dispatchEvent(new CustomEvent('atom:player-decision', { detail: {...decisionPayload} }))
// and the decision is persisted into the player's evolving AI behavior state.
export default function AIReflectionBridge() {
  useEffect(() => {
    const onDecision = (event) => {
      const detail = event?.detail;
      if (!detail?.decision_type || !detail?.choice_made) return;
      trackPlayerDecision(detail);
    };
    window.addEventListener('atom:player-decision', onDecision);
    return () => window.removeEventListener('atom:player-decision', onDecision);
  }, []);
  return null;
}
