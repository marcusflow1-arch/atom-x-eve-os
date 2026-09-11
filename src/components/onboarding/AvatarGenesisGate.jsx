import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import CompanionIdentityProvider from '@/components/onboarding/CompanionIdentityContext';
import GenesisWizard from '@/components/onboarding/GenesisWizard';
import GenesisLoadingScreen from '@/components/onboarding/GenesisLoadingScreen';
import '@/components/onboarding/genesis.css';

function hasCompletedGenesis(avatar, profile) {
  if (!avatar?.id || avatar.setup_status !== 'complete') return false;
  if (!profile?.completed) return false;
  if (!profile.display_name || !profile.username || !profile.date_of_birth) return false;
  if (profile.avatar_id && profile.avatar_id !== avatar.id) return false;
  return true;
}

export default function AvatarGenesisGate({ user, children }) {
  const [state, setState] = useState({ status: 'checking', avatar: null, profile: null, error: '' });
  const [attempt, setAttempt] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    if (!user?.id) {
      setState({ status: 'ready', avatar: null, profile: null, error: '' });
      return () => { active = false; };
    }

    setState({ status: 'checking', avatar: null, profile: null, error: '' });

    (async () => {
      try {
        // Always check both account-scoped records. Do not trust browser storage or
        // the mere existence of an Avatar row as proof that onboarding was finished.
        const [avatars, profiles] = await Promise.all([
          base44.entities.Avatar.filter({ user_id: user.id }, 'created_date', 1),
          base44.entities.OnboardingProfile.filter({ user_id: user.id, environment: 'live' }, 'created_date', 1),
        ]);

        const avatar = avatars[0] || null;
        const profile = profiles[0] || null;
        const ready = hasCompletedGenesis(avatar, profile);

        if (active) {
          setState({
            status: ready ? 'ready' : 'setup',
            avatar,
            profile,
            error: '',
          });
        }
      } catch (error) {
        console.error('Avatar genesis check failed:', error);
        if (active) {
          setState({
            status: 'error',
            avatar: null,
            profile: null,
            error: 'We could not retrieve your saved companion. Retry to reconnect; your identity has not been reset.',
          });
        }
      }
    })();

    return () => { active = false; };
  }, [user?.id, attempt]);

  const complete = (avatar) => {
    sessionStorage.setItem(`atom_eve_intro_seen_session_${user?.id || 'guest'}`, 'true');
    setState({ status: 'ready', avatar, profile: null, error: '' });
    navigate('/LunaTemplate', { replace: true });
  };

  const preview = location.pathname === '/SetupPreview' && import.meta.env.DEV && user?.role === 'admin';

  if (state.status === 'error' && !preview) {
    return (
      <div className="genesis-surface genesis-shell genesis-success">
        <h1>Reconnect to your world.</h1>
        <p role="alert">{state.error}</p>
        <button className="genesis-primary" onClick={() => setAttempt((value) => value + 1)}>Retry connection</button>
      </div>
    );
  }

  return (
    <CompanionIdentityProvider avatar={state.avatar}>
      {preview || state.status === 'ready'
        ? children
        : state.status === 'setup'
          ? <GenesisWizard key={user.id} user={user} initialProfile={state.profile} onComplete={complete} />
          : null}
      <AnimatePresence>
        {state.status === 'checking' && !preview && <GenesisLoadingScreen label="Checking your identity" />}
      </AnimatePresence>
    </CompanionIdentityProvider>
  );
}
