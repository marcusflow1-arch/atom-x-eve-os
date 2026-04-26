import React, { useState, useEffect, useRef, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import Achievements from './Achievements';
import { Badge } from '@/components/ui/badge';
import { Library as LibraryIcon, Search, Play, Loader2, Gamepad2, Radio, Clock, Trophy, ChevronRight, LayoutGrid } from 'lucide-react';
import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError } from '@/components/error/ErrorToast';
import GameLauncherOverlay from '../components/library/GameLauncherOverlay';
import RemotePlayOverlay from '../components/streaming/RemotePlayOverlay';
import GameContentTab from '@/components/library/GameContentTab';
import GameCommunityTab from '@/components/library/GameCommunityTab';
import GameDiscussionTab from '@/components/library/GameDiscussionTab';
import GameStreamerAffiliateTab from '@/components/library/GameStreamerAffiliateTab';
import GameSupportTab from '@/components/library/GameSupportTab';
import { motion, AnimatePresence } from 'framer-motion';
import GlassPageFrame from '@/components/shared/GlassPageFrame';

// Vertical Game List Item for the sidebar
const LibrarySidebarItem = ({ game, isSelected, onSelect, onPlay }) => (
  <motion.div
    initial={{ opacity: 0, y: 5 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ scale: 1.02 }}
    onClick={() => onSelect(game)}
    className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer border transition-all overflow-hidden ${
      isSelected
        ? 'border-cyan-400/40 bg-gradient-to-r from-cyan-500/20 to-blue-500/5 shadow-[0_0_20px_rgba(34,211,238,0.15)]'
        : 'border-white/5 bg-white/[0.02] hover:border-white/20 hover:bg-white/10'
    }`}
  >
    {/* Selected indicator glow */}
    {isSelected && (
      <motion.div
        layoutId="libSidebarIndicator"
        className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-12 bg-cyan-400 rounded-r-full blur-sm"
      />
    )}
    <div className="relative w-14 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-black/60 border border-white/10 shadow-lg group-hover:border-white/30 transition-colors">
      <img src={game.cover_image || game.cover} alt={game.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Gamepad2 className="w-3.5 h-3.5 text-white/80" />
      </div>
    </div>
    <div className="min-w-0 flex-1 pr-2">
      <p className={`font-bold text-[15px] truncate transition-colors mb-1 ${isSelected ? 'text-white' : 'text-white/70 group-hover:text-white'}`}>{game.title}</p>
      <div className="flex items-center gap-2">
        <Badge className={`text-[10px] px-1.5 py-0.5 rounded-md bg-black/40 border-white/10 ${isSelected ? 'text-cyan-300 border-cyan-500/30' : 'text-white/40'}`}>
          {game.genre}
        </Badge>
        {isSelected && <span className="text-[10px] text-cyan-400 font-medium">Ready</span>}
      </div>
    </div>
    <motion.button
      onClick={(e) => { e.stopPropagation(); onPlay(game); }}
      className="absolute right-4 w-9 h-9 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <Play className="w-4 h-4 fill-current ml-0.5" />
    </motion.button>
  </motion.div>
);


export default function Library({ onSwitchToStore, onSwitchToAchievements }) {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Escape key to exit back to Luna Dashboard
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        navigate(createPageUrl('LunaTemplate'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  const [ownedGames, setOwnedGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [embeddedView, setEmbeddedView] = useState('library');
  const [streamingGameId, setStreamingGameId] = useState(localStorage.getItem('streaming_game_id'));
  const [selectedGame, setSelectedGame] = useState(null);
  const [rightView, setRightView] = useState('details'); // 'details' | 'fullgrid'
  const [activeDetailTab, setActiveDetailTab] = useState('content');
  const [launchingGame, setLaunchingGame] = useState(null);
  const [streamingSession, setStreamingSession] = useState(null);

  // Listen for library close event from navigation
  useEffect(() => {
    const handleLibraryClose = () => {
      // Reset to default view when library is closed/retracted
      setRightView('details');
      setSelectedGame(null);
      setActiveDetailTab('content');
    };
    window.addEventListener('libraryPanelClose', handleLibraryClose);
    return () => window.removeEventListener('libraryPanelClose', handleLibraryClose);
  }, []);

  const handleStreamGame = async (game) => {
    try {
      const res = await base44.functions.invoke('initiateRemotePlay', { game_id: game.id });
      if (res.data && res.data.success) {
        setStreamingSession({ game, session: res.data.session });
      } else {
        setStreamingSession({ game, session: { status: 'initializing' } });
      }
    } catch (e) {
      showError(e, 'Start Stream');
      setStreamingSession({ game, session: { status: 'initializing' } });
    }
  };

  const handleLaunchGame = (game) => {
    setLaunchingGame(game);
  };

  useEffect(() => {
    const fetchOwnedGames = async () => {
      const isDev = import.meta.env.DEV;
      const useMock = isDev && window.localStorage.getItem('USE_MOCK_DATA') === 'true';
      let userGames = [];

      if (isAuthenticated) {
        try {
          const allGamesFromDb = await base44.entities.Game.filter({}, '-created_date', 100);
          const ownedIds = user?.purchased_items || [];
          userGames = allGamesFromDb.filter(g => ownedIds.includes(g.id));

          // Fallback to mock data in dev if user has no games
          if (userGames.length === 0 && useMock) {
            const { allMockGames } = await import('../components/store/mockData');
            const mockGamesArray = Object.values(allMockGames).slice(0, 5);
            userGames = mockGamesArray;
          }
        } catch (error) {
          console.error('Failed to fetch games:', error);
          if (useMock) {
            const { allMockGames } = await import('../components/store/mockData');
            userGames = Object.values(allMockGames).slice(0, 5);
          }
        }
      } else if (useMock) {
        // Not authenticated but in dev mode
        const { allMockGames } = await import('../components/store/mockData');
        userGames = Object.values(allMockGames).slice(0, 3);
      }
      
      setOwnedGames(Array.from(new Map(userGames.map(g => [g.id, g])).values()));
      if (userGames.length > 0) setSelectedGame(userGames[0]);
      setLoading(false);
    };

    fetchOwnedGames();
    const handleStorageChange = () => setStreamingGameId(localStorage.getItem('streaming_game_id'));
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user, isAuthenticated]);

  const filteredGames = React.useMemo(() => {
    if (!searchTerm) return ownedGames;
    return ownedGames.filter(game =>
      game?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game?.genre?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [ownedGames, searchTerm]);

  if (!isAuthenticated && filteredGames.length <= 1) {
    return (
      <div 
        className="flex flex-col items-center justify-center min-h-screen text-white p-6"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        <LibraryIcon className="w-20 h-20 text-white/20 mb-6" />
        <h1 className="text-3xl font-bold mb-2">Your Library is Empty</h1>
        <p className="text-white/50 mb-6 max-w-md text-center">Sign in to see your purchased games.</p>
        <Button asChild className="bg-white text-black hover:bg-white/90">
          <Link to={createPageUrl('Store')}>Explore Games</Link>
        </Button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div 
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #2d3548 25%, #3d4a5c 50%, #2d3548 75%, #1a1f2e 100%)' }}
      >
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <PageErrorBoundary pageName="Library">
    <GlassPageFrame>
    <div
      className="min-h-screen h-screen text-white overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f1419 0%, #1a1f2e 25%, #0d1117 50%, #1a1f2e 75%, #0f1419 100%)' }}
    >
      {/* Achievements Overlay */}
      <AnimatePresence>
        {embeddedView === 'achievements' && (
          <motion.div key="lib-ach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-xl">
            <div className="absolute top-6 left-6 z-10">
              <button onClick={() => setEmbeddedView('library')} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/90">
                <Gamepad2 className="w-4 h-4 text-cyan-400" /><span>Back to Library</span>
              </button>
            </div>
            <div className="w-full h-full overflow-hidden"><Achievements onExitToLibrary={() => setEmbeddedView('library')} /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-slate-300/5 rounded-full blur-[120px]" />
      </div>

      {/* Main Layout */}
      <div className="relative z-10 flex h-full pt-20 pb-6 px-6 gap-6 max-w-[1920px] mx-auto">
        {/* LEFT SIDEBAR */}
        <div 
          className="w-[320px] flex-shrink-0 h-full flex flex-col rounded-3xl overflow-hidden shadow-2xl"
          style={{
            background: 'rgba(10, 14, 20, 0.5)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
            border: '1px solid rgba(165, 243, 252, 0.15)'
          }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 bg-gradient-to-r from-indigo-600/20 to-transparent flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <LibraryIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-wide">My Library</h2>
              <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">All Games & Played</p>
            </div>
          </div>
          
          <div className="flex flex-col p-5 flex-1 overflow-hidden">

          {/* Search */}
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Find a game..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner"
            />
          </div>

          {/* Full Library Button */}
          <button
            onClick={() => setRightView(rightView === 'fullgrid' ? 'details' : 'fullgrid')}
            className={`flex items-center justify-between w-full px-4 py-3 mb-5 rounded-xl border transition-all group ${
              rightView === 'fullgrid' 
                ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 border-cyan-400/40 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                : 'bg-white/[0.03] border-white/10 hover:bg-white/10 hover:border-cyan-400/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-1.5 rounded-lg ${rightView === 'fullgrid' ? 'bg-cyan-500/20' : 'bg-white/10'}`}>
                <LayoutGrid className={`w-4 h-4 transition-colors ${rightView === 'fullgrid' ? 'text-cyan-300' : 'text-white/50 group-hover:text-cyan-300'}`} />
              </div>
              <span className="text-sm font-bold tracking-wide">Full Library View</span>
            </div>
            <ChevronRight className={`w-4 h-4 transition-colors ${rightView === 'fullgrid' ? 'text-cyan-400' : 'text-white/30 group-hover:text-white'}`} />
          </button>
          
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest flex items-center gap-2">
              <Gamepad2 className="w-3.5 h-3.5 text-cyan-400" />
              Library Games
            </h3>
            <span className="text-[10px] text-white/40 font-mono">{filteredGames.length}</span>
          </div>

          {/* Game List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'none' }}>
            {filteredGames.map((game, i) => (
              <LibrarySidebarItem
                key={game.id || i}
                game={game}
                isSelected={selectedGame?.id === game.id}
                onSelect={(g) => { setSelectedGame(g); setRightView('details'); }}
                onPlay={handleLaunchGame}
              />
            ))}
          </div>
          </div>
        </div>

        {/* RIGHT CONTENT AREA */}
        <div 
          className="flex-1 h-full flex flex-col overflow-hidden rounded-3xl shadow-2xl relative"
          style={{
            background: 'rgba(15, 20, 26, 0.65)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(165, 243, 252, 0.08)',
            border: '1px solid rgba(165, 243, 252, 0.15)'
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-purple-500/5 pointer-events-none" />
          <AnimatePresence mode="wait">
            {rightView === 'fullgrid' ? (
              /* === FULL LIBRARY GRID VIEW === */
              <motion.div
                key="fullgrid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden p-8 relative z-10"
              >
                <div className="flex items-center justify-between mb-8 flex-shrink-0 pb-6 border-b border-white/10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                      <LibraryIcon className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-white tracking-wide">Full Library</h2>
                      <p className="text-cyan-400/80 font-medium tracking-wider text-xs uppercase mt-1">{ownedGames.length} Total Titles</p>
                    </div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto pr-4" style={{ scrollbarWidth: 'none' }}>
                  <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4">
                    {ownedGames.map((game, i) => (
                      <motion.div
                        key={game.id || i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.02 }}
                        onClick={() => { setSelectedGame(game); setRightView('details'); }}
                        className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/10 cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:scale-[1.03]"
                      >
                        <img
                          src={game.cover_image || game.cover || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80'}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <h4 className="text-white font-bold text-sm leading-tight mb-1 line-clamp-2">{game.title}</h4>
                          <p className="text-white/50 text-xs capitalize">{game.genre}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ) : (
              /* === GAME DETAILS VIEW === */
              <motion.div
                key={`details-${selectedGame?.id || 'none'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col overflow-hidden relative z-10"
              >
                {selectedGame ? (
                  <>
                    {/* Immersive Game Banner Header */}
                    <div className="relative h-72 flex-shrink-0 border-b border-white/10">
                      <img src={selectedGame.banner || selectedGame.cover_image || selectedGame.cover} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0f141a]/95 via-[#0f141a]/60 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#0f141a]/90 via-[#0f141a]/40 to-transparent" />
                      
                      <div className="absolute bottom-0 left-0 right-0 p-8 flex items-end gap-8">
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                          className="w-40 h-56 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.8)] border-2 border-white/10 flex-shrink-0 bg-black relative"
                        >
                          <img src={selectedGame.cover_image || selectedGame.cover} alt={selectedGame.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/20" />
                        </motion.div>
                        <div className="flex-1 min-w-0 pb-2">
                          <Badge className="mb-3 bg-cyan-500/20 text-cyan-300 border-cyan-500/30 backdrop-blur-md text-[10px] px-2.5 py-1 uppercase tracking-widest rounded-md">{selectedGame.genre}</Badge>
                          <h1 className="text-5xl font-black text-white mb-3 tracking-tight drop-shadow-2xl">{selectedGame.title}</h1>
                          <div className="flex items-center gap-6 text-sm text-white/70 mb-5 font-medium">
                            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-lg"><Clock className="w-4 h-4 text-cyan-400" /><span>12.5h played</span></div>
                            <div className="flex items-center gap-2 bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-md border border-white/10 shadow-lg"><Trophy className="w-4 h-4 text-yellow-400" /><span>8/15 achievements</span></div>
                          </div>
                          <div className="flex gap-3">
                            <Button onClick={() => handleLaunchGame(selectedGame)} className="bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-lg h-12 px-10 rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-105">
                              <Play className="w-5 h-5 mr-2 fill-current" /> PLAY
                            </Button>
                            <Button variant="outline" onClick={() => handleStreamGame(selectedGame)} className="border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 font-bold h-12 px-6 rounded-xl backdrop-blur-md transition-all hover:scale-105">
                              <Radio className="w-5 h-5 mr-2" /> STREAM
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex items-center gap-8 border-b border-white/10 px-8 bg-black/20">
                        {['Content', 'Community', 'Discussion', 'Streamer Affiliate', 'Support'].map((tab) => {
                          const id = tab.toLowerCase().replace(/ /g, '_');
                          return (
                            <button
                              key={id}
                              onClick={() => setActiveDetailTab(id)}
                              className={`pb-3 text-sm font-bold uppercase tracking-wider transition-all relative whitespace-nowrap ${
                                activeDetailTab === id ? 'text-white' : 'text-white/40 hover:text-white'
                              }`}
                            >
                              {tab}
                              {activeDetailTab === id && (
                                <motion.div layoutId="activeLibTabLine" className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                    {/* Tab Content (Scrollable) */}
                    <div className="flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
                      <AnimatePresence mode="wait">
                        {activeDetailTab === 'content' && <GameContentTab key="content" game={selectedGame} />}
                        {activeDetailTab === 'community' && <GameCommunityTab key="community" game={selectedGame} />}
                        {activeDetailTab === 'discussion' && <GameDiscussionTab key="discussion" game={selectedGame} />}
                        {activeDetailTab === 'streamer_affiliate' && <GameStreamerAffiliateTab key="streamer" game={selectedGame} />}
                        {activeDetailTab === 'support' && <GameSupportTab key="support" game={selectedGame} />}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-white/30">
                    <Gamepad2 className="w-16 h-16 mb-4 opacity-50" />
                    <p>Select a game from the library</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Launch & Stream Overlays */}
      <AnimatePresence>
        {launchingGame && (
          <GameLauncherOverlay game={launchingGame} onClose={() => setLaunchingGame(null)} />
        )}
        {streamingSession && (
          <RemotePlayOverlay game={streamingSession.game} session={streamingSession.session} onClose={() => setStreamingSession(null)} />
        )}
      </AnimatePresence>
    </div>
    </GlassPageFrame>
    </PageErrorBoundary>
  );
}