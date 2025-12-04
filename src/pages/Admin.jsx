import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, Trash2, Play, Pause, Check, X, Film, Loader2, Gamepad2, RefreshCw, Plus, Search } from 'lucide-react';
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

export default function Admin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [previewVideo, setPreviewVideo] = useState(null);
  const [populatingGames, setPopulatingGames] = useState(false);
  const [newGame, setNewGame] = useState({ title: '', description: '', genre: '', price: '', cover_image: '' });

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
      setNewGame({ title: '', description: '', genre: '', price: '', cover_image: '' });
    },
  });

  const deleteGameMutation = useMutation({
    mutationFn: (id) => Game.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminGames'] }),
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('video/mp4')) {
      alert('Please upload an MP4 file');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      await createMutation.mutateAsync({
        title: newTitle || file.name.replace('.mp4', ''),
        video_url: file_url,
        is_active: true,
      });
      
      setNewTitle('');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = (bg) => {
    updateMutation.mutate({ id: bg.id, data: { is_active: !bg.is_active } });
  };

  const deleteBackground = (id) => {
    if (confirm('Are you sure you want to delete this background?')) {
      deleteMutation.mutate(id);
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

  const populateGamesFromSearch = async () => {
    setPopulatingGames(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate a list of 12 popular video games from 2024-2025 with the following details for each:
        - title (exact game name)
        - description (2-3 sentences about the game)
        - genre (one of: Action RPG, FPS, Strategy, RPG, Shooter, Survival, Racing, Sports, Horror, Adventure)
        - price (realistic USD price like 59.99 or 69.99)
        - developer (real developer name)
        - rating (4.0 to 5.0)
        
        Include games like: Monster Hunter Wilds, Elden Ring Nightreign, Black Myth Wukong, Helldivers 2, Civilization VII, GTA 6, Assassin's Creed Shadows, Metroid Prime 4, Avowed, etc.`,
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
                  rating: { type: 'number' }
                }
              }
            }
          }
        }
      });

      if (result.games) {
        for (const game of result.games) {
          await Game.create({
            title: game.title,
            description: game.description,
            genre: game.genre.toLowerCase(),
            price: game.price,
            status: 'available',
            cover_image: `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 200000000000)}?w=600&h=800&fit=crop`
          });
        }
        refetchGames();
      }
    } catch (error) {
      console.error('Failed to populate games:', error);
      alert('Failed to populate games. Please try again.');
    }
    setPopulatingGames(false);
  };

  const handleAddGame = () => {
    if (!newGame.title || !newGame.price) {
      alert('Title and price are required');
      return;
    }
    createGameMutation.mutate({
      ...newGame,
      price: parseFloat(newGame.price),
      status: 'available'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-black mb-2">Admin Panel</h1>
        <p className="text-slate-400 mb-8">Manage hero backgrounds, games, and site content</p>

        <Tabs defaultValue="backgrounds" className="space-y-6">
          <TabsList className="bg-slate-900 border border-slate-800">
            <TabsTrigger value="backgrounds">Hero Backgrounds</TabsTrigger>
            <TabsTrigger value="games">Game Catalog</TabsTrigger>
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
                  accept="video/mp4"
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
                        Upload MP4
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
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-slate-400">
                    {existingGames.length} Games
                  </Badge>
                  <Button 
                    onClick={populateGamesFromSearch}
                    disabled={populatingGames}
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

              {/* Games List */}
              {gamesLoading ? (
                <div className="text-center py-12 text-slate-500">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  Loading games...
                </div>
              ) : existingGames.length === 0 ? (
                <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
                  <Gamepad2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No games in database yet</p>
                  <p className="text-sm">Add games manually or use Auto-Populate</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {existingGames.map((game) => (
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
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-green-600">${game.price}</Badge>
                          </div>
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
              )}
            </section>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}