import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemo,
  createPlayer,
  migratePlayer,
} from "../../../src/game5/systems/state.mjs";
import { applyCommand } from "../../../src/game5/systems/engine.mjs";
import { statsFor, mountShare } from "../../../src/game5/systems/stats.mjs";
import { damageRoll } from "../../../src/game5/systems/combat.mjs";
const ctx = {
  now: 10000,
  random: () => 0,
  position: { x: 0, z: 0 },
  lineOfSight: () => true,
};
const run = (p, c, context = ctx) => applyCommand(p, c, context).player;
const rejects = (p, c, code) =>
  assert.throws(
    () => run(p, c),
    (e) => e.code === code,
  );
test("player and mount vanity are independent and equipped items cannot be salvaged", () => {
  let p = run(createDemo(), { type: "equip", itemId: "player-vanity-wrap" });
  p = run(p, { type: "equip", itemId: "vanity-wrap" });
  assert.equal(p.vanity.wrap, "player-vanity-wrap");
  assert.equal(p.mount.vanity.wrap, "vanity-wrap");
  rejects(
    p,
    { type: "salvage", itemId: "player-vanity-wrap" },
    "ITEM_PROTECTED",
  );
  p = run(p, { type: "unequip", itemId: "player-vanity-wrap" });
  assert.equal(p.vanity.wrap, null);
  assert.equal(p.mount.vanity.wrap, "vanity-wrap");
});
test("standard, basic and mythical caps are enforced and failed unlocks are atomic", () => {
  let p = createDemo();
  const item = (id) => p.inventory.find((i) => i.id === id);
  rejects(
    p,
    {
      type: "enchant",
      itemId: "chosen-weapon",
      material: "enchant-15",
      protection: "protection",
    },
    "OVERCHARGE_REQUIRED",
  );
  p = run(p, { type: "overcharge", itemId: "chosen-weapon" });
  for (let n = 0; n < 2; n++)
    p = run(p, {
      type: "enchant",
      itemId: "chosen-weapon",
      material: "enchant-15",
      protection: "protection",
    });
  assert.equal(item("chosen-weapon").enchant, 150);
  p = run(p, { type: "overcharge", itemId: "chosen-weapon" });
  for (let n = 0; n < 4; n++)
    p = run(p, {
      type: "enchant",
      itemId: "chosen-weapon",
      material: "enchant-15",
      protection: "celestialProtection",
    });
  assert.equal(item("chosen-weapon").enchant, 200);
  rejects(p, { type: "overcharge", itemId: "chosen-weapon" }, "AT_CAP");
  const before = structuredClone(p);
  rejects(
    p,
    { type: "overcharge", itemId: "starter-weapon" },
    "ENCHANT_CAP_REQUIRED",
  );
  assert.deepEqual(p, before);
});
test("protection is required when crossing 90%, and celestial protection at 160%", () => {
  const p = createDemo(),
    i = p.inventory.find((i) => i.id === "rare-weapon");
  i.enchant = 87;
  rejects(
    p,
    { type: "enchant", itemId: i.id, material: "enchant-3" },
    "PROTECTION_REQUIRED",
  );
  i.enchant = 150;
  i.overcharge = "mythical";
  rejects(
    p,
    {
      type: "enchant",
      itemId: i.id,
      material: "enchant-15",
      protection: "protection",
    },
    "CELESTIAL_PROTECTION_REQUIRED",
  );
});
test("mount feed stores XP without level grinding; share caps at 39%", () => {
  let p = createDemo();
  p.mount.level = 1;
  const xp = p.mount.xp;
  p = run(p, { type: "feedMount" });
  assert.equal(p.mount.level, 1);
  assert.equal(p.mount.xp, xp + 100);
  assert.equal(mountShare(p), 0.25);
  for (const i of p.inventory.filter(
    (i) => i.owner === "mount" && i.kind === "equipment",
  )) {
    i.enchant = 200;
    i.stage = 20;
    p.mount.equipment[i.slot] = i.id;
  }
  assert.equal(mountShare(p), 0.39);
});
test("absorption expires on trusted time and utility trades spiritual damage for agility/crit", () => {
  let p = createDemo();
  p.mount.spiritualRank = 10;
  p = run(p, { type: "absorb", material: "absorption60" });
  const offense = statsFor(p, ctx.now);
  assert.equal(offense.spiritual, 80);
  p = run(p, { type: "spiritualMode", mode: "utility" });
  const utility = statsFor(p, ctx.now);
  assert.equal(utility.spiritual, 0);
  assert.ok(utility.evade > offense.evade);
  assert.ok(utility.critical > offense.critical);
  assert.equal(utility.movementMultiplier, 1.05);
  assert.equal(statsFor(p, p.mount.absorbedUntil).share, 0);
  assert.equal(statsFor(p, p.mount.absorbedUntil).movementMultiplier, 1);
});
test("silver and gold augments use their intended percentage pools", () => {
  let p = run(createDemo(), { type: "equip", itemId: "player-vanity-wrap" });
  p = run(p, { type: "augment", itemId: "player-vanity-wrap" });
  assert.equal(statsFor(p, ctx.now).attackSpeed, 0.01);
  const attack = statsFor(p, ctx.now).attack;
  p = run(p, { type: "reroll", itemId: "player-vanity-wrap", index: 0 });
  assert.equal(statsFor(p, ctx.now).attackSpeed, 0);
  assert.ok(statsFor(p, ctx.now).attack > attack);
  for (let n = 0; n < 2; n++)
    p = run(p, { type: "augment", itemId: "player-vanity-wrap" });
  rejects(
    p,
    { type: "augment", itemId: "player-vanity-wrap" },
    "AUGMENTS_FULL",
  );
});
test("mount vanity augments apply only while absorbed", () => {
  let p = run(createDemo(), { type: "equip", itemId: "vanity-wrap" });
  p = run(p, { type: "augment", itemId: "vanity-wrap" });
  assert.equal(statsFor(p, ctx.now).attackSpeed, 0);
  p = run(p, { type: "absorb", material: "absorption60" });
  assert.equal(statsFor(p, ctx.now).attackSpeed, 0.0025);
});
test("v1 migration preserves resources and infers the necessary existing tier", () => {
  const p = createDemo();
  p.schemaVersion = 1;
  delete p.vanity;
  p.inventory[0].enchant = 180;
  delete p.inventory[0].overcharge;
  const migrated = migratePlayer(p);
  assert.equal(migrated.inventory[0].overcharge, "mythical");
  assert.deepEqual(migrated.wallet, p.wallet);
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(p.schemaVersion, 1);
});
test("hatching never duplicates existing fixture pet IDs", () => {
  const p = createDemo();
  p.nextItem = 1;
  const next = run(p, { type: "hatchPet" });
  assert.equal(new Set(next.pets.map((p) => p.id)).size, next.pets.length);
});
test("halo failure consumes a single attempt, guardian prevents downgrade", () => {
  const p = createDemo();
  p.headHalo = 5;
  const failed = run(
    p,
    { type: "headHalo", protect: false },
    { ...ctx, random: () => 0.99 },
  );
  assert.equal(failed.headHalo, 4);
  assert.equal(failed.wallet.cp, p.wallet.cp - 100);
  const protectedPlayer = run(
    p,
    { type: "headHalo", protect: true },
    { ...ctx, random: () => 0.99 },
  );
  assert.equal(protectedPlayer.headHalo, 5);
  assert.equal(protectedPlayer.materials.guardian, p.materials.guardian - 1);
});
test("locked gear and insufficient funds cannot partially consume materials", () => {
  const p = createDemo();
  p.wallet.silver = 0;
  const before = structuredClone(p);
  rejects(
    p,
    { type: "refine", itemId: "starter-weapon" },
    "INSUFFICIENT_FUNDS",
  );
  assert.deepEqual(p, before);
  p.inventory[0].locked = true;
  rejects(
    p,
    { type: "overcharge", itemId: "starter-weapon" },
    "ITEM_PROTECTED",
  );
});
test("skill damage affects damage and attack speed affects global recovery without resetting skill cooldown", () => {
  const p = createDemo();
  p.vanity.wrap = "player-vanity-wrap";
  p.inventory.find((i) => i.id === p.vanity.wrap).augments = [
    { stat: "skillDamage", value: 0.1 },
    { stat: "attackSpeed", value: 0.03 },
  ];
  const s = statsFor(p, ctx.now),
    d = { defense: 100, evade: 0, resistance: 0 };
  const hit = damageRoll(s, d, { coefficient: 1 }, () => 0.5);
  assert.ok(
    hit.damage >
      damageRoll({ ...s, skillDamage: 0 }, d, { coefficient: 1 }, () => 0.5)
        .damage,
  );
  let next = run(p, { type: "encounter", encounter: "sparring" });
  next = run(next, { type: "attack", targetId: "enemy-0", skillId: "strike" });
  assert.ok(next.combat.gcdUntil < ctx.now + 350);
  rejects(
    next,
    { type: "attack", targetId: "enemy-0", skillId: "strike" },
    "COOLDOWN",
  );
});
test("fresh production accounts do not receive demo funds or equipment", () => {
  const p = createPlayer("base44:test");
  assert.equal(p.wallet.cp, 0);
  assert.equal(p.inventory.length, 8);
  assert.equal(p.level, 1);
});
