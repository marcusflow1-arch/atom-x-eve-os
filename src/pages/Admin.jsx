import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Play, Pause, Check, X, Film, Loader2, Gamepad2, RefreshCw, Plus, Search, Bot, Terminal, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '../components/auth/AuthContext';
import { Game } from '@/entities/Game';
import Model3DManager from '../components/admin/Model3DManager';
import AnimationFBXManager from '../components/admin/AnimationFBXManager';
import ModelFBXManager from '../components/admin/ModelFBXManager';
import Model3DScriptManager from '../components/admin/Model3DScriptManager';
import KeybindManager from '../components/admin/KeybindManager';
import AIModelController from '../components/admin/AIModelController';
import ExpProgressionAdmin from '../components/admin/ExpProgressionAdmin';
import GameFileAnalyzer from '../components/admin/GameFileAnalyzer';
import ReactorEditor from '../components/admin/ReactorEditor';
import AttachmentEditor from '../components/admin/AttachmentEditor';
import AssetFilesManager from '../components/admin/AssetFilesManager';
import VideoAnalyzer from '../components/admin/VideoAnalyzer';
import VideoIntelligence from '../components/admin/videoIntelligence/VideoIntelligence';
import AttachmentVisualValidator from '../components/admin/attachmentValidator/AttachmentVisualValidator';
import NPCActionAudioManager from '../components/admin/NPCActionAudioManager';
import SoundLibraryManager from '../components/admin/SoundLibraryManager';
import KnowledgeEngineManager from '../components/admin/KnowledgeEngineManager';

