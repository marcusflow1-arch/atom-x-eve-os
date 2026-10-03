import assert from 'node:assert/strict';
import test from 'node:test';
import { skillBookLayout } from '../src/components/dashboard/skillBookLayout.js';
const rect = (left, right, top, bottom) => ({ left, right, top, bottom, width: right - left, height: bottom - top });
test('Skill Book follows all four dashboard edges and leaves the real hotkeys clear', () => {
  const layout = skillBookLayout({
    width: 1440, height: 900,
    library: rect(0, 330, 400, 852), attributes: rect(1102, 1440, 190, 852),
    hub: rect(390, 1102, 64, 218), owner: rect(390, 1440, 164, 852), hud: rect(0, 440, 640, 852),
  });
  assert.equal(layout.workspace.left, '330px');
  assert.equal(layout.workspace.right, '338px');
  assert.equal(layout.workspace.top, '218px');
  assert.equal(layout.workspace.bottom, '48px');
  assert.ok(parseFloat(layout.workspace['--skill-book-hud-space']) > 212 + 12);
  assert.equal(parseFloat(layout.hud.left) + 348 / 2, (330 + 1102) / 2, 'keys and EXP are centered, without prefab controls skewing them');
  assert.equal(layout.hud.bottom, '60px', 'preserves the original 48px footer + 12px offset');
  assert.equal(layout.hud.width, '440px');
  assert.equal(layout.stacked, false);
});
test('narrow dashboard bands keep slots inside the gap and preserve their bottom offset', () => {
  const layout = skillBookLayout({
    width: 1024, height: 768, library: rect(0, 330, 390, 720),
    attributes: rect(720, 1024, 190, 720), hub: rect(390, 720, 64, 190), owner: rect(390, 1024, 164, 720),
  });
  assert.equal(layout.stacked, true);
  const left = parseFloat(layout.hud.left), width = parseFloat(layout.hud.width);
  assert.ok(left >= 330 && left + width <= 720);
  assert.equal(left + width / 2, 525);
  assert.equal(layout.hud.bottom, '60px');
});
test('compact screens fall back to a usable inset without negative widths', () => {
  const layout = skillBookLayout({ width: 390, height: 844, library: rect(0, 330, 390, 796), attributes: rect(273, 390, 190, 796) });
  assert.equal(layout.workspace.left, '12px');
  assert.equal(layout.workspace.right, '12px');
  assert.ok(parseFloat(layout.hud.width) > 0);
  assert.ok(parseFloat(layout.hud.left) + parseFloat(layout.hud.width) <= 378);
});
