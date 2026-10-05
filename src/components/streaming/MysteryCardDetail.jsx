import CardDetailWorkspace from '@/components/cards/detail/CardDetailWorkspace';
export default function MysteryCardDetail({ card, onBack }) {
  return <CardDetailWorkspace card={card} onClose={onBack} allowLegacyAchievement/>;
}
