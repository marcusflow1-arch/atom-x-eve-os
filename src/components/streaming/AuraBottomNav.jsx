import { NavLink, useLocation } from 'react-router-dom';
import { Home, Radio, Compass, ListVideo } from 'lucide-react';
import './hub/consoleHub.css';

export default function AuraBottomNav() {
  const { pathname } = useLocation();
  const path = pathname.toLowerCase();
  return <nav className="aura-console-nav" aria-label="Streaming navigation">
    <NavLink to="/streaming" className={`aura-streamers-link ${path === '/streaming' ? 'is-active' : ''}`} end><ListVideo size={16} /><span>Streamers</span></NavLink>
    <div className="aura-console-center">
      <NavLink to="/discover" className={path === '/discover' ? 'is-active' : ''} end><Compass size={16} /><span>Discover</span></NavLink>
      <NavLink to="/streaminghome" className={path === '/streaminghome' ? 'is-active' : ''} end><Home size={16} /><span>Home</span></NavLink>
      <NavLink to="/aura" className={path === '/aura' ? 'is-active' : ''} end><Radio size={16} /><span>Aura</span></NavLink>
    </div>
  </nav>;
}
