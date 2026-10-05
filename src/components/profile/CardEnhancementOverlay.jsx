import CardDetailWorkspace from '@/components/cards/detail/CardDetailWorkspace';
export default function CardEnhancementOverlay({ card, onClose }) {
  return <div className="absolute inset-0 z-50"><CardDetailWorkspace card={card} onClose={onClose}/></div>;
}
