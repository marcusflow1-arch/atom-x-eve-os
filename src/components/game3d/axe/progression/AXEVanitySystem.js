// AXE Vanity System — custom appearance pieces worn OVER combat equipment.
// USER-REQUIRED mechanic: vanity pieces can be empowered with a Silver Card
// or Gold Card. Empowering a piece permanently activates a +10% bonus to the
// piece's mapped stat while that vanity piece is equipped.
//
// Historical TwelveSky2 references verify a vanity/ornamental gear system where
// Silver Scrolls empowered Head/Torso/Pelvis/Leggings with Spirit/Health/
// Defense/Damage respectively. AXE keeps that four-piece identity, while the
// Silver/Gold Card catalyst names and +10% activation are the user's locked
// remaster requirement.

export const AXE_VANITY_ACTIVATION_PERCENT = 10;

export const AXE_VANITY_CARD_TYPES = Object.freeze({
  silver: Object.freeze({
    id: 'silver',
    itemId: 'AXE_VanityCard_Silver',
    label: 'Silver Card',
    activationPercent: AXE_VANITY_ACTIVATION_PERCENT,
  }),
  gold: Object.freeze({
    id: 'gold',
    itemId: 'AXE_VanityCard_Gold',
    label: 'Gold Card',
    activationPercent: AXE_VANITY_ACTIVATION_PERCENT,
  }),
});

export const AXE_VANITY_SLOTS = Object.freeze({
  head: Object.freeze({
    id: 'head',
    label: 'Vanity Head',
    equipmentSlot: 'vanity_head',
    mappedStat: 'spirit',
    mappedStatLabel: 'Spirit',
  }),
  torso: Object.freeze({
    id: 'torso',
    label: 'Vanity Torso',
    equipmentSlot: 'vanity_torso',
    mappedStat: 'hp',
    mappedStatLabel: 'HP',
  }),
  pelvis: Object.freeze({
    id: 'pelvis',
    label: 'Vanity Pelvis',
    equipmentSlot: 'vanity_pelvis',
    mappedStat: 'defense',
    mappedStatLabel: 'Defense',
  }),
  leggings: Object.freeze({
    id: 'leggings',
    label: 'Vanity Leggings',
    equipmentSlot: 'vanity_leggings',
    mappedStat: 'damage',
    mappedStatLabel: 'Damage',
  }),
});

export const AXE_VANITY_PIECES = Object.freeze({
  axe_vanity_wanderer_head: Object.freeze({
    id: 'axe_vanity_wanderer_head',
    name: 'Wanderer Mask',
    setId: 'axe_vanity_wanderer',
    slot: 'head',
    rarity: 'rare',
    appearanceAssetId: 'axe_vanity_wanderer_head',
    baseBonus: Object.freeze({ spirit: 2 }),
  }),
  axe_vanity_wanderer_torso: Object.freeze({
    id: 'axe_vanity_wanderer_torso',
    name: 'Wanderer Battle Coat',
    setId: 'axe_vanity_wanderer',
    slot: 'torso',
    rarity: 'rare',
    appearanceAssetId: 'axe_vanity_wanderer_torso',
    baseBonus: Object.freeze({ hp: 50 }),
  }),
  axe_vanity_wanderer_pelvis: Object.freeze({
    id: 'axe_vanity_wanderer_pelvis',
    name: 'Wanderer Waistguard',
    setId: 'axe_vanity_wanderer',
    slot: 'pelvis',
    rarity: 'rare',
    appearanceAssetId: 'axe_vanity_wanderer_pelvis',
    baseBonus: Object.freeze({ defense: 8 }),
  }),
  axe_vanity_wanderer_leggings: Object.freeze({
    id: 'axe_vanity_wanderer_leggings',
    name: 'Wanderer Leggings',
    setId: 'axe_vanity_wanderer',
    slot: 'leggings',
    rarity: 'rare',
    appearanceAssetId: 'axe_vanity_wanderer_leggings',
    baseBonus: Object.freeze({ damage: 5 }),
  }),
});

export function getAXEVanityPiece(pieceId) {
  return AXE_VANITY_PIECES[pieceId] || null;
}

export function getAXEVanitySlot(slotId) {
  return AXE_VANITY_SLOTS[slotId] || null;
}

export function getAXEVanityCard(cardType) {
  return AXE_VANITY_CARD_TYPES[cardType] || null;
}

