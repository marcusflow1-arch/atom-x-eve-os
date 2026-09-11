// ─── Shop Effects Bridge ──────────────────────────────────────────────
// Listens for `useShopItem` events and applies the real gameplay effect.

import React, { useEffect } from 'react';
import { setHP, getPlayerHUD } from '../playerHUDStore';
import { addGold } from './shopStore';
import { addLootToInventory } from '../lootStore';
import { grantElixir, consumeElixir } from '../progression/elixirStore';
import toast from 'react-hot-toast';

let _damageBuff = { stacks: 0, mult: 1.0 };
let _critBuff   = { stacks: 0, pct: 0 };

export function consumeShopDamageBuff() {
  if (_damageBuff.stacks <= 0) return 1.0;
  const m = _damageBuff.mult;
  _damageBuff = { stacks: _damageBuff.stacks - 1, mult: _damageBuff.stacks - 1 > 0 ? _damageBuff.mult : 1.0 };
  return m;
}
export function consumeShopCritBuff() {
  if (_critBuff.stacks <= 0) return 0;
  const p = _critBuff.pct;
  _critBuff = { stacks: _critBuff.stacks - 1, pct: _critBuff.stacks - 1 > 0 ? _critBuff.pct : 0 };
  return p;
}
export function getShopBuffSnapshot() {
  return { damage: _damageBuff, crit: _critBuff };
}

export default function ShopEffectsBridge() {
  useEffect(() => {
    const onUse = (e) => {
      const item = e.detail?.item;
      if (!item) return;
      const eff = item.effect || {};
      switch (eff.kind) {
        case 'heal': {
          const hud = getPlayerHUD();
          setHP(Math.min(hud.maxHP || 100, (hud.hp || 0) + eff.amount));
          toast.success(`${item.name}: +${eff.amount} HP`, { icon: '❤️' });
          break;
        }
        case 'damage_buff': {
          _damageBuff = { stacks: eff.stacks, mult: eff.multPerStack };
          toast.success(`${item.name}: +${Math.round((eff.multPerStack - 1) * 100)}% dmg × ${eff.stacks} hits`, { icon: '⚔️' });
          break;
        }
        case 'crit_buff': {
          _critBuff = { stacks: eff.stacks, pct: eff.critPctPerStack };
          toast.success(`${item.name}: +${eff.critPctPerStack}% crit × ${eff.stacks} hits`, { icon: '✨' });
          break;
        }
        case 'permanent_elixir': {
          const type = eff.elixirType;
          if (!grantElixir(type, 1)) {
            toast.error('Unable to store this elixir.');
            break;
          }
          const result = consumeElixir(type, 1);
          if (result.ok) {
            toast.success(`${item.name}: permanent bonus applied (${result.total}/400)`, { icon: item.icon || '🧬' });
          } else {
            toast.error(result.reason || 'Elixir is already maxed.');
          }
          break;
        }
        case 'gold_grant': {
          addGold(eff.amount);
          toast.success(`+${eff.amount} gold`, { icon: '🪙' });
          break;
        }
        case 'add_material': {
          addLootToInventory({
            id: eff.materialId, name: item.name, category: 'material',
            rarity: item.rarity, icon: item.icon,
            dropId: `shop_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          });
          toast.success(`${item.name} added to inventory`, { icon: item.icon });
          break;
        }
        case 'companion_stat': {
          window.dispatchEvent(new CustomEvent('companionStatBoost', { detail: { stat: eff.stat, amount: eff.amount } }));
          toast.success(`Companion: +${eff.amount} ${eff.stat}`, { icon: '🐺' });
          break;
        }
        case 'companion_heal': {
          window.dispatchEvent(new CustomEvent('companionFullHeal'));
          toast.success('Companion fully healed', { icon: '🍖' });
          break;
        }
        default: break;
      }
    };
    window.addEventListener('useShopItem', onUse);
    return () => window.removeEventListener('useShopItem', onUse);
  }, []);
  return null;
}