import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = path => readFileSync(path, 'utf8');
const hud = read('src/components/dashboard/LunaSkillXpHud.jsx');
const attrs = read('src/components/dashboard/DashboardAvatarOverview.jsx');
const frame = read('src/components/dashboard/LunaOrnateChrome.jsx');
const slots = read('src/components/dashboard/luna-ornate-hotbar.css');
const attrCss = read('src/components/dashboard/luna-ornate-attributes.css');
const chromeCss = read('src/components/dashboard/luna-ornate.css');
const lightChrome = read('src/components/dashboard/LunaLightEdge.jsx');
const dateTile = read('src/components/dashboard/DateTimeTile.jsx');
const lightCss = read('src/components/dashboard/luna-light-edge.css');

test('AI panel retains ornate bronze frame while skills and clock use translucent light pins', () => {
  assert.match(hud, /LunaLightEdge variant="skills"/);
  assert.match(dateTile, /LunaLightEdge variant="clock"/);
  assert.match(attrs, /<LunaOrnateChrome \/>/);
  assert.match(lightChrome, /aria-hidden="true"/);
  assert.match(lightCss, /pointer-events:none/);
  assert.match(frame, /aria-hidden="true"/);
  assert.match(chromeCss, /pointer-events:none/);
  assert.ok(existsSync('public/ui/luna/xe-ornate-corner.svg'));
  assert.ok(existsSync('public/ui/luna/xe-ornate-gem.svg'));
});

test('skill slots retain existing hotkeys, drop handlers and prefab logic', () => {
  assert.match(hud, /SKILL_KEYS.map/);
  assert.match(hud, /onDrop=\{drop\}/);
  assert.match(hud, /lunaRequestSkillSlotActivation/);
  assert.match(hud, /chooseSet\(set\)/);
  assert.match(hud, /luna-hotbar-skill-shell/);
  assert.match(slots, /\.luna-hotbar:not\(\[data-embedded\]\)/);
  assert.match(slots, /\.luna-hotbar\[data-embedded\] .luna-hotbar-skill-shell/);
});

test('AI Attribute preserves live stats, social views and action controls', () => {
  assert.match(attrs, /aria-label="AI Attribute Box"/);
  assert.match(attrs, /toggleAIBoxSocialMode\(id\)/);
  assert.match(attrs, /<AIBoxSocialPanel mode=\{aiBoxSocialMode\}/);
  assert.match(attrs, /<StatRow icon=/);
  assert.match(attrs, /data-dashboard-attribute-actions/);
  assert.match(attrs, /axe-attribute-shell/);
  assert.match(attrCss, /\.axe-attribute-actions/);
  assert.match(attrCss, /\.axe-stat-row/);
});
