import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function AIBattle() {
  const navigate = useNavigate();
  useEffect(() => {
    sessionStorage.setItem('luna_open_ai_battle', '1');
    navigate(createPageUrl('LunaTemplate'), { replace: true });
  }, [navigate]);
  return null;
}
