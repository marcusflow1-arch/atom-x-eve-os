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

test('skills restore bronze ornament, clock stays light and AI chrome becomes silver', () => {
  assert.match(hud, /LunaOrnateChrome variant="skills"/);
  assert.doesNotMatch(hud, /luna-light-hotbar\.css/);
  assert.match(dateTile, /LunaLightEdge variant="clock"/);
  assert.match(attrs, /<LunaOrnateChrome variant="silver" \/>/);
  assert.match(lightChrome, /aria-hidden="true"/);
  assert.match(lightCss, /pointer-events:none/);
  assert.match(frame, /aria-hidden="true"/);
  assert.match(chromeCss, /pointer-events:none/);
  assert.ok(existsSync('public/ui/luna/xe-ornate-corner.svg'));
  assert.ok(existsSync('public/ui/luna/xe-ornate-gem.svg'));
  assert.ok(existsSync('public/ui/luna/xe-silver-corner.svg'));
  assert.ok(existsSync('public/ui/luna/xe-silver-gem.svg'));
  const silverCss = read('src/components/dashboard/luna-silver-attribute.css');
  assert.match(silverCss, /xe-silver-corner\.svg/);
  assert.match(silverCss, /xe-silver-gem\.svg/);
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
