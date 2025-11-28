import React from 'react';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

export default function StoreListItem({ item, onCardClick, isActive }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      onClick={() => onCardClick(item)}
      className={`store-list-item ${isActive ? 'active' : ''}`}
    >
      <img src={item.image} alt={item.title} className="list-item-image" />
      <div className="list-item-info">
        <h3 className="list-item-title">{item.title}</h3>
        <div className="flex flex-wrap gap-2 mt-1">
          {item.tags?.slice(0, 2).map(tag => (
            <span key={tag} className="tag-sm">{tag}</span>
          ))}
        </div>
        {item.rating && (
          <div className="list-item-rating">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span>{item.rating}</span>
          </div>
        )}
      </div>
      <div className="list-item-pricing">
        {item.discount && <div className="discount-badge-sm">-{item.discount}%</div>}
        <div className="price-container-sm">
          {item.originalPrice && (
            <span className="original-price-sm">{item.originalPrice.toLocaleString()} AGP</span>
          )}
          <span className="current-price-sm">{item.price.toLocaleString()} AGP</span>
        </div>
      </div>
    </motion.div>
  );
}