import React, { useEffect, useMemo, useState } from 'react';
import {
  Backpack,
  Check,
  ChevronRight,
  Gem,
  Lock,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react';

import HaloSubTab from '../../progression/hub/HaloSubTab';
import TitleSubTab from '../../progression/hub/TitleSubTab';
import WingsSubTab from '../../progression/hub/WingsSubTab';
import CapeSubTab from '../../progression/hub/CapeSubTab';
import CoreSubTab from '../../progression/hub/CoreSubTab';
import ElixirSubTab from '../../progression/hub/ElixirSubTab';
import PetSubTab from '../../progression/hub/PetSubTab';
import MountSubTab from '../../progression/hub/MountSubTab';
import VanitySubTab from '../../progression/hub/VanitySubTab';
import CostumeSubTab from '../../progression/hub/CostumeSubTab';

import {
  getItemEnchantments,
  getItemOverEnchant,
  getItemReinforcement,
  getMaterials,
  getCostForNextLevel,
  subscribeEnchantments,
} from '../../equipment/enchantmentStore';
import {
  getAXEAdvancementState,
  subscribeAXEItemAdvancement,
} from '../equipment/AXEItemAdvancementStore';
import {
  getAXESocketState,
  subscribeAXESockets,
} from '../equipment/AXESocketGemStore';
import { AXE_GEM_DEFINITIONS } from '../equipment/AXESocketGemSystem';
import {
  getAXEItemAura,
  subscribeAXEAura,
} from '../equipment/AXEEquipmentAuraStore';
import {
  getAllAXEEquipmentItems,
  subscribeAXEEquipmentInventory,
} from '../equipment/AXEEquipmentInventoryStore';
import {
  getLootInventory,
  getLootItemCount,
  subscribeLootInventory,
} from '../../lootStore';
import {
  AXE_SERVICE_CATEGORIES,
  AXE_SERVICE_REGISTRY,
  getAXEService,
  normalizeAXEServiceRequest,
} from './AXEServiceRegistry';
import { executeAXEServiceTransaction } from './AXEServiceTransactionGateway';
import { getAXEServiceInventoryCost } from './AXEServiceEconomy';

const PROGRESSION_PANELS = {
  halo: HaloSubTab,
  title: TitleSubTab,
  wings: WingsSubTab,
  cape: CapeSubTab,
  core: CoreSubTab,
  elixir: ElixirSubTab,
  pet: PetSubTab,
  mount: MountSubTab,
  vanity: VanitySubTab,
  costume: CostumeSubTab,
};

const CATEGORY_LABELS = {
  [AXE_SERVICE_CATEGORIES.EQUIPMENT]: 'Equipment',
  [AXE_SERVICE_CATEGORIES.PROGRESSION]: 'Progression',
  [AXE_SERVICE_CATEGORIES.APPEARANCE]: 'Appearance',
};

const INVENTORY_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'weapon', label: 'Weapons' },
  { id: 'armor', label: 'Armor' },
  { id: 'accessory', label: 'Accessories' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'auxiliary', label: 'Auxiliary' },
];

const ARMOR_SLOTS = new Set(['helm', 'chest', 'gloves', 'legs', 'boots']);
const ACCESSORY_SLOTS = new Set(['ring', 'necklace', 'accessory', 'trinket']);
const PRESTIGE_SLOTS = new Set(['cape', 'wings', 'costume']);

function matchesInventoryFilter(item, filterId) {
  if (filterId === 'all') return true;
  if (filterId === 'weapon') return item.slot === 'weapon' || item.category === 'weapon';
  if (filterId === 'armor') return ARMOR_SLOTS.has(item.slot || item.category);
  if (filterId === 'accessory') return ACCESSORY_SLOTS.has(item.slot || item.category);
  if (filterId === 'prestige') return PRESTIGE_SLOTS.has(item.slot || item.category);
  if (filterId === 'auxiliary') return item.slot === 'auxiliary' || item.category === 'auxiliary';
  return true;
}

function describeResult(result) {
  if (!result) return '';
  if (result.ok) {
    if (result.outcome) return `Success — ${String(result.outcome).replaceAll('_', ' ')}`;
    return 'Transaction completed.';
  }
  return `Not completed — ${String(result.reason || result.outcome || 'unknown result').replaceAll('_', ' ')}`;
}

