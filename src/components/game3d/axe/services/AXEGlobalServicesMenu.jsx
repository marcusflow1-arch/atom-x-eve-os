import React, { useEffect, useMemo, useState } from 'react';
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
import { INVENTORY } from '../../equipment/inventoryData';
import {
  getItemEnchantments,
  getItemOverEnchant,
  getItemReinforcement,
  getMaterials,
} from '../../equipment/enchantmentStore';
import { getAXEAdvancementState } from '../equipment/AXEItemAdvancementStore';
import { getAXESocketState } from '../equipment/AXESocketGemStore';
import { AXE_GEM_DEFINITIONS } from '../equipment/AXESocketGemSystem';
import { getAXEItemAura } from '../equipment/AXEEquipmentAuraStore';
import {
  AXE_SERVICE_CATEGORIES,
  AXE_SERVICE_REGISTRY,
  getAXEService,
  normalizeAXEServiceRequest,
} from './AXEServiceRegistry';
import { executeAXEServiceTransaction } from './AXEServiceTransactionGateway';

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
  [AXE_SERVICE_CATEGORIES.EQUIPMENT]: 'Equipment Services',
  [AXE_SERVICE_CATEGORIES.PROGRESSION]: 'Progression Services',
  [AXE_SERVICE_CATEGORIES.APPEARANCE]: 'Appearance Services',
};

const allItems = () =>
  Object.entries(INVENTORY)
    .flatMap(([category, items]) => (items || []).map((item) => ({
      ...item,
      category,
      instanceId: item.instanceId || item.id,
    })))
    .filter((item) => item.instanceId);

function describeResult(result) {
  if (!result) return '';
  if (result.ok) return result.outcome ? `Success — ${result.outcome}` : 'Transaction completed.';
  return `Not completed — ${result.reason || result.outcome || 'unknown result'}`;
}

