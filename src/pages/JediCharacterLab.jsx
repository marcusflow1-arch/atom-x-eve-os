import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import JediOutcastRuntime from '@/components/jedioutcast/JediOutcastRuntime';
import '@/components/jedioutcast/jedi-outcast.css';

export default function JediCharacterLab() {
  const navigate = useNavigate();

  return (
    <main className="jko-page">
      <JediOutcastRuntime
        mode="character-lab"
        minimalUi
        onBack={() => navigate(createPageUrl('LunaTemplate'))}
      />
    </main>
  );
}