function rarityClass(rarity) {
  switch (String(rarity || '').toLowerCase()) {
    case 'heroic': return 'text-rose-200';
    case 'legendary': return 'text-amber-200';
    case 'elite':
    case 'epic': return 'text-violet-200';
    case 'rare': return 'text-sky-200';
    case 'uncommon': return 'text-emerald-200';
    default: return 'text-white/60';
  }
}

function InventoryItemCard({ item, selected, onClick }) {
  const reinforcement = getItemReinforcement(item.instanceId);
  const enchantments = getItemEnchantments(item.instanceId);
  const totalEnchant = enchantments.reduce((sum, value) => sum + Number(value || 0), 0);

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border p-3 text-left transition ${
        selected
          ? 'border-white/30 bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.14)]'
          : 'border-white/8 bg-black/[0.10] hover:border-white/18 hover:bg-white/[0.06]'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]">
          {item.slot === 'weapon' ? (
            <Swords className="h-4 w-4 text-white/55" />
          ) : item.slot === 'ring' || item.slot === 'necklace' ? (
            <Gem className="h-4 w-4 text-white/55" />
          ) : (
            <Shield className="h-4 w-4 text-white/55" />
          )}
          {item.equipped && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-emerald-200/30 bg-emerald-300/15">
              <Check className="h-2.5 w-2.5 text-emerald-100" />
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold text-white/85">{item.name}</div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] uppercase tracking-wider">
            <span className={rarityClass(item.rarity)}>{item.rarity || 'common'}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/35">{item.slot || item.category}</span>
            {item.locked && <Lock className="h-2.5 w-2.5 text-amber-200/70" />}
          </div>
          <div className="mt-1 text-[9px] text-white/35">
            Reinforce {reinforcement.percent || 0}% · Enchant +{totalEnchant}
          </div>
        </div>

        <ChevronRight className="mt-2 h-3.5 w-3.5 text-white/20" />
      </div>
    </button>
  );
}

function MaterialPill({ id, need = null }) {
  const have = getLootItemCount(id);
  const ok = need == null || have >= need;
  return (
    <span className={`rounded-md border px-2 py-1 text-[9px] ${
      ok
        ? 'border-white/10 bg-white/[0.04] text-white/55'
        : 'border-rose-300/20 bg-rose-300/[0.04] text-rose-200/75'
    }`}>
      {id.replaceAll('_', ' ')}: <b>{have}{need != null ? `/${need}` : ''}</b>
    </span>
  );
}

