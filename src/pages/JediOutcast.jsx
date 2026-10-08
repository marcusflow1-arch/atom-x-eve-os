import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import JediOutcastPlayableRuntime from '@/components/jedioutcast/JediOutcastPlayableRuntime';
import '@/components/jedioutcast/jedi-outcast.css';

export default function JediOutcast() {
  const navigate = useNavigate();
  return <main className="jko-page"><JediOutcastPlayableRuntime onBack={() => navigate(createPageUrl('LunaTemplate'))} /></main>;
}
