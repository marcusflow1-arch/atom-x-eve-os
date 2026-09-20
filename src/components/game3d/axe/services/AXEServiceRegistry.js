// AXE Prompt 038 — Unified Services registry.
// Every remote-access service is declared here so NPC access and the global
// Services menu use the same ids. Transactional services are flagged for
// authoritative execution; the browser runtime can fall back to the existing
// local adapters until the dedicated server path is available.

export const AXE_SERVICE_CATEGORIES = Object.freeze({
  EQUIPMENT: 'equipment',
  PROGRESSION: 'progression',
  APPEARANCE: 'appearance',
});

const service = (entry) => Object.freeze({
  remoteAccessible: true,
  authoritative: true,
  ...entry,
});

export const AXE_SERVICE_REGISTRY = Object.freeze([
  service({ id: 'reinforcement', label: 'Reinforcement', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'enchant', label: 'Enchant', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'over_enchant', label: 'Over-Enchant', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'combine', label: 'Combine', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'stage', label: 'Stage', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'refine', label: 'Refine', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'ultimate', label: 'Ultimate', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'sockets', label: 'Sockets / Gems', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),
  service({ id: 'equipment_aura', label: 'Equipment Aura', category: AXE_SERVICE_CATEGORIES.EQUIPMENT, kind: 'equipment_action' }),

  service({ id: 'halo', label: 'Halo', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'title', label: 'Titles', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'wings', label: 'Wings', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'cape', label: 'Capes', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'core', label: 'Core', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'elixir', label: 'Elixirs', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'pet', label: 'Pets', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),
  service({ id: 'mount', label: 'Mounts', category: AXE_SERVICE_CATEGORIES.PROGRESSION, kind: 'progression_panel' }),

  service({ id: 'vanity', label: 'Vanity', category: AXE_SERVICE_CATEGORIES.APPEARANCE, kind: 'progression_panel' }),
  service({ id: 'costume', label: 'Costumes', category: AXE_SERVICE_CATEGORIES.APPEARANCE, kind: 'progression_panel' }),
]);

export function getAXEService(serviceId) {
  return AXE_SERVICE_REGISTRY.find((entry) => entry.id === serviceId) || null;
}

export function getAXEServicesByCategory(category) {
  return AXE_SERVICE_REGISTRY.filter((entry) => entry.category === category);
}

export function normalizeAXEServiceRequest(serviceId) {
  if (serviceId === 'blacksmith') return 'reinforcement';
  if (serviceId === 'titles') return 'title';
  return getAXEService(serviceId) ? serviceId : 'reinforcement';
}