import PageErrorBoundary from '@/components/error/PageErrorBoundary';
import { showError, showSuccess } from '@/components/error/ErrorToast';

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [populatingGames, setPopulatingGames] = useState(false);
  const [newGame, setNewGame] = useState({ title: '', description: '', genre: '', price: '', cover_image: '', video_urls: [], screenshots: [] });
  const [fixingImages, setFixingImages] = useState(false);
  const [activeJobId, setActiveJobId] = useState(null);
  const [fetchingIGDB, setFetchingIGDB] = useState(false);
  const [showMissingImages, setShowMissingImages] = useState(false);
  const [gameSortBy, setGameSortBy] = useState('release_date'); // 'release_date', 'popularity', 'title'
  
  // Poll for logs if a job is active
  const { data: agentLogs = [] } = useQuery({
    queryKey: ['agentLogs', activeJobId],
    queryFn: () => base44.entities.AgentLog.filter({ job_id: activeJobId }, 'created_date', 100),
    enabled: !!activeJobId,
    refetchInterval: 1000, // Live polling
  });

  // Poll job status
  const { data: activeJob } = useQuery({
    queryKey: ['agentJob', activeJobId],
    queryFn: async () => {
        const jobs = await base44.entities.AgentJob.filter({ id: activeJobId });
        return jobs[0];
    },
    enabled: !!activeJobId,
    refetchInterval: 2000,
  });

  // Check if job finished
  useEffect(() => {
      if (activeJob && (activeJob.status === 'completed' || activeJob.status === 'failed')) {
          // Stop polling after a short delay to ensure we got all logs
          setTimeout(() => {
             refetchGames();
             // Don't set activeJobId to null immediately so user can see the final logs
          }, 2000);
      }
  }, [activeJob]);

  const startAgentMutation = useMutation({
      mutationFn: async () => {
          const job = await base44.entities.AgentJob.create({ status: 'running', type: 'comprehensive_game_discovery' });
          setActiveJobId(job.id);
          // Trigger backend function
          base44.functions.invoke('comprehensiveGameAgent', { jobId: job.id }); // Fire and forget-ish (or it awaits)
          return job;
      }
  });

  const { data: heroBackgrounds = [], isLoading } = useQuery({
    queryKey: ['heroBackgrounds'],
    queryFn: () => base44.entities.HeroBackground.list('-created_date'),
  });

  const { data: existingGames = [], isLoading: gamesLoading, refetch: refetchGames } = useQuery({
    queryKey: ['adminGames'],
    queryFn: () => Game.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HeroBackground.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['heroBackgrounds'] });
      setNewTitle('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.HeroBackground.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroBackgrounds'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HeroBackground.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['heroBackgrounds'] }),
  });

  const createGameMutation = useMutation({
    mutationFn: (data) => Game.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminGames'] });
      setNewGame({ title: '', description: '', genre: '', price: '', cover_image: '', video_urls: [], screenshots: [] });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: (id) => Game.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGames'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.includes('video/mp4');
    const isAudio = file.type.includes('audio/mpeg');

    if (!isVideo && !isAudio) {
      showError('Please upload an MP4 video or MP3 audio file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const data = {
        title: newTitle || file.name.split('.')[0],
        is_active: true,
      };

      if (isVideo) {
        data.video_url = file_url;
      } else if (isAudio) {
        data.audio_url = file_url;
      }

      await createMutation.mutateAsync(data);
      
      setNewTitle('');
      showSuccess('Background uploaded successfully!');
    } catch (error) {
      showError(error, 'Upload');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = (bg) => {
    updateMutation.mutate({ id: bg.id, data: { is_active: !bg.is_active } });
  };

  const deleteBackground = (id) => {
    if (window.confirm('Are you sure you want to delete this background?')) {
      deleteMutation.mutate(id, {
        onSuccess: () => showSuccess('Background deleted'),
        onError: (error) => showError(error, 'Delete')
      });
    }
  };

  // Simple admin check - must be AFTER all hooks
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-slate-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const handleFixImages = async () => {
    setFixingImages(true);
    try {
      let remaining = 1;
      let totalFixed = 0;

      // Loop until no games remain to be fixed (limit to 5 batches to prevent browser timeout)
      let batchCount = 0;
      const MAX_BATCHES = 5;
      
      while (remaining > 0 && batchCount < MAX_BATCHES) {
        const response = await base44.functions.invoke('fixGameImages');
        const data = response.data; 
        
        remaining = data.remaining || 0;
        totalFixed += data.results?.length || 0;
        batchCount++;

        // Force a refetch to show progress
        refetchGames();
        
        console.log(`Fixed batch ${batchCount}. Remaining: ${remaining}`);
        
        if (data.results?.length === 0 && remaining > 0) {
             console.warn("Stuck fixing images, stopping.");
             break;
        }
      }
      
      refetchGames();
      showSuccess(`Finished fixing media! Processed ${totalFixed} games.`);
    } catch (error) {
      showError(error, 'Fix Media');
    } finally {
      setFixingImages(false);
    }
  };

  const populateGamesFromSearch = async () => {
    setPopulatingGames(true);
    try {
      // Fetch multiple categories in parallel
      const categories = [
        {
          prompt: `List 15 TRENDING and BEST-SELLING video games from 2024-2025. Include: Monster Hunter Wilds, Elden Ring Nightreign, Black Myth Wukong, Helldivers 2, Palworld, Stellar Blade, Dragon's Dogma 2, Final Fantasy VII Rebirth, Tekken 8, Like a Dragon Infinite Wealth, Persona 3 Reload, Prince of Persia Lost Crown, Suicide Squad, Granblue Fantasy Relink.`,
          category: 'trending'
        },
        {
          prompt: `List 15 NEW RELEASE video games coming in late 2024 and 2025. Include: GTA 6, Civilization VII, Assassin's Creed Shadows, Metroid Prime 4, Kingdom Come Deliverance 2, Avowed, Fable, Death Stranding 2, Ghost of Yotei, Monster Hunter Wilds, Indiana Jones, Mafia The Old Country, Doom The Dark Ages, Wolverine, Intergalactic.`,
          category: 'new_releases'
        },
        {
          prompt: `List 15 CLASSIC BEST-SELLER video games that are still popular. Include: Minecraft, Baldur's Gate 3, Hogwarts Legacy, Cyberpunk 2077, Elden Ring, Red Dead Redemption 2, The Witcher 3, GTA V, God of War Ragnarok, Horizon Forbidden West, Spider-Man 2, Starfield, Diablo 4, Resident Evil 4 Remake, Zelda Tears of the Kingdom.`,
          category: 'classics'
        }
      ];

      const gameImages = {
        // Trending 2024-2025
        'monster hunter wilds': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop',
        'elden ring nightreign': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
        'black myth wukong': 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=800&fit=crop',
        'helldivers 2': 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
        'palworld': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
        'stellar blade': 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=600&h=800&fit=crop',
        'dragons dogma 2': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
        'final fantasy vii rebirth': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
        'tekken 8': 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=600&h=800&fit=crop',
        'like a dragon infinite wealth': 'https://images.unsplash.com/photo-1493711662062-fa541f7f728e?w=600&h=800&fit=crop',
        // New Releases 2025
        'gta 6': 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
        'grand theft auto vi': 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
        'civilization vii': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop',
        'assassins creed shadows': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
        'metroid prime 4': 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=800&fit=crop',
        'kingdom come deliverance 2': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
        'avowed': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
        'fable': 'https://images.unsplash.com/photo-1560419015-7c427e8ae5ba?w=600&h=800&fit=crop',
        'death stranding 2': 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=600&h=800&fit=crop',
        'ghost of yotei': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
        'doom the dark ages': 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
        // Classics
        'minecraft': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
        'baldurs gate 3': 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=800&fit=crop',
        'hogwarts legacy': 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&h=800&fit=crop',
        'cyberpunk 2077': 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
        'elden ring': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
        'red dead redemption 2': 'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=600&h=800&fit=crop',
        'the witcher 3': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
        'god of war ragnarok': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
        'spider-man 2': 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&h=800&fit=crop',
        'starfield': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop',
        'diablo 4': 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
        'resident evil 4': 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=800&fit=crop',
      };

      const defaultImages = [
        'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=600&h=800&fit=crop',
        'https://images.unsplash.com/photo-1493711662062-fa541f7f728e?w=600&h=800&fit=crop',
      ];

      const getImageForGame = (title) => {
        const key = title.toLowerCase().replace(/[^a-z0-9\s]/g, '');
        for (const [gameName, imageUrl] of Object.entries(gameImages)) {
          if (key.includes(gameName) || gameName.includes(key.split(' ')[0])) {
            return imageUrl;
          }
        }
        return defaultImages[Math.floor(Math.random() * defaultImages.length)];
      };

      for (const cat of categories) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${cat.prompt}
          
          For each game provide:
          - title (exact official game name)
          - description (2-3 engaging sentences)
          - genre (Action RPG, FPS, Strategy, RPG, Shooter, Survival, Racing, Sports, Horror, Adventure, Action Adventure, Sandbox)
          - price (USD: 29.99, 39.99, 49.99, 59.99, or 69.99)
          - developer (real studio name)
          - rating (4.0 to 5.0)
          - releaseYear (year as string)
          - screenshot_urls (array of 3-4 distinct high-res image URLs)
          - video_urls (array of 1-2 YouTube gameplay trailer URLs)`,
          add_context_from_internet: true,
          response_json_schema: {
            type: 'object',
            properties: {
              games: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    genre: { type: 'string' },
                    price: { type: 'number' },
                    developer: { type: 'string' },
                    rating: { type: 'number' },
                    releaseYear: { type: 'string' },
                    screenshot_urls: { type: 'array', items: { type: 'string' } },
                    video_urls: { type: 'array', items: { type: 'string' } }
                  }
                }
              }
            }
          }
        });

        if (result.games) {
          for (const game of result.games) {
            // Check if game already exists
            const exists = existingGames.some(g => 
              g.title.toLowerCase() === game.title.toLowerCase()
            );
            if (!exists) {
              await Game.create({
                title: game.title,
                description: game.description,
                genre: game.genre?.toLowerCase() || 'action',
                price: game.price || 59.99,
                status: 'available',
                original_year: parseInt(game.releaseYear) || 2024,
                cover_image: getImageForGame(game.title),
                screenshots: game.screenshot_urls || [],
                video_urls: game.video_urls || [],
                trailer_url: game.video_urls?.[0] || ''
              });
            }
          }
        }
      }
      
      refetchGames();
      showSuccess('Successfully populated games catalog!');
    } catch (error) {
      showError(error, 'Populate Games');
    }
    setPopulatingGames(false);
  };

  const handleAddGame = () => {
    if (!newGame.title || !newGame.price) {
      showError('Title and price are required');
      return;
    }
    createGameMutation.mutate({
      ...newGame,
      price: parseFloat(newGame.price),
      status: 'available',
      video_urls: newGame.video_urls,
      screenshots: newGame.screenshots,
      trailer_url: newGame.video_urls?.[0] || ''
    }, {
      onSuccess: () => showSuccess('Game added successfully!'),
      onError: (error) => showError(error, 'Add Game')
    });
  };

  const handleFetchFromIGDB = async () => {
    setFetchingIGDB(true);
    try {
      // Fetch trending/popular games from IGDB
      const result = await base44.functions.invoke('fetchIGDBGames', { 
        limit: 20 
      });
      
      if (result.data?.games) {
        let created = 0;
        let updated = 0;
        
        for (const igdbGame of result.data.games) {
          // Check if game exists by title
          const existingGame = existingGames.find(g => 
            g.title.toLowerCase() === igdbGame.title.toLowerCase()
          );
          
          if (existingGame) {
            // Update existing game with IGDB data
            await Game.update(existingGame.id, {
              description: igdbGame.description || existingGame.description,
              cover_image: igdbGame.cover_image || existingGame.cover_image,
              screenshots: igdbGame.screenshots?.length > 0 ? igdbGame.screenshots : existingGame.screenshots,
              video_urls: igdbGame.video_urls?.length > 0 ? igdbGame.video_urls : existingGame.video_urls,
              trailer_url: igdbGame.trailer_url || existingGame.trailer_url,
              genre: igdbGame.genre || existingGame.genre,
              developer: igdbGame.developer || existingGame.developer
            });
            updated++;
          } else {
            // Create new game from IGDB data
            await Game.create({
              title: igdbGame.title,
              description: igdbGame.description,
              cover_image: igdbGame.cover_image,
              screenshots: igdbGame.screenshots || [],
              video_urls: igdbGame.video_urls || [],
              trailer_url: igdbGame.trailer_url || '',
              genre: igdbGame.genre?.toLowerCase() || 'action',
              price: 59.99, // Default price since IGDB doesn't have prices
              status: 'available',
              developer: igdbGame.developer,
              original_year: igdbGame.release_date ? new Date(igdbGame.release_date).getFullYear() : 2024
            });
            created++;
          }
        }
        
        refetchGames();
        showSuccess(`IGDB Import Complete! Created: ${created} | Updated: ${updated}`);
      } else {
        showError('No games returned from IGDB');
      }
    } catch (error) {
      showError(error, 'IGDB Import');
    } finally {
      setFetchingIGDB(false);
    }
  };

  return (
    <PageErrorBoundary pageName="Admin">
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-2">Admin Panel</h1>
        <p className="text-slate-400 mb-8">Manage hero backgrounds, games, and site content</p>

        <Tabs defaultValue="backgrounds" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="backgrounds">Hero Backgrounds</TabsTrigger>
            <TabsTrigger value="sounds">Sound Library</TabsTrigger>
            <TabsTrigger value="games">Game Catalog</TabsTrigger>
            <TabsTrigger value="models">3D Models</TabsTrigger>
            <TabsTrigger value="animations">FBX Animations</TabsTrigger>
            <TabsTrigger value="fbx-models">FBX Models</TabsTrigger>
            <TabsTrigger value="scripts">3D Scripts</TabsTrigger>
            <TabsTrigger value="keybinds">Keybind Manager</TabsTrigger>
            <TabsTrigger value="ai-models">3D Model AI</TabsTrigger>
            <TabsTrigger value="exp-progression">EXP & Leveling</TabsTrigger>
            <TabsTrigger value="game-files">Game Files</TabsTrigger>
            <TabsTrigger value="reactor">Reactor Editor</TabsTrigger>
            <TabsTrigger value="attachment-editor">Attachment Editor</TabsTrigger>
            <TabsTrigger value="asset-files">Asset Files</TabsTrigger>
            <TabsTrigger value="video-analyzer">Video Analyzer</TabsTrigger>
            <TabsTrigger value="video-intel">Video Intelligence</TabsTrigger>
            <TabsTrigger value="attachment-validator">Attachment Validator</TabsTrigger>
            <TabsTrigger value="quest-audio">NPC & Action Audio</TabsTrigger>
            <TabsTrigger value="knowledge-engine">Knowledge Engine</TabsTrigger>
            </TabsList>

          <TabsContent value="backgrounds">
        {/* Hero Backgrounds Section */}
        <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Film className="w-6 h-6 text-blue-500" />
                Hero Backgrounds
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Upload MP4 videos to cycle as hero backgrounds on the store page
              </p>
            </div>
            <Badge variant="outline" className="text-slate-400">
              {heroBackgrounds.filter(b => b.is_active).length} Active
            </Badge>
          </div>

          {/* Upload Section */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <h3 className="font-semibold mb-4">Upload New Background</h3>
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                placeholder="Background title (optional)"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-900 border-slate-700 flex-1"
              />
              <label className="relative cursor-pointer">
                <input
                   type="file"
                   accept="video/mp4,audio/mpeg"
                   onChange={handleFileUpload}
                   className="hidden"
                   disabled={uploading}
                 />
                 <Button 
                   disabled={uploading}
                   className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto"
                   asChild
                 >
                   <span>
                     {uploading ? (
                       <>
                         <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                         Uploading...
                       </>
                     ) : (
                       <>
                         <Upload className="w-4 h-4 mr-2" />
                         Upload MP4 or MP3
                       </>
                     )}
                   </span>
                 </Button>
              </label>
            </div>
          </div>

          {/* Backgrounds List */}
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
              Loading backgrounds...
            </div>
          ) : heroBackgrounds.length === 0 ? (
            <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
              <Film className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No hero backgrounds uploaded yet</p>
              <p className="text-sm">Upload your first MP4 video above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {heroBackgrounds.map((bg) => (
                  <motion.div
                    key={bg.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`relative bg-slate-800/50 border rounded-xl overflow-hidden group ${
                      bg.is_active ? 'border-green-500/50' : 'border-slate-700 opacity-60'
                    }`}
                  >
                    {/* Video Preview */}
                    <div className="aspect-video bg-black relative">
                      <video
                        src={bg.video_url}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        onMouseEnter={(e) => e.target.play()}
                        onMouseLeave={(e) => { e.target.pause(); e.target.currentTime = 0; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 left-2">
                        <Badge className={bg.is_active ? 'bg-green-600' : 'bg-slate-600'}>
                          {bg.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h4 className="font-semibold truncate mb-2">{bg.title || 'Untitled'}</h4>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">Active</span>
                          <Switch
                            checked={bg.is_active}
                            onCheckedChange={() => toggleActive(bg)}
                          />
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => deleteBackground(bg.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>
          </TabsContent>

          <TabsContent value="games">
            {/* Game Catalog Section */}
            <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6 text-green-500" />
                    Game Catalog
                  </h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Manage games displayed in the store
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="outline" className="text-slate-400">
                    {existingGames.length} Games
                  </Badge>
                  <Button
                    onClick={() => startAgentMutation.mutate()}
                    disabled={startAgentMutation.isPending || (activeJob && activeJob.status === 'running')}
                    className={`
                        ${(activeJob && activeJob.status === 'running') 
                            ? 'bg-purple-600/50 animate-pulse' 
                            : 'bg-purple-600 hover:bg-purple-700'} 
                        border border-purple-400/20
                    `}
                  >
                    <Bot className="w-4 h-4 mr-2" />
                    {(activeJob && activeJob.status === 'running') ? 'Agent Running...' : '🤖 AI Game Agent (All-in-One)'}
                  </Button>
                  <Button 
                    onClick={handleFetchFromIGDB}
                    disabled={fetchingIGDB || populatingGames || fixingImages}
                    className="bg-indigo-600 hover:bg-indigo-700 border border-indigo-400/20"
                  >
                    {fetchingIGDB ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching from IGDB...</>
                    ) : (
                      <><Gamepad2 className="w-4 h-4 mr-2" /> Import from IGDB</>
                    )}
                  </Button>
                  <Button 
                    onClick={handleFixImages}
                    disabled={fixingImages || populatingGames || fetchingIGDB}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {fixingImages ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fixing Media...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" /> Fix Media (Img/Vid)</>
                    )}
                  </Button>
                  <Button 
                    onClick={populateGamesFromSearch}
                    disabled={populatingGames || fixingImages || fetchingIGDB}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {populatingGames ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Populating...</>
                    ) : (
                      <><Search className="w-4 h-4 mr-2" /> Auto-Populate from Web</>
                    )}
                  </Button>
                </div>
              </div>

              {/* Agent Terminal Panel */}
              <AnimatePresence>
                {activeJobId && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-6 rounded-xl overflow-hidden border border-slate-700 bg-black font-mono text-sm shadow-2xl"
                    >
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-2 text-green-400">
                                <Terminal className="w-4 h-4" />
                                <span className="font-bold">Agent Terminal_v1.0</span>
                                {activeJob?.status === 'running' && (
                                    <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse ml-2"/>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                    activeJob?.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                    activeJob?.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                    'bg-blue-500/20 text-blue-400'
                                }`}>
                                    STATUS: {activeJob?.status?.toUpperCase() || 'INITIALIZING'}
                                </span>
                                <button onClick={() => setActiveJobId(null)} className="text-slate-500 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4 h-64 overflow-y-auto custom-scrollbar flex flex-col-reverse gap-1">
                            {agentLogs.length === 0 && (
                                <div className="text-slate-500 italic">Waiting for agent logs...</div>
                            )}
                            {agentLogs.map((log) => (
                                <div key={log.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2 duration-300">
                                    <span className="text-slate-600 text-xs pt-1">
                                        [{new Date(log.created_date).toLocaleTimeString()}]
                                    </span>
                                    <span className={`flex-1 break-words ${
                                        log.level === 'error' ? 'text-red-400' : 
                                        log.level === 'success' ? 'text-green-400' : 
                                        log.level === 'warning' ? 'text-yellow-400' : 
                                        'text-slate-300'
                                    }`}>
                                        <span className="mr-2">{'>'}</span>
                                        {log.message}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
              </AnimatePresence>

              {/* Add New Game Form */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                <h3 className="font-semibold mb-4">Add New Game</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <Input
                    placeholder="Game Title"
                    value={newGame.title}
                    onChange={(e) => setNewGame({ ...newGame, title: e.target.value })}
                    className="bg-slate-900 border-slate-700"
                  />
                  <Input
                    placeholder="Genre (e.g., Action RPG)"
                    value={newGame.genre}
                    onChange={(e) => setNewGame({ ...newGame, genre: e.target.value })}
                    className="bg-slate-900 border-slate-700"
                  />
                  <Input
                    placeholder="Price (e.g., 59.99)"
                    type="number"
                    value={newGame.price}
                    onChange={(e) => setNewGame({ ...newGame, price: e.target.value })}
                    className="bg-slate-900 border-slate-700"
                  />
                  <Input
                    placeholder="Cover Image URL"
                    value={newGame.cover_image}
                    onChange={(e) => setNewGame({ ...newGame, cover_image: e.target.value })}
                    className="bg-slate-900 border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <Textarea
                        placeholder="Video URLs (comma separated, YouTube preferred)"
                        value={newGame.video_urls ? newGame.video_urls.join(', ') : ''}
                        onChange={(e) => setNewGame({ ...newGame, video_urls: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                        className="bg-slate-900 border-slate-700 h-24"
                    />
                    <Textarea
                        placeholder="Screenshot URLs (comma separated)"
                        value={newGame.screenshots ? newGame.screenshots.join(', ') : ''}
                        onChange={(e) => setNewGame({ ...newGame, screenshots: e.target.value.split(',').map(s => s.trim()).filter(s => s) })}
                        className="bg-slate-900 border-slate-700 h-24"
                    />
                </div>
                <Textarea
                  placeholder="Game description..."
                  value={newGame.description}
                  onChange={(e) => setNewGame({ ...newGame, description: e.target.value })}
                  className="bg-slate-900 border-slate-700 mb-4"
                />
                <Button onClick={handleAddGame} disabled={createGameMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" /> Add Game
                </Button>
              </div>

              {/* Filter and Sort Controls */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Show:</span>
                  <Button
                    size="sm"
                    variant={showMissingImages ? "default" : "outline"}
                    onClick={() => setShowMissingImages(!showMissingImages)}
                    className={showMissingImages ? "bg-orange-600 hover:bg-orange-700" : ""}
                  >
                    Missing Images Only
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-400">Sort by:</span>
                  <Button
                    size="sm"
                    variant={gameSortBy === 'release_date' ? "default" : "outline"}
                    onClick={() => setGameSortBy('release_date')}
                  >
                    Release Date (Newest)
                  </Button>
                  <Button
                    size="sm"
                    variant={gameSortBy === 'popularity' ? "default" : "outline"}
                    onClick={() => setGameSortBy('popularity')}
                  >
                    Popularity
                  </Button>
                  <Button
                    size="sm"
                    variant={gameSortBy === 'title' ? "default" : "outline"}
                    onClick={() => setGameSortBy('title')}
                  >
                    Title (A-Z)
                  </Button>
                </div>
              </div>

              {/* Games List */}
              {gamesLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading games...
                </div>
              ) : (() => {
                // Filter games with missing images if needed
                let filteredGames = showMissingImages 
                  ? existingGames.filter(game => !game.cover_image || game.cover_image.includes('unsplash'))
                  : existingGames;

                // Sort games based on selected option
                const sortedGames = [...filteredGames].sort((a, b) => {
                  if (gameSortBy === 'release_date') {
                    const yearA = a.original_year || 0;
                    const yearB = b.original_year || 0;
                    return yearB - yearA; // Newest first
                  } else if (gameSortBy === 'popularity') {
                    // Use price as proxy for popularity (or add a popularity field)
                    const scoreA = (a.rating || 0) * 10 + (a.original_year || 0);
                    const scoreB = (b.rating || 0) * 10 + (b.original_year || 0);
                    return scoreB - scoreA;
                  } else {
                    return a.title.localeCompare(b.title);
                  }
                });

                const missingCount = existingGames.filter(g => !g.cover_image || g.cover_image.includes('unsplash')).length;

                return sortedGames.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                    <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    {showMissingImages ? (
                      <>
                        <p>No games with missing images found</p>
                        <p className="text-sm">All games have cover images!</p>
                      </>
                    ) : (
                      <>
                        <p>No games in database yet</p>
                        <p className="text-sm">Add games manually or use Auto-Populate</p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {showMissingImages && (
                      <div className="mb-4 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <p className="text-orange-400 text-sm font-semibold">
                          Found {missingCount} game{missingCount !== 1 ? 's' : ''} with missing or placeholder images
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence>
                        {sortedGames.map((game) => (
                      <motion.div
                        key={game.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden group"
                      >
                        <div className="aspect-video bg-black relative">
                          <img
                            src={game.cover_image || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400'}
                            alt={game.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2 flex gap-2">
                            {(!game.cover_image || game.cover_image.includes('unsplash')) && (
                              <Badge className="bg-orange-600">No Image</Badge>
                            )}
                            <Badge className="bg-green-600">${game.price}</Badge>
                          </div>
                          {game.original_year && (
                            <div className="absolute bottom-2 left-2">
                              <Badge variant="outline" className="bg-black/50">{game.original_year}</Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-semibold truncate">{game.title}</h4>
                          <p className="text-slate-400 text-sm truncate">{game.genre}</p>
                          <div className="flex items-center justify-between mt-3">
                            <Badge variant="outline" className="text-xs">{game.status}</Badge>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={() => deleteGameMutation.mutate(game.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    </AnimatePresence>
                    </div>
                    </>
                    );
                    })()}
                    </section>
                    </TabsContent>

          <TabsContent value="models">
            <Model3DManager />
          </TabsContent>

          <TabsContent value="animations">
            <AnimationFBXManager />
          </TabsContent>

          <TabsContent value="fbx-models">
            <ModelFBXManager />
          </TabsContent>

          <TabsContent value="scripts">
            <Model3DScriptManager />
          </TabsContent>

          <TabsContent value="keybinds">
            <KeybindManager />
          </TabsContent>

          <TabsContent value="ai-models">
            <AIModelController />
          </TabsContent>

          <TabsContent value="exp-progression">
            <ExpProgressionAdmin />
          </TabsContent>

          <TabsContent value="game-files" forceMount className="data-[state=inactive]:hidden">
            <GameFileAnalyzer />
          </TabsContent>

          <TabsContent value="reactor" forceMount className="data-[state=inactive]:hidden">
            <ReactorEditor />
          </TabsContent>

          <TabsContent value="attachment-editor" forceMount className="data-[state=inactive]:hidden">
            <AttachmentEditor />
          </TabsContent>

          <TabsContent value="asset-files">
            <AssetFilesManager />
          </TabsContent>

          <TabsContent value="video-analyzer">
            <VideoAnalyzer />
          </TabsContent>

          <TabsContent value="video-intel">
            <VideoIntelligence />
          </TabsContent>

          <TabsContent value="attachment-validator">
            <AttachmentVisualValidator />
          </TabsContent>

          <TabsContent value="quest-audio">
            <NPCActionAudioManager />
          </TabsContent>

          <TabsContent value="sounds">
            <SoundLibraryManager />
          </TabsContent>

          <TabsContent value="knowledge-engine">
            <KnowledgeEngineManager />
          </TabsContent>

                    </Tabs>
      </div>
    </div>
    </PageErrorBoundary>
  );
}