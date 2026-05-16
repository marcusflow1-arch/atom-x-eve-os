import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Tiny listener that surfaces skill-activation feedback as a toast.
// Mount once anywhere inside the game view.
export default function SkillActivationToastListener() {
  useEffect(() => {
    const onToast = (e) => {
      const text = e.detail?.text;
      if (text) toast(text, { duration: 2200 });
    };
    window.addEventListener('skillActivatedToast', onToast);
    return () => window.removeEventListener('skillActivatedToast', onToast);
  }, []);
  return null;
}