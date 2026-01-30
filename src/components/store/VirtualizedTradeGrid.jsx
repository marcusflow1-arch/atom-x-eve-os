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

  const [leftQuery, setLeftQuery] = React.useState('');
  const [rightQuery, setRightQuery] = React.useState('');

  const filteredAbilities = React.useMemo(() => {
    const q = leftQuery.trim().toLowerCase();
    if (!q) return abilities;
    return abilities.filter(i => (i.name || '').toLowerCase().includes(q) || (i.game || '').toLowerCase().includes(q));
  }, [abilities, leftQuery]);

  const filteredEquipment = React.useMemo(() => {
    const q = rightQuery.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter(i => (i.name || '').toLowerCase().includes(q) || (i.game || '').toLowerCase().includes(q));
  }, [equipment, rightQuery]);

  return (
    <div className="relative h-full w-full">
      {/* Center divider line */}
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/20 pointer-events-none" />

      {/* Two sections: Abilities (left) and Equipment (right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-6">
        {/* Abilities */}
        <div className="h-full overflow-auto pr-3">
          <div className="mb-2 flex items-center justify-between">
            <input
              value={leftQuery}
              onChange={(e) => setLeftQuery(e.target.value)}
              placeholder="Search abilities..."
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="space-y-2">
            {filteredAbilities.map((item) => (
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
            {filteredAbilities.length === 0 && (
              <div className="text-white/40 text-sm">No abilities to display.</div>
            )}
          </div>
        </div>

        {/* Equipment */}
        <div className="h-full overflow-auto pl-3">
          <div className="mb-2 flex items-center justify-between">
            <input
              value={rightQuery}
              onChange={(e) => setRightQuery(e.target.value)}
              placeholder="Search equipment..."
              className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-1.5 text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="space-y-2">
            {filteredEquipment.map((item) => (
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
            {filteredEquipment.length === 0 && (
              <div className="text-white/40 text-sm">No equipment to display.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}