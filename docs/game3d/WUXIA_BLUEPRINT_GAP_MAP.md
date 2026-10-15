# Wuxia blueprint → Game 3D gap map (TASK-000)

**Target (owner, 2026-10-15):** the Game 3D hero world, `src/pages/GameView.jsx` (the dashboard's **Game** button), not
Game 2 or Game 5. **Art direction:** sumi-e (ink wash).

**Source:** the owner's Twelve Sky 2-inspired blueprint, pasted in chat in two versions that disagree:

- **v1:** 7 rarities, enchant to 200% (Mythical), refinement to Stage 20, head halo +96, wing over-cap 200%, mount share 25% → 39%, cash shop.
- **v2:** enchant capped at 120% (orange glow), refinement to Stage 25, plus CP towers, titles, rebirths, pet tiers, Apex mounts and set bonuses.

This is an inventory of the current source (`origin/main` 362e24ca). It changes no code. "Additive" means it can be built
without touching existing saves or balance. "Migration" changes existing progression and is owner-gated
(`docs/mmorpg-agent-team/WORKBOARD.md`).

## 1. Factions and the Renegade system

| Blueprint | Game 3D today | Status |
|---|---|---|
| Three races: Celestial Order, Shadow Syndicate, Elemental Dominion; themes, stat bias, capitals | `axe/factions/AXEFactionWeaponConfig.js`: three placeholder factions ("Faction 1–3", names deliberately unresolved), capital/realm ids only | Partial (names and identity need D3) |
| Territorial war (Heavenly Stone battles) | `AXEFactionWarSystem.js` / `Store` / `Runtime`: war cycles, invasion maps, tower/shield defenses | Present (different content) |
| Vow of the Renegade (Lv 100+): reputation −10,000 with all three, Outlaw sanctuary, attire override, hostile to all three, neutral to Outlaws, cross-race guilds, third party in wars | Nothing | **Missing**, additive |

## 2. Combat, weapons and stats

| Blueprint | Game 3D today | Status |
|---|---|---|
| Five archetypes: single-hit burst, multi-hit combo, ranged, close-combat melee, defensive | `AXE_WEAPON_ROLES`: offensive / defensive / ranged; mastery families sword, sky, bow, dual blades (`weapons/AXEWeaponIdentity.js`); dual blades are classed **defensive** | Partial / **conflict** (D4) |
| Two assigned secondary weapons on hotkeys, 0 s swap inside the GCD, skill bar and stance follow | `weapons/AXEWeaponQuickSwitch.js` cycles through every owned weapon | Partial, additive |
| Single-hit and multi-hit damage formulas, crit per hit (1.5–2×), flat defense | `axe/combat/AXECombatMath.js`: per-hit pipeline, crit multiplier, crit defense, 75% crit cap | Present (multi-hit = per-tick use) |
| STR 2.8 AP / 2.0 attack rate · VIT 20 HP / 0.9 evade · AGI 1.67 evade / 1.6 def · SPR 15 chi / 1.5 AP | `statsSystem.jsx`: 2.65 / 1.71 · 20 / 0.90 · 1.67 / 1.63 · 15.31 / 1.43 | Present (small numeric differences) |

## 3. Equipment

| Blueprint | Game 3D today | Status |
|---|---|---|
| 7 rarities: Common…Unique, Epic, Legendary, Mythical (+5…+100% base, sockets 1–4) | `axe/loot/AXELootQuality.js`: Common, Uncommon, Rare, Elite, Legendary | **Conflict** (D2, migration) |
| Enchant with 3/6/9/12/15% materials, safe to 54% (v1) or 60% (v2) | `axe/equipment/AXEItemEnhancementSystem.js`: reinforcement to 120%, safe to 40%, protected attempts; named materials (Essence Shard, Spirit Crystal, Reinforcement Stone, Stabilizer) | Partial / conflict (D1) |
| Over-enchant to 200% (v1) | Separate over-enchant ladder, 10 levels | **Conflict** (D1) |
| Glow by enchant: yellow 1–59, blue 60–89, purple 90–119, orange 120 (v2; v1 adds crimson 160–199, white-gold 200) | No enchant-glow tiers found; `AXEEquipmentAuraSystem.js` is a separate random-roll aura | **Missing**, additive (v2 fits the existing 120% cap) |
| Refinement Stage 20 (v1) / 25 (v2) with jades | `AXEItemAdvancementSystem.js`: stages Base–V, refine 15, 12 combines | **Conflict** (D1) |
| Four sets: Ring+Necklace, Armor+Weapon, Armor+Gloves+Boots, Weapon+Boots | `AXESetBonusSystem.js`: named families with rare/elite/heroic grades | Different |
| Sockets; luck stat (Garuda's Prayer) | `AXESocketGemSystem.js`; no luck stat found | Sockets present; luck missing |

## 4. Contribution Points (CP), titles, rebirth

| Blueprint | Game 3D today | Status |
|---|---|---|
| 1 CP per 500 kills; Premium token +1, Crushed Demon Scroll +4 | `progression/contributionStore.jsx`: earn/spend ledger, starts at 10,000 | Partial (no kill rate or modifiers) |
| Towers: Rising Force (CP), Golden Bridge (silver 5–20%), Mindfulness (EXP 25–100%) | War-map defense towers only | **Missing** |
| Titles L1–12 (800 → 10,000 CP) plus Master/High | `progression/titleData.jsx`: 15 levels priced in kills | **Conflict** |
| Rebirth R1–R12 | `AXECharacterProgressionConfig.js`: Rebirth power tier, `rebirthCount` | Partial |

## 5. Halos and wings

| Blueprint | Game 3D today | Status |
|---|---|---|
| Head halo +1…+96: 100 CP + 1M silver per try, +1 all four stats per rank, −1 on failure, Guardian Scroll | `axe/progression/AXEHaloSystem.js` over the existing 0–200 halo: kill currency, success chances, VFX tiers | **Conflict** (D5) |
| Wings over-cap to 200% (Black Feathers, Wing Talismans) | `AXEWingReinforcementSystem.js`: reinforcement to 120% | Conflict (D1) |
| Wing Halo ranks 1–20 (from 120% wings, +1% gear stats per rank) | Nothing | **Missing**, additive |

## 6. Pets

| Blueprint | Game 3D today | Status |
|---|---|---|
| Synthesis 3 → 1 (L1 → M1 → M15 …); growth 101–200% (+50 damage per 25%); named tier tables up to God and Guardian pets | `AXEPetTierSystem.js` (five tiers, fusion recipes, specialties); `AXEPetSystem.js` (level 200, over-enchant 200%) | Partial / different |

## 7. Mounts, absorption and spiritual weapons

| Blueprint | Game 3D today | Status |
|---|---|---|
| Mount Lv 1–50 → 25% base share | `AXEMountSystem.js`: growth 0–100% through XP bands | Different |
| 7 mount gear slots, +2% each when maxed (39% total) | Slice B | **Done** |
| Apex mounts (Mount's Spirit, Fahrenheit Jades); Holy Mount Stone rerolls 11–20% | `AXELegendaryMountSystem.js`: legendary crafting, 4 rolled flat abilities, rerolls | Partial / different |
| Absorption pills (60 / 600 min); armor "core awakening"; clan-coloured energy aura | Slice B (procedural aura; armor plates opening needs gear art) | **Done** |
| Mount soul skills: spectral avatar single hit, 3-hit elemental flurry, AoE up to 10 targets | Slice C (v3 forms; the AoE strikes the nearest enemy, as current AoE skills do) | Done |
| Spiritual weapon from mount EXP (armor-bypassing damage) | `AXEMountSpiritualSystem.js` (PR #82): ranks 1–20, offensive/utility | Present |

## 8. Vanity

| Blueprint | Game 3D today | Status |
|---|---|---|
| Companion/mount vanity, 4 slots (wrap, wing skin, aura trail, nameplate); Silver Card 1–3% / Gold Scroll 4–8% / 5–10% sub-stats | `AXEVanitySystem.js`: player vanity, 4 body slots, card activation +10% mapped stat | Partial (player only, different rolls) |

## 9. Cash shop

| Blueprint | Game 3D today | Status |
|---|---|---|
| Guardian Scroll, Wing Talisman, Premium Token, Absorption Pill, Silver Card / Gold Scroll, tradeable for silver; no gear or CP sales | `shop/shopItems.jsx`: in-game gold shop (potions, materials, companion gear, cosmetics) | **Missing**; real-money purchases are owner-gated (D6) |

## 10. Art style

| Blueprint | Game 3D today | Status |
|---|---|---|
| Sumi-e ink look | No ink or paper shading found in Game 3D. Game 5's systems UI uses a sumi-e palette | **Missing** (rendering work, D7) |

## 11. v3 additions (owner's expanded blueprint, 2026-10-15)

The owner's third version adds the following. v1 governs where versions conflict (owner: 200% over-enchant, Stage 20).

| Blueprint v3 | Game 3D today | Status |
|---|---|---|
| Central buff/state container recalculating on Weapon Switch / Mount Fusion / Ascension / Imbuement events | `playerHUDStore.jsx` already aggregates ~15 bonus providers and recomputes on each one's change event | **Present** (new systems plug in as providers) |
| Weapon Affinity: specialize in one archetype, its passive doubles (2×) | Delivered in slice A (below) | **Done** |
| Taurus Chosen Ascension: Destroyer (1.5× skill damage, shockwaves) / Balanced (0 s swap GCD, +20% stats) / Defensive (30% damage as party shield, 1.5× defense); levitation; Angel Cloak | `AXE_POWER_TIERS` lists an Ascension tier (label only) | **Missing** |
| 5-piece sets: Rare +100%, Elite +110%, Taurus Chosen Word +150% (+25% crit / crit defense, +10 skill points, +50% skill damage) | `AXESetBonusSystem.js` grades rare / elite / heroic | Partial / different |
| Mount energy imbuement 0–120 on armor, weapons and rings; energy flowing in the gaps; feather drops and aura pulse at the maximum | Nothing | **Missing** (needs the gear visual layers) |
| Companion armor over-enchant: 20% passive + 20% in fusion = 40% stat transfer | Companion gear and fusion exist (`equipment/Companion*`, `companionFusionStore.jsx`) | Not compared yet |
| Soul skill transformations: 1 → 2-hit spectral strike, 3 → 5-hit flurry, AoE → double AoE (the second rolls crit independently) | Slice C | **Done** |
| Outfits with static stats and a show/hide hotkey | `AXECostumeStore.js`: costume bonuses and `setAXECostumeHidden` | Present (hotkey not checked) |

## Delivered

- **Slice A, weapons (2026-10-15):** five archetypes beside the existing three roles (`axe/weapons/AXEWeaponArchetypes.js`);
  Weapon Affinity 2× as the final derived-stat stage (`AXEWeaponAffinityStore.js` → `playerHUDStore.jsx`) and in
  movement (`weaponClassCombatHelpers.jsx`); two quick-switch slots on Shift+1 / Shift+2
  (`AXEWeaponQuickSwitchMount.jsx`, mounted in `GameView.jsx`); a Character Hub view, Weapon Mastery →
  Affinity & Quick-Switch (`progression/hub/WeaponAffinityPanel.jsx`). Report:
  [reports/WUXIA-A-weapons.md](reports/WUXIA-A-weapons.md).
- **Slice B, Mount Soul Fusion (2026-10-15):** seven mount gear slots (Stage 0–20, +2% share each when finished),
  combination share 25% → 39%, Absorption Pills (60 / 600 min) on the registered mount, equipment ×(1 + share) while
  absorbed, clan-coloured aura and HUD timer, Mounts → Soul Fusion. Report:
  [reports/WUXIA-B-mount-fusion.md](reports/WUXIA-B-mount-fusion.md).
- **Slice C, mount soul skill transformations (2026-10-15):** while absorbed, single-hit skills gain a spectral strike
  (1 → 2 hits), 3+ hit combos two elemental strikes (3 → 5), AoE skills a second, wider explosion with its own crit
  roll; clan-coloured claw rake / sparks / shockwave. Report: [reports/WUXIA-C-soul-skills.md](reports/WUXIA-C-soul-skills.md).

## Decisions the owner must make

- **D1 (answered 2026-10-15): v1 governs** (200% over-enchant, Stage 20). Game 3D today: 120% enchant, Stage V/refine 15, halo 0–200, so adopting v1 caps is a save migration and needs a backup and rollback plan first.
- **D2:** move items from 5 rarities to the blueprint's 7? This changes existing item data.
- **D3:** replace "Faction 1–3" with Celestial Order / Shadow Syndicate / Elemental Dominion, with their stat bias?
- **D4:** reclassify dual blades from *defensive* to the *multi-hit combo* archetype, and add close-combat and single-hit burst families? This changes current combat roles.
- **D5:** replace the 0–200 kill-currency halo with the +96 CP/silver halo, or keep both?
- **D6:** any real-money shop at all? It needs an economy and security review before any code.
- **D7:** sumi-e for the UI only, or for the 3D world rendering too (a separate rendering branch, benchmarked)?

## Proposed build order

Additive slices first; none of them changes an existing save.

1. **Enchant glow tiers (v2):** the weapon glows by its current reinforcement (yellow, blue, purple, orange) in the world and the gear UI.
2. **Weapon quick-switch slots:** two secondary weapons assigned to hotkeys and swapped instantly, using the existing equip path.
3. **Vow of the Renegade:** Outlaw state, hostility rules, an attire tint and a hub panel (names wait on D3).
4. **Mount soul fusion:** 7 mount gear slots, the combination share, absorption pills (timed state), a clan-coloured aura and the three soul skills.
5. **Wing Halo ranks 1–20** on top of the existing 120% wings.
6. After D1–D7: rarity, caps and halo migrations, CP towers and titles, the shop, and the sumi-e rendering pass.
