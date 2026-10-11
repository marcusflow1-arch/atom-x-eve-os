# Jedi Outcast Expanded Remaster: systems preproduction brief (draft)

> **Status:** First-pass design by ChatGPT as project manager. **Not approved, not implemented, and not a statement about original game mechanics.** The original Jedi Outcast combat/missions remain authoritative. KOTOR II and Outlaws supply reference *design patterns*, not source code/assets or statistical values.

## 1. Product goal

Modernize Jedi Outcast's presentation, enemies, and narrative interactivity while preserving Kyle Katarn's fast, lethal real-time combat, original story, mission sequence, control identity, lightsaber Fast/Medium/Strong combat, and core Force progression.

Maintain a short feedback loop: explore -> discover actionable story/equipment opportunity -> choose approach (stealth, tactics, battle) -> earn useful progression -> resume main narrative. New quests must serve an existing map and Kyle's purpose there. Do not require grind.

### Existing technical baseline
- Game 2's browser runtime is custom WebGL2 plus in-house actor/saber/Force/AI code.
- `three` and `@react-three/fiber` are already declared dependencies; a Three.js presentation layer may use WebGL2.
- Underlying game rules should be engine-neutral; changes in presentation must not change damage authority, Force simulation or multiplayer replication.
- Early missions Kejim/Artus take place before Kyle reclaims his saber/Force; **do not award usable Force abilities before the original story does**.

## 2. Gameplay invariants

1. Normal lightsaber hits remain meaningfully dangerous; no health inflation or arbitrary item-score gates that transform encounters into damage sponges.
2. Fast/Medium/Strong saber styles remain available on original terms with their directional and movement-driven attacks.
3. Force abilities unlock by story; new XP nodes upgrade **already available** abilities without overriding original gameplay timing or Force rules.
4. Avoid mid-action inventory/menu pauses that disrupt the real-time combat loop; loadout changes belong at natural safe moments or approved quick select.
5. Original story outcomes and named-character availability stay intact; moral choices affect optional content and tactical expression unless a deliberate story rewrite is approved.
6. Every design passes both single-player and multiplayer compatibility review, including save versioning and server/peer trust where applicable.

## 3. XP/level-up framework (proposal)

**XP sources:** original story completion, lore-compatible side investigations, rescue/sabotage/stealth routes, and genuine exploration discoveries. Do not repeatedly award XP for easily farmed identical actions.

**Player level:** light persistent progression beyond mission milestones. Must not grant premature Jedi powers or require overleveling for original objectives.

**Upgrade points:** earn a modest number of spendable points per level, with sensible respec at safe locations if approved. Provide maximum investment caps to preserve combat balance.

**Early-game use:** Kyle can spend modest skill points on non-Force utility (investigation, equipment/slicing, movement awareness). Force branches remain unavailable until their story unlock, with saved points policy documented.

| Branch | Character | Example small node (all proposal) | Gate |
|---|---|---|---|
| Universal / Neutral | Mobility, awareness, precision | Slightly more efficient Push, limited Sense utility, small air-control improvement | Underlying power already unlocked |
| Light | Restraint, defense, recovery | Shorter Protect activation or improved parry-to-evade follow-up | Relevant story unlock and alignment condition, if approved |
| Dark | Aggressive control, risk/reward | Limited Grip interruption or riskier short Rush/attack follow-up | Relevant story unlock and alignment condition, if approved |

**Combo philosophy:** modest situational links instead of brand-new overpowering spell chains. Example research proposals: Pull -> fast repositioning saber strike; Push -> brief gap-opening movement; Force Speed -> evasive attack. Node effect should adjust windows/opportunity and use existing Force budget, not replace core attack speeds or freely stun-lock bosses. Exact timing and energy costs are TBD by benchmark, not Gemini quotations.

**Alignment:** choices can change side-quest outcomes, dialogue reactions, and optional branch preferences. They should not rewrite Kyle into a wholly different character or bar original required campaign completion. Avoid hard locks without a demonstrated safe fallback.

## 4. Three-piece wearable equipment concept (proposal)

Compatible slots: **outerwear/armor**, **utility belt**, **legwear/boots** (final names and visible appearance require art approval).

Each item has a passive and possibly one or two modification sockets governed by clear categories (defense/utility/stealth). Three matching thematic pieces can grant a **distinct set perk**. Two-piece effects, if introduced, should be smaller and optional; no hidden stacking that outpaces the single-player encounter balance.

