import { useEffect, useRef, useState } from 'react';
import {useNavigate} from 'react-router-dom';
import GameRewards from './detail/GameRewards';
import { ArrowLeft, ArrowRight, Check, ChevronRight, Cpu, Sparkles } from 'lucide-react';
import GameGallery from './detail/GameGallery';
import GamePurchasePanel from './detail/GamePurchasePanel';
import GameReviews from './detail/GameReviews';
import GameExtras from './detail/GameExtras';
import GameDLCSection from './detail/GameDLCSection';
import GameImage from './detail/GameImage';
import { gameArtwork, releaseLabel, requirementGroups } from './detail/gameDetailData';
import { label, comingSoon } from '@/components/store/redesign/discovery';
import './detail/game-detail.css';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'requirements', label: 'System requirements' },
  { id: 'reviews', label: 'Reviews' },
  { id: 'extras', label: 'Expansions & Cards' },
];

export default function GameDetailPanel({ game, onClose, returnLabel = 'Store' }) {
  const navigate=useNavigate();
  const [section, setSection] = useState('overview');
  const content = useRef(null);
  const tabRefs = useRef([]);
  useEffect(() => {
    const showExtras = () => {
      setSection('extras');
      content.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    };
    window.addEventListener('showDevZone', showExtras);
    return () => window.removeEventListener('showDevZone', showExtras);
  }, []);
  const groups = requirementGroups(game);
  const jump = id => { setSection(id); content.current?.scrollIntoView({ block: 'start', behavior: 'auto' }); };

  return <main className="gd-page" aria-label={game.title + ' game page'}>
    <div className="gd-backdrop" aria-hidden="true"><GameImage src={gameArtwork(game)} fallback={game.cover_image} alt="" /><div /></div>
    <div className="gd-shell">
      <nav className="gd-store-links" aria-label="Explore this game"><button onClick={()=>navigate('/Store')}>Browse store</button><button onClick={()=>requestAnimationFrame(()=>document.getElementById('game-avatar-rewards')?.scrollIntoView({block:'start'}))}>Achievements &amp; rewards</button><button onClick={()=>{setSection('extras');requestAnimationFrame(()=>content.current?.scrollIntoView({block:'start'}));}}>Expansions &amp; Cards</button></nav>
      <nav className="gd-breadcrumb" aria-label="Breadcrumb">
        <button onClick={onClose}><ArrowLeft size={16} />{returnLabel}</button>
        <ChevronRight size={12} /><span>{label(game.genre) || 'Game'}</span>
      </nav>
      <header className="gd-title-block">
        <div className="gd-title-meta"><span className="gd-eyebrow">Game overview</span><span className="gd-availability">{comingSoon(game) ? 'Coming soon' : <><Check size={12} />Available now</>}</span></div>
        <h1>{game.title}</h1>
      </header>

      <div className="gd-hero-grid">
        <GameGallery game={game} />
        <GamePurchasePanel game={game} />
      </div>
      <GameRewards game={game}/>
      <GameDLCSection game={game} />
      <div className="gd-details" ref={content}>
        <div className="gd-tablist" role="tablist" aria-label="Game details">
          {sections.map((tab, index) => <button key={tab.id} id={'gd-tab-' + tab.id} ref={node => { tabRefs.current[index] = node; }}
            role="tab" type="button" aria-selected={section === tab.id} aria-controls={'gd-panel-' + tab.id}
            tabIndex={section === tab.id ? 0 : -1} onClick={() => setSection(tab.id)} onKeyDown={event => {
              const direction = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
              if (!direction && !['Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === 'Home' ? 0 : event.key === 'End' ? sections.length - 1 : (index + direction + sections.length) % sections.length;
              setSection(sections[next].id); tabRefs.current[next]?.focus();
            }}>{tab.label}</button>)}
        </div>
        {sections.map(tab => <section key={tab.id} role="tabpanel" id={'gd-panel-' + tab.id} aria-labelledby={'gd-tab-' + tab.id} tabIndex={0} hidden={section !== tab.id} className="gd-tab-panel">
          {section === tab.id && (tab.id === 'overview' ? <div className="gd-about-grid">
            <div><span className="gd-eyebrow">About the game</span><h2>About {game.title}</h2>
              <div className="gd-description">{(game.description || 'The developer has not added a description yet.').split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
              {Array.isArray(game.features) && !!game.features.length && <ul className="gd-feature-list">{game.features.filter(feature => typeof feature === 'string').map(feature => <li key={feature}><Check size={15} />{feature}</li>)}</ul>}
            </div>
            <aside className="gd-explore">
              <span className="gd-eyebrow">Before you jump in</span>
              <button onClick={() => jump('requirements')}><Cpu size={20} /><span><strong>Check your setup</strong><small>System requirements</small></span><ArrowRight size={17} /></button>
              <button onClick={() => jump('extras')}><Sparkles size={20} /><span><strong>Explore Expansions &amp; Cards</strong><small>Game cards and your Luna 3D viewer</small></span><ArrowRight size={17} /></button>
              <dl><div><dt>Released</dt><dd>{releaseLabel(game)}</dd></div>{game.version && <div><dt>Version</dt><dd>{game.version}</dd></div>}</dl>
            </aside>
          </div> : tab.id === 'requirements' ? <div>
            <div className="gd-section-heading"><div><span className="gd-eyebrow">Check your setup</span><h2>System requirements</h2><p>Specifications provided for this game.</p></div></div>
            {groups.length ? <div className="gd-requirements">{groups.map(group => <section key={group.title}><h3>{group.title}</h3><dl>{group.rows.map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value}</dd></div>)}</dl></section>)}</div> : <div className="gd-empty"><Cpu size={28} /><h3>Requirements haven't been published yet.</h3><p>Check back for hardware and platform details from the developer.</p></div>}
          </div> : tab.id === 'reviews' ? <GameReviews game={game} /> : <GameExtras game={game} />)}
        </section>)}
      </div>
    </div>
  </main>;
}
