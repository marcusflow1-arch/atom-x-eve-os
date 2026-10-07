import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import ReconstructionRuntime from '@/components/jedioutcast/ReconstructionRuntime';
import '@/components/jedioutcast/jedi-outcast.css';

export default function JediOutcast() {
  const navigate = useNavigate();
  return <main className="jko-page"><ReconstructionRuntime onBack={() => navigate(createPageUrl('LunaTemplate'))} /></main>;
}
