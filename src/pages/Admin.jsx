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
      // Fetch multiple categories in parallel
      const categories = [
        {
          name: 'Trending 2024-2025',
          prompt: `List 15 trending/popular video games from 2024-2025. Include: Monster Hunter Wilds, Elden Ring Nightreign, Black Myth Wukong, Helldivers 2, Palworld, Baldur's Gate 3, Final Fantasy VII Rebirth, Dragon's Dogma 2, Stellar Blade, Like a Dragon: Infinite Wealth, Tekken 8, Granblue Fantasy Relink, Prince of Persia Lost Crown, Skull and Bones, Suicide Squad Kill the Justice League.`
        },
        {
          name: 'Upcoming 2025',
          prompt: `List 15 upcoming video games releasing in 2025. Include: GTA 6, Civilization VII, Assassin's Creed Shadows, Metroid Prime 4, Avowed, Death Stranding 2, Ghost of Yotei, Kingdom Come Deliverance 2, Fable, Perfect Dark, Doom The Dark Ages, Borderlands 4, Mafia The Old Country, Judas, Hollow Knight Silksong.`
        },
        {
          name: 'Classic Best Sellers',
          prompt: `List 15 classic best-selling video games of all time. Include: Minecraft, GTA V, Tetris, Wii Sports, PUBG, Mario Kart 8, Red Dead Redemption 2, The Witcher 3, Skyrim, Elden Ring, God of War Ragnarok, Cyberpunk 2077, Hogwarts Legacy, Spider-Man 2, Zelda Tears of the Kingdom.`
        }
      ];

      const gameImages = {
        'action rpg': 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=800&fit=crop',
        'rpg': 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=800&fit=crop',
        'fps': 'https://images.unsplash.com/photo-1542751371-331572b78519?w=600&h=800&fit=crop',
        'shooter': 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
        'strategy': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=800&fit=crop',
        'survival': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=800&fit=crop',
        'racing': 'https://images.unsplash.com/photo-1511882150382-421056c89033?w=600&h=800&fit=crop',
        'sports': 'https://images.unsplash.com/photo-1493711662062-fa541f7f28c4?w=600&h=800&fit=crop',
        'horror': 'https://images.unsplash.com/photo-1509248961725-aec71c700e09?w=600&h=800&fit=crop',
        'adventure': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=600&h=800&fit=crop',
        'action adventure': 'https://images.unsplash.com/photo-1535378437327-b71494669e91?w=600&h=800&fit=crop',
        'sandbox': 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=600&h=800&fit=crop',
        'fighting': 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0f?w=600&h=800&fit=crop',
        'simulation': 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=600&h=800&fit=crop',
        'default': 'https://images.unsplash.com/photo-1493711662062-fa541f7f28c4?w=600&h=800&fit=crop'
      };

      for (const category of categories) {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt: `${category.prompt}
          
          For each game provide:
          - title (exact official game name)
          - description (2-3 engaging sentences about gameplay and story)
          - genre (one of: Action RPG, FPS, Strategy, RPG, Shooter, Survival, Racing, Sports, Horror, Adventure, Action Adventure, Sandbox, Fighting, Simulation)
          - price (realistic USD: AAA games 59.99-69.99, indie 19.99-39.99, older games 29.99-49.99)
          - developer (real studio name)
          - rating (realistic 4.0-4.9 based on actual reception)
          - releaseYear (actual or expected year)`,
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
                    releaseYear: { type: 'string' }
                  }
                }
              }
            }
          }
        });

        if (result.games) {
          for (const game of result.games) {
            const genreLower = (game.genre || 'default').toLowerCase();
            const coverImage = gameImages[genreLower] || gameImages['default'];
            
            // Check if game already exists
            const existing = existingGames.find(g => g.title?.toLowerCase() === game.title?.toLowerCase());
            if (!existing) {
              await Game.create({
                title: game.title,
                description: game.description,
                genre: genreLower,
                price: game.price || 59.99,
                status: 'available',
                cover_image: coverImage,
                original_year: parseInt(game.releaseYear) || 2024
              });
            }
          }
        }
      }
      
      refetchGames();
      alert(`Successfully populated games from ${categories.length} categories!`);
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