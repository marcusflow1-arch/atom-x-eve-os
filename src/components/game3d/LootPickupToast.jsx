import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LOOT_RARITIES } from './lootStore';

/**
 * Listens for the global `lootPickup` custom event and shows a
 * bottom-right toast for each collected item.
 */
export default function LootPickupToast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const item = e.detail;
      if (!item) return;
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev.slice(-4), { ...item, id }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3200);
    };
    window.addEventListener('lootPickup', handler);
    return () => window.removeEventListener('lootPickup', handler);
  }, []);

  return (
    <div className="absolute bottom-24 right-4 flex flex-col gap-2 pointer-events-none z-40">
      <AnimatePresence>
        {toasts.map((toast) => {
          const rarity = LOOT_RARITIES[toast.rarity] || LOOT_RARITIES.common;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 40, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.9 }}
              transition={{ duration: 0.22 }}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
              style={{
                background: 'rgba(8, 10, 16, 0.88)',
                backdropFilter: 'blur(14px) saturate(160%)',
                WebkitBackdropFilter: 'blur(14px) saturate(160%)',
                border: `1px solid ${rarity.color}55`,
                boxShadow: `0 4px 18px ${rarity.color}30`,
                minWidth: 200,
              }}
            >
              <span className="text-xl">{toast.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-bold truncate">{toast.name}</div>
                <div
                  className="text-[9px] font-bold tracking-[0.2em] uppercase"
                  style={{ color: rarity.color }}
                >
                  {rarity.label} · {toast.category}
                </div>
              </div>
              <span className="text-[9px] text-white/40 shrink-0">Collected</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}