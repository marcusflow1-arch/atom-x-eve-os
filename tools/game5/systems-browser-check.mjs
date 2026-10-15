/** Explicit local test harness; fixed test identities never enter production routes. */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startSystemsPreview } from "./systems-preview.mjs";
import { createSystemsRepository } from "../../src/game5/systems/repository.mjs";
import { createSystemsHandler } from "../../src/game5/systems/api.mjs";
import { createDemo } from "../../src/game5/systems/state.mjs";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE || "playwright"
);
const dir = mkdtempSync(join(tmpdir(), "g5-browser-"));
const repository = createSystemsRepository(join(dir, "qa.sqlite"));
repository.transaction("base44:qa", () => {
  const player = createDemo();
  player.playerId = "base44:qa";
  return { player };
});
const handler = createSystemsHandler({
  repository,
  authenticate: async () => ({ authenticated: true, playerId: "base44:qa" }),
  allowedOrigins: ["http://127.0.0.1:4175"],
});
const server = await startSystemsPreview({ handler });
let browser;
const failures = [];
try {
  browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1050 },
  });
  page.on("pageerror", (e) => failures.push(e.message));
  await page.goto("http://127.0.0.1:4175");
  await page.getByRole("heading", { name: "A bond beyond form" }).waitFor();
  await page.getByText("10,000", { exact: true }).waitFor();
  mkdirSync("docs/game5/review", { recursive: true });
  await page.screenshot({
    path: "docs/game5/review/systems-mount-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Feed · +100 XP", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "100 spiritual XP stored" })
    .waitFor();
  await page.getByText("10,100", { exact: true }).waitFor();
  await page
    .getByRole("button", { name: "Absorb · 60 min", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Soul absorption active" })
    .waitFor();
  await page
    .getByRole("button", { name: "Strengthen spiritual weapon", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Spiritual weapon strengthened" })
    .waitFor();
  await page.getByRole("button", { name: "Utility", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Spiritual weapon mode: utility" })
    .waitFor();
  await page
    .getByRole("button", { name: "Vanity atelier", exact: true })
    .click();
  const card = page
    .locator(".g5-vanity-card")
    .filter({ hasText: "Inkbound wrap" });
  await card.getByRole("button", { name: "Equip", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Equipped Inkbound wrap" })
    .waitFor();
  await card
    .getByRole("button", { name: "Add augment · 0/3", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "Augment added" }).waitFor();
  await page.getByRole("button", { name: "Mount vanity", exact: true }).click();
  await page
    .locator(".g5-vanity-card")
    .filter({ hasText: "Jade wrap" })
    .getByRole("button", { name: "Equip", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Equipped Jade wrap" })
    .waitFor();
  await page.getByRole("button", { name: "Cultivation", exact: true }).click();
  await page
    .locator(".g5-attributes>div")
    .filter({ hasText: "Strength" })
    .getByRole("button")
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "1 points assigned to strength" })
    .waitFor();
  await page
    .getByRole("button", { name: "Advance with guardian", exact: true })
    .click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("button", { name: "Keep unchanged", exact: true })
    .click();
  assert.equal(await page.getByRole("dialog").count(), 0);
  await page.getByRole("button", { name: "Equipment", exact: true }).click();
  await page
    .getByRole("button", { name: "Unlock 150% ceiling", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Basic overcharge unlocked" })
    .waitFor();
  await page
    .getByRole("button", { name: "Attempt enchantment", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: /Enchantment (succeeded|failed)/ })
    .waitFor();
  await page.screenshot({
    path: "docs/game5/review/systems-armory-desktop.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Combat trial", exact: true }).click();
  await page.getByRole("button", { name: "Recover", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Recovered for the next challenge" })
    .waitFor();
  await page.getByRole("button", { name: "Sparring", exact: true }).click();
  await page
    .getByRole("status")
    .filter({ hasText: "Challenge started" })
    .waitFor();
  await page.getByRole("button", { name: /Flowing Strike/ }).click();
  await page
    .getByRole("status")
    .filter({ hasText: /Flowing Strike/ })
    .waitFor();
  await page.getByRole("button", { name: "Retreat", exact: true }).click();
  await page.reload();
  await page
    .getByRole("button", { name: "Vanity atelier", exact: true })
    .click();
  await page
    .locator(".g5-vanity-card")
    .filter({ hasText: "Inkbound wrap" })
    .getByRole("button", { name: "Unequip", exact: true })
    .waitFor();
  await page.getByLabel("Data source").selectOption("connected");
  await page.getByRole("button", { name: "Cultivation", exact: true }).click();
  await page
    .locator(".g5-attributes>div")
    .filter({ hasText: "Strength" })
    .getByRole("button")
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "1 points assigned to strength" })
    .waitFor();
  const stored = repository.transaction("base44:qa", (player) => ({
    player,
  })).player;
  assert.equal(stored.attributes.strength, 11);
  assert.equal(stored.points, 24);
  assert.equal(stored.sequence, 1);
  await page.getByLabel("Data source").selectOption("sandbox");
  await page.getByRole("button", { name: "Spirit mount", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "docs/game5/review/systems-mount-mobile.png",
    fullPage: true,
  });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
    "mobile horizontal overflow",
  );
  assert.deepEqual(failures, []);
  console.log(
    "PASS: mount feed/absorption/weapon mode; both vanity owners; augment; attributes; modal cancel; overcharge/enchant; combat; reload; connected HTTP + SQLite save; mobile layout.",
  );
} finally {
  await browser?.close();
  await server.close();
  repository.close();
  rmSync(dir, { recursive: true, force: true });
}
