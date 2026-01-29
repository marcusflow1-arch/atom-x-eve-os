export const GAME_WALLPAPERS = {
  'Wandering Sword': 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6876751a602125f45f1861b9/b6b2ecef7_download.jpg',
};

export function getWallpaperFor(title) {
  if (!title) return undefined;
  return GAME_WALLPAPERS[title] || undefined;
}