function EquipmentServicePanel({ serviceId }) {
  const items = useMemo(() => allItems(), []);
  const [selectedId, setSelectedId] = useState(items[0]?.instanceId || '');
  const [lastResult, setLastResult] = useState(null);
  const [version, setVersion] = useState(0);
  const item = items.find((entry) => entry.instanceId === selectedId) || items[0] || null;

  const refresh = () => setVersion((v) => v + 1);

  useEffect(() => {
    setLastResult(null);
  }, [serviceId, selectedId]);

  if (!item) {
    return <div className="p-8 text-sm text-white/50">No eligible equipment is available.</div>;
  }

  const reinforcement = getItemReinforcement(item.instanceId);
  const enchantments = getItemEnchantments(item.instanceId);
  const overEnchant = getItemOverEnchant(item.instanceId);
  const advancement = getAXEAdvancementState(item.instanceId);
  const sockets = getAXESocketState(item.instanceId);
  const aura = getAXEItemAura(item.instanceId);
  const materials = getMaterials();

  const transact = async (transactionServiceId, payload) => {
    const result = await executeAXEServiceTransaction(transactionServiceId, payload);
    setLastResult(result);
    refresh();
    return result;
  };

  const donor = items.find((candidate) =>
    candidate.instanceId !== item.instanceId &&
    (candidate.slot || candidate.category) === (item.slot || item.category)
  );

  const firstOpenSocket = sockets.sockets?.findIndex((socket) => socket?.open && !socket?.gemId) ?? -1;
  const firstAllowedGem = Object.values(AXE_GEM_DEFINITIONS).find((gem) =>
    !gem.allowedSlots?.length || gem.allowedSlots.includes(item.slot || item.category)
  );

  const service = getAXEService(serviceId);

  return (
    <div className="h-full overflow-y-auto px-6 py-5 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-cyan-200/60">Remote Blacksmith Access</div>
            <h2 className="mt-1 text-2xl font-semibold">{service?.label || serviceId}</h2>
            <p className="mt-1 text-xs text-white/40">
              This global view calls the existing upgrade rules. A mounted authoritative service bridge takes precedence over browser fallback transactions.
            </p>
          </div>
          <select
            value={item.instanceId}
            onChange={(event) => setSelectedId(event.target.value)}
            className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
          >
            {items.map((entry) => (
              <option key={entry.instanceId} value={entry.instanceId}>
                {entry.name} · {entry.slot || entry.category}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Reinforcement" value={`${reinforcement.percent || 0}%`} />
          <Stat label="Enchant" value={enchantments.reduce((sum, v) => sum + Number(v || 0), 0)} />
          <Stat label="Over-Enchant" value={`+${overEnchant.level || 0}`} />
          <Stat label="Stage" value={advancement.stage?.label || 'Base'} />
          <Stat label="Refine" value={`+${advancement.refine?.level || 0}`} />
          <Stat label="Ultimate" value={`+${advancement.ultimate?.level || 0}`} />
          <Stat label="Sockets" value={`${sockets.sockets?.length || 0}/${sockets.maxSockets || 0}`} />
          <Stat label="Aura" value={aura ? `Tier ${aura.tierRank || 1}` : 'None'} />
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.025] p-4">
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/35">Upgrade Materials</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-white/55">
            {Object.entries(materials).map(([id, value]) => (
              <span key={id} className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-1">
                {id.replace('mat_', '').replaceAll('_', ' ')}: <b className="text-white/80">{value}</b>
              </span>
            ))}
          </div>
        </div>

        {lastResult && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70">
            {describeResult(lastResult)}
          </div>
        )}

        <div className="mt-5">
          {serviceId === 'reinforcement' && (
            <ActionGrid>
              <Action label="Reinforce" onClick={() => transact('reinforcement', { itemId: item.instanceId })} />
              <Action label="Protected Reinforce" onClick={() => transact('reinforcement', { itemId: item.instanceId, options: { protectedAttempt: true } })} />
            </ActionGrid>
          )}

          {serviceId === 'enchant' && (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {enchantments.map((level, index) => (
                <Action
                  key={index}
                  label={`Enchant Slot ${index + 1} · +${level}`}
                  onClick={() => transact('enchant', { itemId: item.instanceId, slotIndex: index })}
                />
              ))}
            </div>
          )}

          {serviceId === 'over_enchant' && (
            <ActionGrid>
              <Action label="Over-Enchant" onClick={() => transact('over_enchant', { itemId: item.instanceId })} />
              <Action label="Protected Over-Enchant" onClick={() => transact('over_enchant', { itemId: item.instanceId, options: { protectedAttempt: true } })} />
            </ActionGrid>
          )}

          {serviceId === 'combine' && (
            <ActionGrid>
              <Action
                label={donor ? `Combine with ${donor.name}` : 'No Matching Donor'}
                disabled={!donor}
                onClick={() => transact('combine', { item, donor })}
              />
            </ActionGrid>
          )}

          {serviceId === 'stage' && (
            <ActionGrid>
              <Action label="Advance Stage" onClick={() => transact('stage', { itemId: item.instanceId })} />
            </ActionGrid>
          )}

          {serviceId === 'refine' && (
            <ActionGrid>
              <Action label="Refine" onClick={() => transact('refine', { itemId: item.instanceId })} />
              <Action label="Protected Refine" onClick={() => transact('refine', { itemId: item.instanceId, options: { protectedAttempt: true } })} />
            </ActionGrid>
          )}

          {serviceId === 'ultimate' && (
            <ActionGrid>
              <Action label="Ultimate Reinforcement" onClick={() => transact('ultimate', { item })} />
              <Action label="Protected Ultimate" onClick={() => transact('ultimate', { item, options: { protectedAttempt: true } })} />
            </ActionGrid>
          )}

          {serviceId === 'sockets' && (
            <>
              <ActionGrid>
                <Action label="Drill Socket" onClick={() => transact('sockets', { itemId: item.instanceId, item })} />
                <Action
                  label={firstOpenSocket >= 0 && firstAllowedGem ? `Insert ${firstAllowedGem.name}` : 'Open Socket Needed'}
                  disabled={firstOpenSocket < 0 || !firstAllowedGem}
                  onClick={() => transact('insert_gem', {
                    itemId: item.instanceId,
                    item: { ...item, ...sockets },
                    socketIndex: firstOpenSocket,
                    gemId: firstAllowedGem.id,
                  })}
                />
              </ActionGrid>
              <div className="mt-4 space-y-2 text-xs text-white/55">
                {(sockets.sockets || []).map((socket, index) => (
                  <div key={index} className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2">
                    Socket {index + 1}: {socket.gemId || 'Empty'}
                  </div>
                ))}
              </div>
            </>
          )}

          {serviceId === 'equipment_aura' && (
            <ActionGrid>
              <Action label={aura ? 'Reroll via Equipment Aura Menu' : 'Apply Equipment Aura'} onClick={() => transact('equipment_aura', { item })} />
            </ActionGrid>
          )}
        </div>

        <div className="mt-6 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.025] p-4 text-xs text-white/45">
          Remote access changes where the player opens the service, not its costs, success rates, protection rules, or failure consequences.
        </div>
      </div>
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

function Action({ label, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.055] px-4 py-3 text-left text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.09] disabled:opacity-30"
    >
      {label}
    </button>
  );
}

export default function AXEGlobalServicesMenu({
  isOpen,
  onClose,
  requestedService = null,
}) {
  const [activeServiceId, setActiveServiceId] = useState(() =>
    normalizeAXEServiceRequest(requestedService || 'reinforcement')
  );

  useEffect(() => {
    if (requestedService) setActiveServiceId(normalizeAXEServiceRequest(requestedService));
  }, [requestedService]);

  if (!isOpen) return null;

  const active = getAXEService(activeServiceId) || AXE_SERVICE_REGISTRY[0];
  const ProgressionPanel = PROGRESSION_PANELS[active.id] || null;

  return (
    <div className="fixed inset-0 z-[190] bg-black/75 p-4 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-[1500px] overflow-hidden rounded-3xl border border-white/10 bg-[#071019]/95 shadow-2xl">
        <aside className="w-[260px] shrink-0 overflow-y-auto border-r border-white/10 bg-white/[0.02] p-4">
          <div className="px-2 pb-4">
            <div className="text-[9px] uppercase tracking-[0.35em] text-cyan-200/55">Global Access</div>
            <div className="mt-1 text-xl font-semibold text-white">Services</div>
            <div className="mt-1 text-xs leading-5 text-white/35">
              Blacksmith and progression systems without unnecessary NPC travel.
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
                        ? 'bg-cyan-300/10 text-cyan-100 ring-1 ring-cyan-300/20'
                        : 'text-white/50 hover:bg-white/[0.04] hover:text-white/75'
                    }`}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section className="relative min-w-0 flex-1">
          <div className="absolute right-4 top-4 z-20">
            <button
              onClick={onClose}
              className="rounded-full border border-white/10 bg-black/30 px-4 py-2 text-xs text-white/60 hover:text-white"
            >
              Close
            </button>
          </div>

          <div className="h-full pt-2">
            {active.kind === 'equipment_action' && (
              <EquipmentServicePanel serviceId={active.id} />
            )}
            {active.kind === 'progression_panel' && ProgressionPanel && (
              <div className="h-full pt-10">
                <ProgressionPanel />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
