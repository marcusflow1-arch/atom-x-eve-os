import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import GameRewards from './detail/GameRewards';
import { StudioGameViews, GameStreams } from './detail/GameCommunityViews';
import GameGallery from './detail/GameGallery';
import GamePurchasePanel from './detail/GamePurchasePanel';
import GameReviews from './detail/GameReviews';
import GameExtras from './detail/GameExtras';
import GameImage from './detail/GameImage';
import {
  GameIdentityFacts,
  GameScreenshots,
  GameAnnouncements,
  GameAbout,
  GameRequirementsSection,
  GameComments,
} from './detail/GameStoreOverviewSections';
import { gameArtwork } from './detail/gameDetailData';
import { label, comingSoon } from '@/components/store/redesign/discovery';
import './detail/game-detail.css';

export default function GameDetailPanel({ game, onClose, returnLabel = 'Store', view: controlledView, onViewChange }) {
  const navigate = useNavigate();
  const [localView, setLocalView] = useState('overview');
  const view = controlledView || localView;
  const setView = onViewChange || setLocalView;

  const scrollTo = id => {
    setView('overview');
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  };

  useEffect(() => {
    const showExtras = () => scrollTo('game-dlc-cards');
    window.addEventListener('showDevZone', showExtras);
    return () => window.removeEventListener('showDevZone', showExtras);
  }, []);

  return <main className="gd-page" aria-label={game.title + ' game page'}>
    <div className="gd-backdrop" aria-hidden="true"><GameImage src={gameArtwork(game)} fallback={game.cover_image} alt="" /><div /></div>

    <div className="gd-shell">
      <nav className="gd-store-links" aria-label="Explore this game">
        <button onClick={() => navigate('/Store')}>Browse store</button>
        <button onClick={() => scrollTo('game-avatar-rewards')}>Cards & rewards</button>
        <button onClick={() => scrollTo('game-dlc-cards')}>DLC & add-ons</button>
        <button onClick={() => scrollTo('game-comments')}>Comments & reviews</button>
      </nav>

      <nav className="gd-breadcrumb" aria-label="Breadcrumb">
        <button onClick={onClose}><ArrowLeft size={16} />{returnLabel}</button>
        <ChevronRight size={12} />
        <span>{label(game.genre) || 'Game'}</span>
      </nav>

      <header className="gd-title-block">
        <div className="gd-title-meta">
          <span className="gd-eyebrow">Game overview</span>
          <span className="gd-availability">{comingSoon(game) ? 'Coming soon' : <><Check size={12} />Available now</>}</span>
        </div>
        <h1>{game.title}</h1>
      </header>

      {view === 'overview' ? <>
        <div className="gd-hero-grid">
          <GameGallery game={game} />
          <GamePurchasePanel game={game} />
        </div>

        <GameIdentityFacts game={game} />
        <GameScreenshots game={game} />

        <GameRewards game={game} />

        <section id="game-dlc-cards" className="gd-restored-section">
          <GameExtras game={game} />
        </section>

        <GameAnnouncements game={game} />
        <GameAbout game={game} />
        <GameRequirementsSection game={game} />
        <GameComments game={game} />

        <section id="game-reviews" className="gd-restored-section">
          <GameReviews game={game} />
        </section>
      </> : view === 'stream'
        ? <GameStreams game={game} />
        : <StudioGameViews game={game} view={view} />}
    </div>
  </main>;
}
