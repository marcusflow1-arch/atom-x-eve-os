import { useState, useMemo } from 'react';
import { Shield, Crosshair, Gamepad2, Trophy, Monitor, Car, Skull, Music, Zap, Heart, Sparkles } from 'lucide-react';

/**
 * Hook for managing game filters and categorization
 * @param {Array} games - Array of game objects
 * @param {boolean} loading - Loading state
 * @returns {Object} Filter state, handlers, and filtered data
 */
export function useGameFilters(games, loading) {
  const [activeCategory, setActiveCategory] = useState('All Games');
  const [priceRange, setPriceRange] = useState([0, 100]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [minRating, setMinRating] = useState(0);
  const [showAndroidOnly, setShowAndroidOnly] = useState(false);

  /**
   * Group games by genre with applied filters
   */
  const genreData = useMemo(() => {
    if (loading || games.length === 0) return [];
    
    // Filter Games
    const filteredGames = games.filter(game => {
      // Android Filter
      if (showAndroidOnly && !game.platforms?.includes('Android') && !game.isMobile) return false;

      // Category Filter
      if (activeCategory === 'Trending Now' && (game.rating < 4.5 && game.reviews < 1000)) return false;
      if (activeCategory === 'New Releases' && game.original_year < 2024) return false;
      if (activeCategory === 'Top Rated' && game.rating < 4.8) return false;
      if (activeCategory === 'AI Enhanced' && !game.aiEnhanced) return false;
      if (activeCategory === 'On Sale' && (!game.originalPrice || game.price >= game.originalPrice)) return false;

      // Genre Filter
      if (selectedGenres.length > 0 && !selectedGenres.includes(game.genre)) return false;

      // Price Filter
      if (game.price < priceRange[0] || game.price > priceRange[1]) return false;

      // Rating Filter
      if (minRating > 0 && (game.rating || 0) < minRating) return false;

      return true;
    });

    // Group by genre
    const groups = {};
    filteredGames.forEach(game => {
      const g = game.genre || 'Other';
      if (!groups[g]) groups[g] = [];
      groups[g].push(game);
    });

    const sortedGenres = Object.keys(groups).sort();
    
    // Icon mapping
    const GENRE_ICONS = {
      'Action': Crosshair,
      'RPG': Shield,
      'Strategy': Trophy,
      'Simulation': Monitor,
      'Sports': Trophy,
      'Racing': Car,
      'Horror': Skull,
      'Shooter': Crosshair,
      'Music': Music,
      'Adventure': Gamepad2,
      'Puzzle': Zap,
      'Romance': Heart,
      'Sci-Fi': Sparkles,
    };
    
    return sortedGenres.map(genre => ({
      id: genre,
      label: genre,
      items: groups[genre],
      icon: GENRE_ICONS[genre] || Gamepad2
    }));
  }, [games, loading, activeCategory, selectedGenres, priceRange, minRating, showAndroidOnly]);

  /**
   * Toggle genre selection
   */
  const toggleGenre = (genre) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setActiveCategory('All Games');
    setPriceRange([0, 100]);
    setSelectedGenres([]);
    setMinRating(0);
    setShowAndroidOnly(false);
  };

  return {
    activeCategory,
    setActiveCategory,
    priceRange,
    setPriceRange,
    selectedGenres,
    toggleGenre,
    minRating,
    setMinRating,
    showAndroidOnly,
    setShowAndroidOnly,
    genreData,
    resetFilters
  };
}