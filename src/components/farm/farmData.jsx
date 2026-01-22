export const MOCK_FARM_GAMES = [
    { id: 'g1', title: 'Cyberpunk 2088', genre: 'RPG', activeUsers: 12500, voiceRooms: 45, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80', tags: ['Owned'] },
    { id: 'g2', title: 'Neon Rivals', genre: 'Action', activeUsers: 8400, voiceRooms: 23, image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=800&q=80', tags: ['Owned'] },
    { id: 'g3', title: 'Star Conquest', genre: 'Strategy', activeUsers: 15600, voiceRooms: 89, image: 'https://images.unsplash.com/photo-1614720180553-37e0055b44f5?w=800&q=80', tags: [] },
    { id: 'g4', title: 'Elden Ring', genre: 'RPG', activeUsers: 45000, voiceRooms: 120, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&q=80', tags: ['Owned'] },
    { id: 'g5', title: 'Call of Duty', genre: 'Shooter', activeUsers: 89000, voiceRooms: 340, image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', tags: [] },
    { id: 'g6', title: 'Stardew Valley', genre: 'Simulation', activeUsers: 12000, voiceRooms: 15, image: 'https://images.unsplash.com/photo-1551103782-8ab07afd45c1?w=800&q=80', tags: ['Owned'] },
];

export const getFarmGameById = (id) => MOCK_FARM_GAMES.find(g => g.id === id);