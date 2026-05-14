import React, { useEffect, useRef } from 'react';
import { Check, X, Eye } from 'lucide-react';

/**
 * Right-click context menu for inventory items.
 * Offers Equip / Unequip / Inspect depending on item state.
 */
export default function InventoryItemContextMenu({
  x,
  y,
  item,
  onEquip,
  onUnequip,
  onInspect,
  onClose,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', handleClick);
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('mousedown', handleClick);
      window.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  if (!item) return null;

  return (
    <div
      ref={menuRef}
      className="fixed z-[200] min-w-[150px] rounded-md border border-white/15 bg-[#0f1117]/95 backdrop-blur-md shadow-2xl py-1 text-sm text-white/90"
      style={{ left: x, top: y }}
    >
      <div className="px-3 py-1.5 text-[11px] uppercase tracking-wider text-white/40 border-b border-white/10 mb-1 truncate">
        {item.name}
      </div>

      {item.equipped ? (
        <button
          onClick={() => { onUnequip?.(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.08] text-left"
        >
          <X className="w-3.5 h-3.5 text-rose-300" />
          Unequip
        </button>
      ) : (
        <button
          onClick={() => { onEquip?.(); onClose(); }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.08] text-left"
        >
          <Check className="w-3.5 h-3.5 text-emerald-300" />
          Equip
        </button>
      )}

      <button
        onClick={() => { onInspect?.(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/[0.08] text-left"
      >
        <Eye className="w-3.5 h-3.5 text-sky-300" />
        Inspect
      </button>
    </div>
  );
}