function EquipmentServicePanel({ serviceId }) {
  const [inventoryState, setInventoryState] = useState(() => ({
    items: getAllAXEEquipmentItems(),
  }));
  const [lootState, setLootState] = useState(() => getLootInventory());
  const [selectedId, setSelectedId] = useState(() => getAllAXEEquipmentItems()[0]?.instanceId || '');
  const [filter, setFilter] = useState('all');
  const [donorId, setDonorId] = useState('');
  const [selectedGemId, setSelectedGemId] = useState('');
  const [lastResult, setLastResult] = useState(null);
  const [, setBackendVersion] = useState(0);

  useEffect(() => subscribeAXEEquipmentInventory((snapshot) => {
    setInventoryState(snapshot);
    setBackendVersion((v) => v + 1);
  }), []);
  useEffect(() => subscribeLootInventory((snapshot) => {
    setLootState(snapshot);
    setBackendVersion((v) => v + 1);
  }), []);
  useEffect(() => subscribeEnchantments(() => setBackendVersion((v) => v + 1)), []);
  useEffect(() => subscribeAXEItemAdvancement(() => setBackendVersion((v) => v + 1)), []);
  useEffect(() => subscribeAXESockets(() => setBackendVersion((v) => v + 1)), []);
  useEffect(() => subscribeAXEAura(() => setBackendVersion((v) => v + 1)), []);

  const items = inventoryState.items || [];

  useEffect(() => {
    if (!items.length) {
      setSelectedId('');
      return;
    }
    if (!items.some((item) => item.instanceId === selectedId)) {
      setSelectedId(items[0].instanceId);
    }
  }, [items, selectedId]);

  useEffect(() => {
    setLastResult(null);
    setDonorId('');
  }, [serviceId, selectedId]);

  const filteredItems = useMemo(
    () => items.filter((item) => matchesInventoryFilter(item, filter)),
    [items, filter],
  );

  const item = items.find((entry) => entry.instanceId === selectedId) || items[0] || null;
  const service = getAXEService(serviceId);

  if (!item) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-white/45">
        No owned equipment exists yet.
      </div>
    );
  }

  const reinforcement = getItemReinforcement(item.instanceId);
  const enchantments = getItemEnchantments(item.instanceId);
  const overEnchant = getItemOverEnchant(item.instanceId);
  const advancement = getAXEAdvancementState(item.instanceId);
  const sockets = getAXESocketState(item.instanceId);
  const aura = getAXEItemAura(item.instanceId);

  const compatibleDonors = items.filter((candidate) =>
    candidate.instanceId !== item.instanceId &&
    !candidate.equipped &&
    !candidate.locked &&
    (candidate.templateId || candidate.id) === (item.templateId || item.id) &&
    String(candidate.rarity || '').toLowerCase() === String(item.rarity || '').toLowerCase()
  );
  const donor = compatibleDonors.find((candidate) => candidate.instanceId === donorId) || null;

  const ownedGems = (lootState.gem || [])
    .map((lootItem) => AXE_GEM_DEFINITIONS[lootItem.id])
    .filter(Boolean);
  const uniqueOwnedGems = [...new Map(ownedGems.map((gem) => [gem.id, gem])).values()];
  const selectedGem = AXE_GEM_DEFINITIONS[selectedGemId] || uniqueOwnedGems[0] || null;

  const openSocketIndexes = (sockets.sockets || [])
    .map((socket, index) => ({ socket, index }))
    .filter(({ socket }) => socket?.open && !socket?.gemId);

  const execute = async (transactionServiceId, payload = {}) => {
    const result = await executeAXEServiceTransaction(transactionServiceId, {
      itemId: item.instanceId,
      item,
      ...payload,
    });
    setLastResult(result);
    return result;
  };

  const serviceCost = getAXEServiceInventoryCost(serviceId, {
    advancement,
    sockets,
  });

  const showInventory = service?.kind === 'equipment_action';

  return (
    <div className="grid h-full min-h-0 grid-cols-[minmax(250px,31%)_1fr] overflow-hidden text-white">
      {/* Real inventory browser */}
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-black/[0.10] p-4">
        <div className="flex items-center gap-2">
          <Backpack className="h-4 w-4 text-white/55" />
          <div>
            <div className="text-[9px] uppercase tracking-[0.30em] text-white/35">Owned Equipment</div>
            <div className="text-sm font-semibold text-white/80">{items.length} Items</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {INVENTORY_FILTERS.map((entry) => (
            <button
              key={entry.id}
              onClick={() => setFilter(entry.id)}
              className={`rounded-md border px-2 py-1 text-[9px] uppercase tracking-wider ${
                filter === entry.id
                  ? 'border-white/25 bg-white/[0.10] text-white'
                  : 'border-white/8 bg-white/[0.025] text-white/35 hover:text-white/60'
              }`}
            >
              {entry.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-2">
          {filteredItems.map((entry) => (
            <InventoryItemCard
              key={entry.instanceId}
              item={entry}
              selected={entry.instanceId === item.instanceId}
              onClick={() => setSelectedId(entry.instanceId)}
            />
          ))}
        </div>
      </aside>

      {/* Service action workspace */}
      <section className="min-h-0 overflow-y-auto p-5">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-3 border-b border-white/10 pb-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[9px] uppercase tracking-[0.34em] text-white/35">
                Services · {service?.label || serviceId}
              </div>
              <h2 className="mt-1 text-2xl font-semibold text-white/90">{item.name}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/40">
                <span>{item.slot || item.category}</span>
                <span>·</span>
                <span className={rarityClass(item.rarity)}>{item.rarity}</span>
                {item.equipped && <span className="text-emerald-200/70">Equipped</span>}
                {item.locked && <span className="text-amber-200/70">Locked</span>}
              </div>
            </div>
            <div className="text-right text-[10px] text-white/35">
              Instance<br/>
              <span className="font-mono text-white/55">{item.instanceId}</span>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
            <Stat label="Reinforcement" value={`${reinforcement.percent || 0}%`} />
            <Stat label="Enchant" value={`+${enchantments.reduce((s, v) => s + Number(v || 0), 0)}`} />
            <Stat label="Over-Enchant" value={`+${overEnchant.level || 0}`} />
            <Stat label="Stage" value={advancement.stage?.label || 'Base'} />
            <Stat label="Refine" value={`+${advancement.refine?.level || 0}`} />
            <Stat label="Ultimate" value={`+${advancement.ultimate?.level || 0}`} />
            <Stat label="Sockets" value={`${sockets.sockets?.length || 0}/${sockets.maxSockets || 0}`} />
            <Stat label="Aura" value={aura ? `Tier ${aura.tierRank || 1}` : 'None'} />
          </div>

          {/* Real resource inventory */}
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <div className="text-[9px] uppercase tracking-[0.25em] text-white/35">Inventory Resources</div>
              <div className="text-[9px] text-white/25">Consumed directly from Materials / Gems inventory</div>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(getMaterials()).map(([id, value]) => (
                <span key={id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1 text-[9px] text-white/55">
                  {id.replaceAll('_', ' ')}: <b className="text-white/80">{value}</b>
                </span>
              ))}
              {Object.keys(serviceCost).map((id) => (
                <MaterialPill key={`cost-${id}`} id={id} need={serviceCost[id]} />
              ))}
            </div>
          </div>

          {lastResult && (
            <div className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
              lastResult.ok
                ? 'border-emerald-300/15 bg-emerald-300/[0.04] text-emerald-100/80'
                : 'border-rose-300/15 bg-rose-300/[0.04] text-rose-100/80'
            }`}>
              {describeResult(lastResult)}
            </div>
          )}

          <div className="mt-5">
            {serviceId === 'reinforcement' && (
              <ActionGrid>
                <Action label="Reinforce Item" onClick={() => execute('reinforcement')} />
                <Action label="Protected Reinforcement" onClick={() => execute('reinforcement', { options: { protectedAttempt: true } })} />
              </ActionGrid>
            )}

            {serviceId === 'enchant' && (
              <div>
                <div className="mb-3 text-[10px] uppercase tracking-[0.28em] text-white/35">
                  Enchantment Slots
                </div>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                  {enchantments.map((level, index) => {
                    const cost = getCostForNextLevel(level);
                    return (
                      <button
                        key={index}
                        onClick={() => execute('enchant', { slotIndex: index })}
                        className="rounded-xl border border-white/12 bg-white/[0.04] p-4 text-left transition hover:bg-white/[0.08]"
                      >
                        <div className="text-[9px] uppercase tracking-[0.25em] text-white/30">Slot {index + 1}</div>
                        <div className="mt-1 text-xl font-semibold text-white/85">+{level}</div>
                        <div className="mt-3 space-y-1 text-[9px] text-white/35">
                          {Object.entries(cost).map(([id, need]) => (
                            <div key={id} className="flex justify-between gap-2">
                              <span>{id.replaceAll('_', ' ')}</span>
                              <span className={getLootItemCount(id) >= need ? 'text-emerald-200/65' : 'text-rose-200/70'}>
                                {getLootItemCount(id)}/{need}
                              </span>
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {serviceId === 'over_enchant' && (
              <ActionGrid>
                <Action label="Over-Enchant Item" onClick={() => execute('over_enchant')} />
                <Action label="Protected Over-Enchant" onClick={() => execute('over_enchant', { options: { protectedAttempt: true } })} />
              </ActionGrid>
            )}

            {serviceId === 'combine' && (
              <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <div className="text-[9px] uppercase tracking-[0.28em] text-white/35">Matching Donor Item</div>
                {compatibleDonors.length ? (
                  <>
                    <select
                      value={donorId}
                      onChange={(event) => setDonorId(event.target.value)}
                      className="mt-3 w-full rounded-lg border border-white/10 bg-neutral-900/90 px-3 py-2 text-sm text-white"
                    >
                      <option value="">Choose a donor from inventory</option>
                      {compatibleDonors.map((candidate) => (
                        <option key={candidate.instanceId} value={candidate.instanceId}>
                          {candidate.name} · {candidate.rarity}
                        </option>
                      ))}
                    </select>
                    <Action
                      className="mt-3"
                      label={donor ? `Combine and consume ${donor.name}` : 'Select a donor first'}
                      disabled={!donor}
                      onClick={() => execute('combine', { donorId: donor.instanceId, donor })}
                    />
                  </>
                ) : (
                  <div className="mt-3 text-sm text-white/40">
                    No unequipped, unlocked matching duplicate is owned. Combine requires a real matching donor item.
                  </div>
                )}
              </div>
            )}

            {serviceId === 'stage' && (
              <ActionGrid>
                <Action label="Advance Item Stage" onClick={() => execute('stage')} />
              </ActionGrid>
            )}

            {serviceId === 'refine' && (
              <ActionGrid>
                <Action label="Refine Item" onClick={() => execute('refine')} />
                <Action label="Protected Refine" onClick={() => execute('refine', { options: { protectedAttempt: true } })} />
              </ActionGrid>
            )}

            {serviceId === 'ultimate' && (
              <ActionGrid>
                <Action label="Ultimate Reinforcement" onClick={() => execute('ultimate')} />
                <Action label="Protected Ultimate" onClick={() => execute('ultimate', { options: { protectedAttempt: true } })} />
              </ActionGrid>
            )}

            {serviceId === 'sockets' && (
              <div className="space-y-4">
                <ActionGrid>
                  <Action label="Drill New Socket" onClick={() => execute('sockets')} />
                  <Action label="Protected Drill" onClick={() => execute('sockets', { options: { protectedAttempt: true } })} />
                </ActionGrid>

                <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
                  <div className="text-[9px] uppercase tracking-[0.28em] text-white/35">Insert Owned Gem</div>
                  <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
                    <select
                      value={selectedGem?.id || ''}
                      onChange={(event) => setSelectedGemId(event.target.value)}
                      className="rounded-lg border border-white/10 bg-neutral-900/90 px-3 py-2 text-sm text-white"
                    >
                      {uniqueOwnedGems.length === 0 && <option value="">No owned gems</option>}
                      {uniqueOwnedGems.map((gem) => (
                        <option key={gem.id} value={gem.id}>
                          {gem.name} · owned {getLootItemCount(gem.id, 'gem')}
                        </option>
                      ))}
                    </select>
                    <Action
                      label={openSocketIndexes.length && selectedGem ? 'Insert Gem' : 'Need open socket + owned gem'}
                      disabled={!openSocketIndexes.length || !selectedGem}
                      onClick={() => execute('insert_gem', {
                        socketIndex: openSocketIndexes[0]?.index,
                        gemId: selectedGem?.id,
                      })}
                    />
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
                    {Array.from({ length: sockets.maxSockets || 4 }).map((_, index) => {
                      const socket = sockets.sockets?.[index];
                      return (
                        <div key={index} className="rounded-lg border border-white/10 bg-black/[0.10] px-3 py-2 text-xs">
                          <div className="text-[9px] uppercase tracking-wider text-white/30">Socket {index + 1}</div>
                          <div className="mt-1 text-white/65">
                            {!socket ? 'Closed' : socket.gemId ? AXE_GEM_DEFINITIONS[socket.gemId]?.name || socket.gemId : 'Open'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {serviceId === 'equipment_aura' && (
              <ActionGrid>
                <Action label={aura ? 'Reroll Equipment Aura' : 'Apply Equipment Aura'} onClick={() => execute('equipment_aura')} />
              </ActionGrid>
            )}
          </div>

          <div className="mt-6 rounded-xl border border-white/8 bg-black/[0.10] p-4 text-xs leading-5 text-white/35">
            This screen operates on the same owned item instances used by the Gear menu and live combat stats. Upgrades, donor consumption, sockets, materials and destruction are backend state changes—not display-only text.
          </div>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <div className="text-[9px] uppercase tracking-widest text-white/30">{label}</div>
      <div className="mt-1 text-sm font-semibold text-white/80">{value}</div>
    </div>
  );
}

function ActionGrid({ children }) {
  return <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{children}</div>;
}

function Action({ label, onClick, disabled = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${className} rounded-xl border border-white/15 bg-white/[0.06] px-4 py-3 text-left text-sm font-semibold text-white transition hover:bg-white/[0.10] disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {label}
    </button>
  );
}

export default function AXEGlobalServicesMenu({
  isOpen = true,
  onClose,
  requestedService = null,
  embedded = false,
}) {
  const [activeServiceId, setActiveServiceId] = useState(() =>
    normalizeAXEServiceRequest(requestedService || 'reinforcement')
  );

  useEffect(() => {
    if (requestedService) setActiveServiceId(normalizeAXEServiceRequest(requestedService));
  }, [requestedService]);

  if (!embedded && !isOpen) return null;

  const active = getAXEService(activeServiceId) || AXE_SERVICE_REGISTRY[0];
  const ProgressionPanel = PROGRESSION_PANELS[active.id] || null;

  return (
    <div className={embedded ? 'h-full w-full' : 'fixed inset-0 z-[190] bg-black/75 p-4 backdrop-blur-md'}>
      <div
        className={embedded
          ? 'relative flex h-full w-full overflow-hidden'
          : 'relative mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-[28px] border border-white/10 shadow-2xl'}
        style={{
          background: embedded
            ? 'linear-gradient(105deg, rgba(99,103,110,0.24) 0%, rgba(48,52,59,0.16) 38%, rgba(15,18,23,0.08) 100%)'
            : 'linear-gradient(105deg, rgba(82,86,93,0.88) 0%, rgba(42,46,53,0.92) 44%, rgba(14,17,22,0.96) 100%)',
          backdropFilter: 'blur(26px) saturate(120%)',
          WebkitBackdropFilter: 'blur(26px) saturate(120%)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-80"
          style={{
            background:
              'radial-gradient(circle at 13% 18%, rgba(255,255,255,0.16), transparent 16%), radial-gradient(circle at 70% 10%, rgba(255,255,255,0.10), transparent 13%), radial-gradient(circle at 88% 72%, rgba(255,255,255,0.07), transparent 18%)',
          }}
        />

        <aside className="relative z-10 w-[230px] shrink-0 overflow-y-auto border-r border-white/10 bg-black/[0.10] p-4 backdrop-blur-xl">
          <div className="px-2 pb-4">
            <div className="text-[9px] uppercase tracking-[0.35em] text-white/45">Character Hub</div>
            <div className="mt-1 text-xl font-semibold text-white">Services</div>
            <div className="mt-1 text-xs leading-5 text-white/35">
              Inventory-backed equipment and progression services.
            </div>
          </div>

          {Object.values(AXE_SERVICE_CATEGORIES).map((category) => (
            <div key={category} className="mb-5">
              <div className="px-2 pb-2 text-[9px] uppercase tracking-[0.24em] text-white/25">
                {CATEGORY_LABELS[category]}
              </div>
              <div className="space-y-1">
                {AXE_SERVICE_REGISTRY.filter((entry) => entry.category === category).map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => setActiveServiceId(entry.id)}
                    className={`w-full rounded-xl px-3 py-2 text-left text-xs transition ${
                      active.id === entry.id
                        ? 'bg-white/[0.12] text-white ring-1 ring-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                        : 'text-white/50 hover:bg-white/[0.06] hover:text-white/80'
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="relative z-10 min-w-0 flex-1">
          {!embedded && (
            <div className="absolute right-4 top-4 z-20">
              <button
                onClick={onClose}
                className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs text-white/65 backdrop-blur-xl hover:bg-white/[0.10] hover:text-white"
              >
                Close
              </button>
            </div>
          )}

          <div className={embedded ? 'h-full' : 'h-full pt-2'}>
            {active.kind === 'equipment_action' && (
              <EquipmentServicePanel serviceId={active.id} />
            )}
            {active.kind === 'progression_panel' && ProgressionPanel && (
              <div className="h-full pt-6">
                <ProgressionPanel />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
