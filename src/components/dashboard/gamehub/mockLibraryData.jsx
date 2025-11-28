import { allMockGames } from '../../store/mockData';

// Convert allMockGames object to an array for the library
const gamesList = Object.values(allMockGames).filter(game => game && game.id);

// FIXED: Normalize games to ensure all have required properties
const normalizedGames = gamesList.map(game => ({
    ...game,
    genres: game.genres || (game.genre ? [game.genre] : ['Uncategorized']),
    cover: game.cover_image || game.cover || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=800&fit=crop',
    rating: game.rating || 4.0,
    achievements: game.achievements || [],
    equipment: game.equipment || [],
    abilities: game.abilities || [],
    lootBoxes: game.lootBoxes || []
}));

export const mockLibrary = {
    games: normalizedGames.slice(0, 12), // Get first 12 games for the library
    totalCount: normalizedGames.length
};

// Mock game details (extended information)
export const mockGameDetails = normalizedGames.reduce((acc, game) => {
    acc[game.id] = {
        ...game,
        description: game.description || 'An amazing game experience awaits.',
        rating: game.rating || 4.5
    };
    return acc;
}, {});