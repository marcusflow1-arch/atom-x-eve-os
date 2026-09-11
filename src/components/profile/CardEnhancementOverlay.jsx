import React from 'react';
import CardProgressionInspector from '@/components/profile/cardDetail/CardProgressionInspector';

export default function CardEnhancementOverlay({ card, onClose }) {
  return <CardProgressionInspector key={card?.id} card={card} onClose={onClose} />;
}