Illustrative **remaster-original**, not Outlaws/KOTOR II items:
- **Reconnaissance set:** reduced sound propagation or slower enemy suspicion buildup; three-piece perk provides an occasional brief enemy-last-known-position clue after scouting.
- **Field Survival set:** modest consumable efficiency; three-piece perk assists recovery from environmental hazards rather than reducing saber lethality.
- **Technician set:** easier terminal investigation/salvaging; three-piece perk reveals a secondary door or cache route in compatible levels.

Keep Kyle's default look. Gear silhouettes/appearance changes should be optional or subdued, and special disguises only where lore/narrative justify them.

### Modification economy
Use recovered components, technicians, mission discoveries and workbenches at natural narrative stops, inspired by KOTOR II modular crafting and Outlaws specialists. No arbitrary collection grind. Separate rarity from story prerequisites and avoid infinitely repeatable salvage exploits.

## 5. Lightsaber and ranged weapon upgrades (proposal)

**Lightsaber workbench categories:** appearance/color crystal; emitter; lens; energy cell. Cosmetic color/hilt is independent from combat damage. The original actual saber contact system still determines hit outcome. Utility upgrades can influence specialized interactions (e.g., deflection consistency or Force efficiency) but should not make every saber swing a multi-hit damage multiplier.

**Blaster upgrades:** retain the existing Jedi Outcast arsenal. Give some existing weapons limited optional mods (stability, heat/cooldown only where that weapon actually uses it, ion/droid interaction, tactical optics) rather than replacing them with Kay Vess's blaster-module switching.

**Content restrictions:** original game weapon timing, specials, and scripted encounters must be benchmarked before modifying a stat. No copy of any KOTOR II or Outlaws proprietary asset/data table. Research numerics (alignment formula/crystal stats) remain quarantined until evidence validated.

## 6. Narrative/stealth integration

**Stealth:** awareness stages (idle -> suspicious -> investigating last known -> alerted/searching -> stand down) should be supported by *actual sight/hearing and faction communication*, not omniscient tracking. Failure ordinarily transitions to combat instead of arbitrary reload unless required by an original scripted objective.

**Kejim:** prior to Force restoration, Kyle could investigate secondary lab records or rescue a detainee while gathering the already-required mission intelligence. This is **creative proposed optional material**, not an original mission claim.

**Nar Shaddaa:** NPC dialogue, cantina/vender encounters, smuggling evidence, interior traversal and local rewards are possibilities. Preserve Reelo/Lando main story beats and Kyle's existing purpose.

**Bespin:** Wing Guard aid or alternative building routes may fit, subject to verified Legends location details and mission trigger audit.

**Companions:** Jan and other established characters may respond to mission decisions when they are actually present or can communicate. No forced KOTOR-style party requirement or retroactive plot insertion that contradicts the original.

## 7. Engineering contracts for Claude

### Separately planned data definitions
- `SkillNode`: id, underlyingOriginalPower, category, prerequisites, cost, tier, modifiers, comboWindow, unlockFlag, version.
- `EquipmentItem`: id, slot, tags, baseEffect, modificationSockets, appearanceRef, progressionGate, version.
- `EquipmentSet`: setId, matchingItemIds or tags, thresholds, effectId, stackingRules.
- `QuestActivity`: missionId, state, triggerDependencies, optionalOutcome, rewards, loreEvidenceClass.
- `SaveExtension`: schemaVersion, xp, level, points, purchases, inventory, questState, alignmentProjection.

These are **illustrative schema fields**. Do not code before validating against the existing Game 2 architecture and reviewing multiplayer/persistence impact.

### Validation gates
1. Baseline saber combat/Force timings documented and compared before and after all changes.
2. Early missions cannot use locked Force abilities.
3. Skill/equipment builds do not trivialize standard or boss duels.
4. XP is not farmable through repeated reloads or duplicated event dispatch.
5. Story objectives, original mission triggers, cutscene/escort exceptions and character availability remain correct.
6. No renderer migration blocks existing gameplay or changes logical attack endpoints.
7. All work goes to separate PRs with tests and owner approval.

## 8. Who acts now

- **ChatGPT PM:** tracks issues, reviews design/research credibility, audits source, maintains this brief and QA expectations when asked. No false claim of direct Claude access.
- **Claude combat engineer:** take [#36](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/36), reproduce issues and ship first verified combat PR.
- **Claude/Aura animation:** [#37](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/37).
- **Claude rendering engineer:** [#38](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/38), isolated benchmark.
- **Claude systems designers:** refine [#39](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/39) and [#40](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/40) against this draft, then seek explicit design approval.
- **Lore/QA:** [#41](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/41), [#42](https://github.com/marcusflow1-arch/atom-x-eve-os/issues/42).

**Approval needed before any of the proposed progression/gear mechanics become production game rules.**
