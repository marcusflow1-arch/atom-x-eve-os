import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path,'utf8');
const hotbar = read('src/components/dashboard/LunaSkillXpHud.jsx');
const focus = read('src/components/dashboard/FocusModePanel.jsx');
const styles = read('src/components/dashboard/luna-silver-hotbar.css');
const topStyles = read('src/components/dashboard/environment-rollout.css');
const page = read('src/pages/LunaTemplate.jsx');

test('Skill Tree launcher is icon-only, separate from all ten skill buttons', () => {
  assert.match(hotbar, /!embedded && \([\s\S]*?data-luna-skill-tree-hotbar-button/);
  assert.match(hotbar, /aria-label="Open Skill Tree"/);
  assert.match(hotbar, /<Network aria-hidden="true" size=\{22\}/);
  assert.match(hotbar, /<div className="luna-hotbar-skill-shell">/);
  assert.match(hotbar, /SKILL_KEYS\.map/);
  assert.match(hotbar, /onDrop=\{drop\}/);
  assert.match(hotbar, /chooseSet\(set\)/);
});

test('new icon fires the same Skill Tree action used by Luna dashboard', () => {
  assert.match(hotbar, /onClick=\{\(\) => window\.dispatchEvent\(new CustomEvent\('toggleSkillTree'\)\)\}/);
  assert.match(page, /addEventListener\('toggleSkillTree', handleSkillTree\)/);
  assert.match(page, /setShowSkillTreeBlankUI\(true\)/);
});

test('old upper launcher becomes an invisible anchor without changing party or feature rail positions', () => {
  assert.match(focus, /function SkillTreeAnchor\(\)/);
  assert.match(focus, /data-luna-environment-hub data-luna-skill-tree-launcher/);
  assert.match(focus, /<SkillTreeAnchor \/>/);
  assert.doesNotMatch(focus, /<SkillTreeTile \/>/);
  assert.match(topStyles, /\.luna-skill-tree-anchor\{width:100%;height:100%;background:transparent/);
});

test('standalone button is reasonably sized and outside slot one, not drawn inside a skill box', () => {
  assert.match(styles, /\.luna-hotbar-skill-tree-button\{/);
  assert.match(styles, /position:absolute;[\s\S]*?left:-52px;[\s\S]*?top:17px;[\s\S]*?width:42px;[\s\S]*?height:42px/);
  assert.match(styles, /\.luna-hotbar-skill-tree-button:focus-visible/);
  assert.match(styles, /@media\(max-width:560px\)/);
});
