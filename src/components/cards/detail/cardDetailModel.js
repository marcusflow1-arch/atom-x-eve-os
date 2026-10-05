export const STAT_LABELS = { attack: 'Attack', defense: 'Defense', magic: 'Spirit', vitality: 'Vitality', speed: 'Dexterity' };
export const RARITY_COLORS = { Common:'#bbc6cd',Uncommon:'#88cbae',Rare:'#8ac7ee',Epic:'#c0a3f0',Legendary:'#e3be79',Mythic:'#ee9eaa',Mythical:'#ee9eaa',Unique:'#e5ade5',Limitless:'#f5ecdb' };
export const format = value => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString(undefined, {maximumFractionDigits:2});
export const words = value => String(value || '').replaceAll('_',' ').replace(/\b\w/g, char => char.toUpperCase());
export function dateLabel(value) {
  const date = value ? new Date(value) : null;
  return date && Number.isFinite(date.getTime()) ? date.toLocaleString(undefined,{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}) : 'Not recorded';
}
export function cardIdentity(card = {}, allowLegacyAchievement = false) {
  const userCardId = card.userCardId || card.user_card_id || card.ownedCardId || card.ownedCopies?.[0]?.id;
  if (userCardId) return {userCardId};
  if (card.isOwned === false || card.owned === false) return null;
  const achievementId = card.achievementId || card.achievement_id || (allowLegacyAchievement && !card.trading_card_id ? card.id : null);
  return achievementId ? {achievementId} : null;
}
export const materialCount = (materials, type) => (materials || []).filter(row => row.material_type === type).reduce((sum, row) => sum + Number(row.quantity || 0),0);
export const canAfford = (materials, costs) => costs && Object.entries(costs).every(([type, count]) => materialCount(materials,type) >= count);
export function marketBlock(card) {
  if (!card?.id) return 'Collect this card before listing it.';
  if (card.starter_grant_user_id) return 'Starter cards stay with your avatar and cannot be sold.';
  if (card.is_equipped) return 'Unequip this card before creating a listing.';
  if (card.trade_status === 'locked_in_trade') return 'This card is reserved by a listing or an active trade.';
  return '';
}
export function displayCard(card, state) {
  const owned = state?.userCard;
  return {
    title: owned?.card_name || card.title || card.name || 'Achievement card',
    image: owned?.card_image || card.image || card.image_url || card.card_image || '',
    rarity: owned?.card_rarity || card.rarity || card.card_rarity || 'Common',
    game: owned?.game_name || card.series || card.game_title || card.game_name || '',
    type: words(owned?.card_type || card.card_type || card.group || 'Achievement'),
    description: card.description || card.card_description || owned?.card_description || '',
  };
}
