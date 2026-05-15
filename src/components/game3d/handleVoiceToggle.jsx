// Handles the backtick mic toggle for the proximity voice system.
// Provides clear on-screen toast feedback so the user always knows whether
// the mic is on, off, still initializing, or blocked by permissions.
import toast from 'react-hot-toast';

export function handleVoiceToggle(voiceRef, setLocalMicOn) {
  if (!voiceRef.current) {
    toast('🎙️ Voice chat still initializing... try again in a sec', {
      id: 'voice-init',
      duration: 2000,
      style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
    });
    return;
  }
  voiceRef.current.toggleMic().then((on) => {
    setLocalMicOn(!!on);
    if (on === false && voiceRef.current?.isMicOn() === false) {
      // Could be either an explicit toggle-off or a permission-denied false.
      // toggleMic returns false in both; the only way to know "denied" is the
      // event the proximityVoice module fires, handled separately below.
      toast('🔇 Mic OFF', {
        id: 'voice-toggle',
        duration: 1500,
        style: { background: '#1e293b', color: '#fff', border: '1px solid #334155' },
      });
    } else if (on) {
      toast('🎙️ Mic ON — Proximity voice active', {
        id: 'voice-toggle',
        duration: 1500,
        style: { background: '#064e3b', color: '#a7f3d0', border: '1px solid #10b981' },
      });
    }
  });
}

// Attach a one-time listener for the mic-permission-denied event the
// proximityVoice module dispatches when getUserMedia is rejected.
export function attachMicErrorListener() {
  const handler = () => {
    toast.error('⚠️ Microphone permission denied. Enable mic access in your browser to use voice chat.', {
      id: 'voice-error',
      duration: 4000,
    });
  };
  window.addEventListener('proximityVoiceMicError', handler);
  return () => window.removeEventListener('proximityVoiceMicError', handler);
}