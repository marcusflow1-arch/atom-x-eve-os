import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameFilters } from '../store/hooks/useGameFilters';

const mockGames = [
  { id: 1, title: 'Cyberpunk 2088', genre: 'RPG', price: 59.99, rating: 4.8, aiEnhanced: true, original_year: 2025 },
  { id: 2, title: 'Neon Legends', genre: 'Action', price: 29.99, rating: 4.5, aiEnhanced: false, original_year: 2024 },
  { id: 3, title: 'Stellar Odyssey', genre: 'Sci-Fi', price: 49.99, rating: 4.9, aiEnhanced: true, original_year: 2024 },
  { id: 4, title: 'Horror House', genre: 'Horror', price: 19.99, rating: 3.8, aiEnhanced: false, original_year: 2023 },
];

describe('useGameFilters hook', () => {
  it('should initialize with default filters', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    expect(result.current.activeCategory).toBe('All Games');
    expect(result.current.priceRange).toEqual([0, 100]);
    expect(result.current.selectedGenres).toEqual([]);
    expect(result.current.minRating).toBe(0);
    expect(result.current.showAndroidOnly).toBe(false);
  });

  it('should filter games by category - Top Rated', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    act(() => {
      result.current.setActiveCategory('Top Rated');
    });

    const genreData = result.current.genreData;
    const allFilteredGames = genreData.flatMap(g => g.items);
    
    expect(allFilteredGames.every(game => game.rating >= 4.8)).toBe(true);
    expect(allFilteredGames.length).toBeLessThan(mockGames.length);
  });

  it('should filter games by genre', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    act(() => {
      result.current.toggleGenre('RPG');
    });

    const genreData = result.current.genreData;
    expect(genreData.length).toBe(1);
    expect(genreData[0].label).toBe('RPG');
  });

  it('should filter games by price range', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    act(() => {
      result.current.setPriceRange([0, 30]);
    });

    const genreData = result.current.genreData;
    const allFilteredGames = genreData.flatMap(g => g.items);
    
    expect(allFilteredGames.every(game => game.price <= 30)).toBe(true);
  });

  it('should filter games by minimum rating', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    act(() => {
      result.current.setMinRating(4);
    });

    const genreData = result.current.genreData;
    const allFilteredGames = genreData.flatMap(g => g.items);
    
    expect(allFilteredGames.every(game => game.rating >= 4)).toBe(true);
  });

  it('should combine multiple filters correctly', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    act(() => {
      result.current.setActiveCategory('AI Enhanced');
      result.current.setMinRating(4.5);
    });

    const genreData = result.current.genreData;
    const allFilteredGames = genreData.flatMap(g => g.items);
    
    expect(allFilteredGames.every(game => game.aiEnhanced && game.rating >= 4.5)).toBe(true);
  });

  it('should reset all filters', () => {
    const { result } = renderHook(() => useGameFilters(mockGames, false));

    act(() => {
      result.current.setActiveCategory('Top Rated');
      result.current.setPriceRange([20, 50]);
      result.current.toggleGenre('RPG');
      result.current.setMinRating(4);
      result.current.resetFilters();
    });

    expect(result.current.activeCategory).toBe('All Games');
    expect(result.current.priceRange).toEqual([0, 100]);
    expect(result.current.selectedGenres).toEqual([]);
    expect(result.current.minRating).toBe(0);
  });
});