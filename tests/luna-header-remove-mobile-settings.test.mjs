import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';

const read=path=>readFileSync(path,'utf8');
const layout=read('src/Layout.jsx');
const viewToggle=read('src/components/mobile/ViewModeToggle.jsx');
const mobile=read('src/components/mobile/MobileLayoutShell.jsx');
const header=read('src/components/mobile/MobileHeader.jsx');

test('desktop top-right Settings and Switch to Mobile buttons are removed',()=>{
  assert.doesNotMatch(layout,/import ViewModeToggle from/);
  assert.doesNotMatch(layout,/<ViewModeToggle\s*\/>/);
  assert.doesNotMatch(layout,/title="Settings"/);
  assert.doesNotMatch(layout,/fixed top-4 right-4 z-\[50\]/);
  assert.match(layout,/Preview first-time setup/,'keep unrelated developer preview');
});

test('Settings page and navigation option remain available',()=>{
  assert.match(layout,/case 'settings'/);
  assert.match(layout,/createPageUrl\('LunaTemplate'\) \+ '\?panel=settings'/);
  assert.match(read('src/pages/LunaTemplate.jsx'),/<SettingsPanel\s*\/>/);
});

test('mobile interface can still switch back to desktop and open the cart',()=>{
  assert.match(mobile,/<ViewModeToggle\s*\/>/);
  assert.match(header,/<ViewModeToggle\s*\/>/);
  assert.match(header,/onClick=\{openCart\}/);
  assert.match(viewToggle,/title=\{isMobile \? 'Switch to Desktop' : 'Switch to Mobile'\}/);
});

test('shared Layout and mobile components parse after header cleanup',()=>{
  for(const file of ['src/Layout.jsx','src/components/mobile/ViewModeToggle.jsx','src/components/mobile/MobileLayoutShell.jsx','src/components/mobile/MobileHeader.jsx'])
    assert.doesNotThrow(()=>transformSync(read(file),{loader:'jsx'}),file);
});
