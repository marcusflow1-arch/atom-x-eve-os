import { useAuth } from '@/components/auth/AuthContext';
import { Link } from 'react-router-dom';
import useGameClaim, { storeError } from './useGameClaim';

export default function FreeGameClaim({ gameId }) {
  const { isAuthenticated, login } = useAuth();
  const claim = useGameClaim(gameId);
  const owned = claim.data?.owned;
  const pending = claim.data?.rewards_pending;
  const submit = () => {
    if (!isAuthenticated) { login(); return; }
    void claim.claim().catch(() => {});
  };
  return <div className="space-y-2">
    {owned && <p className="text-sm text-cyan-300" role="status">{pending ? 'In your library. Starter rewards are still pending.' : 'In your library.'}</p>}
    {(!owned || pending) && <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50" disabled={claim.busy || (isAuthenticated && claim.statusLoading)} onClick={submit}>
      {claim.busy ? 'Adding to your library…' : pending ? 'Retry starter rewards' : isAuthenticated ? 'Claim free game' : 'Sign in to claim'}
    </button>}
    {owned && <Link to="/Library" className="block text-sm text-cyan-300 underline">Open library</Link>}
    {claim.data?.legacy_rewards_unverified && <p className="text-sm text-amber-200">This older claim needs a starter-reward review.</p>}
    {claim.error && <p className="text-sm text-rose-300" role="alert">{storeError(claim.error)}</p>}
  </div>;
}