export function collectAXEVanityBaseBonuses(equippedBySlot = {}) {
  const attr = {
    strength: 0,
    dexterity: 0,
    constitution: 0,
    focus: 0,
    spirit: 0,
  };
  const flat = {
    hp: 0,
    chi: 0,
    damage: 0,
    defense: 0,
    critChance: 0,
    critDamage: 0,
    criticalDefense: 0,
    attributionAttack: 0,
    attributionDefense: 0,
  };

  for (const [slotId, pieceId] of Object.entries(equippedBySlot || {})) {
    const piece = getAXEVanityPiece(pieceId);
    if (!piece || piece.slot !== slotId) continue;
    for (const [key, value] of Object.entries(piece.baseBonus || {})) {
      const numeric = Number(value || 0);
      if (!numeric) continue;
      if (key in attr) attr[key] += numeric;
      else if (key in flat) flat[key] += numeric;
    }
  }
  return { attr, flat };
}

export function collectAXEVanityActivationProfile(equippedBySlot = {}, activationByPieceId = {}) {
  const profile = {
    spiritPct: 0,
    hpPct: 0,
    defensePct: 0,
    damagePct: 0,
    activePieces: [],
  };

  for (const [slotId, pieceId] of Object.entries(equippedBySlot || {})) {
    const piece = getAXEVanityPiece(pieceId);
    const activation = activationByPieceId?.[pieceId];
    const slot = getAXEVanitySlot(slotId);
    if (!piece || !slot || !activation?.active) continue;

    const pct = Math.max(0, Number(activation.percent || AXE_VANITY_ACTIVATION_PERCENT));
    if (slot.mappedStat === 'spirit') profile.spiritPct += pct;
    if (slot.mappedStat === 'hp') profile.hpPct += pct;
    if (slot.mappedStat === 'defense') profile.defensePct += pct;
    if (slot.mappedStat === 'damage') profile.damagePct += pct;
    profile.activePieces.push({
      pieceId,
      slotId,
      mappedStat: slot.mappedStat,
      percent: pct,
      cardType: activation.cardType || null,
    });
  }

  return profile;
}

// The Head vanity's +10% Spirit is injected as virtual Spirit/Focus before the
// final derived-stat calculation so Chi and Spirit-based combat scaling update
// naturally instead of being a cosmetic number only.
export function getAXEVanitySpiritVirtualBonus(preliminaryDerived, activationProfile = {}) {
  const spirit = Number(preliminaryDerived?.effective?.spirit || preliminaryDerived?.effective?.focus || 0);
  const pct = Math.max(0, Number(activationProfile.spiritPct || 0));
  return spirit * (pct / 100);
}

// Torso/Pelvis/Leggings activate multiplicative final-stat bonuses.
// Spirit is handled before this call via getAXEVanitySpiritVirtualBonus().
export function applyAXEVanityActivationToDerived(derived, activationProfile = {}) {
  if (!derived) return derived;
  const hpMult = 1 + Math.max(0, Number(activationProfile.hpPct || 0)) / 100;
  const defenseMult = 1 + Math.max(0, Number(activationProfile.defensePct || 0)) / 100;
  const damageMult = 1 + Math.max(0, Number(activationProfile.damagePct || 0)) / 100;

  const damage = Math.max(1, Math.round(Number(derived.damage || derived.totalDamage || 0) * damageMult));
  const physicalDamage = Math.max(1, Math.round(Number(derived.physicalDamage || derived.totalDamage || 0) * damageMult));

  return {
    ...derived,
    maxHP: Math.max(1, Math.round(Number(derived.maxHP || 1) * hpMult)),
    defense: Math.max(0, Number(derived.defense || 0) * defenseMult),
    damage,
    totalDamage: damage,
    physicalDamage,
    vanityActivation: {
      spiritPct: Number(activationProfile.spiritPct || 0),
      hpPct: Number(activationProfile.hpPct || 0),
      defensePct: Number(activationProfile.defensePct || 0),
      damagePct: Number(activationProfile.damagePct || 0),
      activePieces: [...(activationProfile.activePieces || [])],
    },
  };
}

export function getAXEVanityAppearanceLayers(equippedBySlot = {}) {
  return Object.entries(equippedBySlot || {})
    .map(([slotId, pieceId]) => {
      const piece = getAXEVanityPiece(pieceId);
      if (!piece) return null;
      return {
        slotId,
        pieceId,
        appearanceAssetId: piece.appearanceAssetId,
      };
    })
    .filter(Boolean);
}
