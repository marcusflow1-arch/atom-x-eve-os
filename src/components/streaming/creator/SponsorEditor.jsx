import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';

export default function SponsorEditor({ isEditMode, sponsors = [], onAdd, onRemove, onUpdate }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSponsor, setNewSponsor] = useState({ name: '', logo_url: '', affiliate_link: '', tier: 'bronze' });

  const handleAdd = () => {
    if (!newSponsor.name.trim()) return;
    onAdd(newSponsor);
    setNewSponsor({ name: '', logo_url: '', affiliate_link: '', tier: 'bronze' });
    setShowAddForm(false);
  };

  const handleLogoUpload = async (index) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        onUpdate(index, 'logo_url', file_url);
      } catch {
        onUpdate(index, 'logo_url', URL.createObjectURL(file));
      }
    };
    input.click();
  };

  const tierColors = {
    platinum: 'border-white/40 bg-white/10',
    gold: 'border-yellow-500/40 bg-yellow-500/10',
    silver: 'border-slate-400/40 bg-slate-400/10',
    bronze: 'border-orange-600/40 bg-orange-600/10'
  };

  if (!isEditMode) {
    // View mode: simple sponsor display
    if (sponsors.length === 0) return null;
    return (
      <div className="w-full">
        <h3 className="text-white font-bold text-lg mb-4">Sponsors & Partners</h3>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {sponsors.map((s, i) => (
            <div key={i} className={`flex-shrink-0 px-6 py-4 rounded-xl border ${tierColors[s.tier] || tierColors.bronze} flex items-center gap-3 min-w-[200px]`}>
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.name} className="w-10 h-10 rounded-lg object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/30 font-bold text-lg">
                  {s.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-white">{s.name}</div>
                <div className="text-[10px] text-white/40 uppercase">{s.tier}</div>
              </div>
              {s.affiliate_link && (
                <a href={s.affiliate_link} target="_blank" rel="noopener noreferrer" className="ml-auto text-white/30 hover:text-white transition-colors">
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Edit mode
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          Sponsors & Partners
          <Badge className="bg-white text-black text-[10px]">EDITING</Badge>
        </h3>
        <Button size="sm" className="bg-white text-black hover:bg-slate-200" onClick={() => setShowAddForm(true)}>
          <Plus className="w-3 h-3 mr-2" /> Add Sponsor
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 space-y-3">
          <Input value={newSponsor.name} onChange={(e) => setNewSponsor({ ...newSponsor, name: e.target.value })} placeholder="Sponsor Name" className="bg-black/20 border-white/10 text-white" />
          <Input value={newSponsor.affiliate_link} onChange={(e) => setNewSponsor({ ...newSponsor, affiliate_link: e.target.value })} placeholder="Affiliate Link" className="bg-black/20 border-white/10 text-white" />
          <select value={newSponsor.tier} onChange={(e) => setNewSponsor({ ...newSponsor, tier: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-black/20 border border-white/10 text-white text-sm">
            <option value="platinum">Platinum</option>
            <option value="gold">Gold</option>
            <option value="silver">Silver</option>
            <option value="bronze">Bronze</option>
          </select>
          <div className="flex gap-2">
            <Button size="sm" className="bg-white text-black" onClick={handleAdd}>Add</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {sponsors.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${tierColors[s.tier] || tierColors.bronze} group`}>
            <GripVertical className="w-4 h-4 text-white/20 cursor-grab" />
            <div
              onClick={() => handleLogoUpload(i)}
              className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors overflow-hidden flex-shrink-0"
            >
              {s.logo_url ? (
                <img src={s.logo_url} alt={s.name} className="w-full h-full object-cover" />
              ) : (
                <Plus className="w-4 h-4 text-white/40" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Input
                value={s.name}
                onChange={(e) => onUpdate(i, 'name', e.target.value)}
                className="h-7 text-sm bg-transparent border-none text-white font-bold p-0 focus-visible:ring-0"
              />
              <Input
                value={s.affiliate_link || ''}
                onChange={(e) => onUpdate(i, 'affiliate_link', e.target.value)}
                placeholder="Affiliate link..."
                className="h-6 text-xs bg-transparent border-none text-white/50 p-0 focus-visible:ring-0"
              />
            </div>
            <select
              value={s.tier || 'bronze'}
              onChange={(e) => onUpdate(i, 'tier', e.target.value)}
              className="px-2 py-1 rounded bg-black/30 border border-white/10 text-white text-xs"
            >
              <option value="platinum">Platinum</option>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
              <option value="bronze">Bronze</option>
            </select>
            <button onClick={() => onRemove(i)} className="text-white/30 hover:text-red-400 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {sponsors.length === 0 && (
          <div className="text-center py-8 text-white/30 text-sm">No sponsors yet. Click "Add Sponsor" to get started.</div>
        )}
      </div>
    </div>
  );
}