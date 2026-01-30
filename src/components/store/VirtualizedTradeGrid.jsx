import React from 'react';

export default function VirtualizedTradeGrid({ items, onSelectItem }) {
  const abilities = React.useMemo(() => {
    return (items || []).filter((i) => {
      const t = (i?.type || i?.item_type || '').toLowerCase();
      return t.includes('ability');
    });
  }, [items]);

  const equipment = React.useMemo(() => {
    return (items || []).filter((i) => {
      const t = (i?.type || i?.item_type || '').toLowerCase();
      return t.includes('equipment');
    });
  }, [items]);

  return (
    <div className="relative h-full w-full">
      {/* Center divider line */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 pointer-events-none" />

      {/* Two sections: Abilities (left) and Equipment (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-6">
        {/* Abilities */}
        <div className="h-full overflow-auto pr-3">
          <div className="space-y-2">
            {abilities.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem && onSelectItem(item)}
                className="w-full flex items-center gap-3 p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover bg-black/40"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name || 'Unnamed'}</p>
                </div>
              </button>
            ))}
            {abilities.length === 0 && (
              <div className="text-white/40 text-sm">No abilities to display.</div>
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="h-full overflow-auto pl-3">
          <div className="space-y-2">
            {equipment.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectItem && onSelectItem(item)}
                className="w-full flex items-center gap-3 p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-lg object-cover bg-black/40"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{item.name || 'Unnamed'}</p>
                </div>
              </button>
            ))}
            {equipment.length === 0 && (
              <div className="text-white/40 text-sm">No equipment to display.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}