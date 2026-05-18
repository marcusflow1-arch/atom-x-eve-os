import React, { useState } from 'react';
import { Package, Coins, Gem, Upload, Download } from 'lucide-react';
import { clanAction } from './clanStore';

const RARITY_COLORS = {
  common: 'border-white/15 text-white/80',
  uncommon: 'border-green-400/30 text-green-300',
  rare: 'border-blue-400/30 text-blue-300',
  epic: 'border-purple-400/30 text-purple-300',
  legendary: 'border-amber-400/40 text-amber-300',
  mythical: 'border-red-400/40 text-red-300',
};

/** Guild Vault tab — deposit/withdraw items, view stash tabs. */
export default function ClanOverlayVault({ clan, vaultItems, myMembership, hall }) {
  const [activeTab, setActiveTab] = useState(0);
  const [showDeposit, setShowDeposit] = useState(false);
  const [draft, setDraft] = useState({ item_name: '', quantity: 1, rarity: 'common' });

  if (!clan) return null;

  const tabs = [0, 1, 2, 3];
  const items = vaultItems.filter((v) => (v.stash_tab || 0) === activeTab);

  const deposit = async () => {
    if (!draft.item_name.trim()) return;
    try {
      await clanAction('deposit_vault', { divisionId: clan.id, item: { ...draft, stash_tab: activeTab } });
      setDraft({ item_name: '', quantity: 1, rarity: 'common' });
      setShowDeposit(false);
    } catch (e) { console.error(e); }
  };

  const withdraw = async (item) => {
    try { await clanAction('withdraw_vault', { vaultItemId: item.id, quantity: item.quantity }); }
    catch (e) { console.error(e); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-white/10 flex items-center gap-4"
        style={{ background: 'linear-gradient(90deg, rgba(40,80,120,0.18) 0%, rgba(15,18,25,0) 100%)' }}>
        <Package className="w-6 h-6 text-blue-300" />
        <div className="flex-1">
          <h2 className="text-white text-lg font-bold">Guild Vault</h2>
          <p className="text-white/50 text-xs">Shared storage for all guild members</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-300 text-sm">
            <Coins className="w-4 h-4" />
            <span className="font-bold">{hall?.favor || 0}</span>
            <span className="text-white/40 text-xs ml-1">Favor</span>
          </div>
          <div className="flex items-center gap-1 text-cyan-300 text-sm">
            <Gem className="w-4 h-4" />
            <span className="font-bold">{hall?.aetherium || 0}</span>
            <span className="text-white/40 text-xs ml-1">Aetherium</span>
          </div>
        </div>
      </div>

      {/* Stash tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/5">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-t transition-colors ${
              activeTab === t
                ? 'bg-white/10 text-white border-t border-l border-r border-white/15'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            Tab {t + 1}
          </button>
        ))}
        <button
          onClick={() => setShowDeposit(!showDeposit)}
          className="ml-auto mb-1 flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 rounded hover:bg-emerald-500/25"
        >
          <Upload className="w-3 h-3" />
          Deposit
        </button>
      </div>

      {showDeposit && (
        <div className="mx-6 mt-3 p-3 rounded bg-black/30 border border-white/10 space-y-2">
          <input
            value={draft.item_name}
            onChange={(e) => setDraft({ ...draft, item_name: e.target.value })}
            placeholder="Item name"
            className="w-full px-2 py-1 bg-black/40 border border-white/10 rounded text-white text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number" min="1" value={draft.quantity}
              onChange={(e) => setDraft({ ...draft, quantity: parseInt(e.target.value) || 1 })}
              className="w-24 px-2 py-1 bg-black/40 border border-white/10 rounded text-white text-sm"
            />
            <select
              value={draft.rarity}
              onChange={(e) => setDraft({ ...draft, rarity: e.target.value })}
              className="flex-1 px-2 py-1 bg-black/40 border border-white/10 rounded text-white text-sm"
            >
              <option value="common">Common</option>
              <option value="uncommon">Uncommon</option>
              <option value="rare">Rare</option>
              <option value="epic">Epic</option>
              <option value="legendary">Legendary</option>
              <option value="mythical">Mythical</option>
            </select>
            <button onClick={deposit} className="px-3 py-1 text-xs font-semibold bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded hover:bg-amber-500/30">
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* 8x6 vault grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-8 gap-1.5">
          {Array.from({ length: 48 }).map((_, idx) => {
            const item = items[idx];
            if (!item) {
              return <div key={idx} className="aspect-square rounded bg-black/20 border border-white/5" />;
            }
            const cls = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
            return (
              <button
                key={item.id}
                onClick={() => withdraw(item)}
                title={`${item.item_name} ×${item.quantity}\nClick to withdraw`}
                className={`relative aspect-square rounded bg-black/40 border-2 ${cls} hover:bg-white/[0.06] transition-colors group`}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {item.item_icon ? (
                    <img src={item.item_icon} alt="" className="w-3/4 h-3/4 object-contain" />
                  ) : (
                    <Package className="w-1/2 h-1/2 opacity-60" />
                  )}
                </div>
                {item.quantity > 1 && (
                  <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-white drop-shadow">×{item.quantity}</span>
                )}
                <Download className="absolute top-1 right-1 w-3 h-3 opacity-0 group-hover:opacity-100 text-white/70" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}