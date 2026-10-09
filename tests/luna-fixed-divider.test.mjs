import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = filename => readFileSync(filename,'utf8');
const page = read('src/pages/LunaTemplate.jsx');
const library = read('src/components/dashboard/gamehub/LibraryBrowser.jsx');
const libraryCss = read('src/components/dashboard/gamehub/luna-forged-library.css');

test('left library and Skill Tree geometry remains the original fixed 330px layout', () => {
  assert.match(page, /width: uiVisible \? '388px' : '330px'/);
  assert.match(page, /left: '330px'/);
  assert.match(page, /left: '440px'/);
  assert.match(page, /<FocusModePanel/);
  assert.match(page, /<LibraryBrowser/);
  assert.doesNotMatch(page, /<LibrarySectionDivider \/>/);
  assert.match(page, /<LibraryBrowser/);
});

test('no ratio, saved width, drag handlers, or responsive resizing logic remains in the dashboard', () => {
  assert.doesNotMatch(page, /libraryWidthFromRatio|libraryRatioFromWidth|LIBRARY_RATIO_STORAGE_KEY/);
  assert.doesNotMatch(page, /libraryWidth|resizeLibrary|dashboardContentRef/);
  assert.doesNotMatch(page, /LibrarySectionDivider|LibraryWidthDivider/);
  assert.doesNotMatch(page, /setPointerCapture|LIBRARY_RATIO_STORAGE_KEY/);
});

test('the divider is removed and the left Games/Cards/Library panel has its own silver frame', () => {
  assert.doesNotMatch(page, /LibrarySectionDivider|luna-library-divider/);
  assert.match(library, /<LunaOrnateChrome variant="library"/);
  assert.match(libraryCss, /xe-silver-corner\.svg/);
  assert.match(libraryCss, /background:linear-gradient\(160deg,#10283e/);
  assert.match(libraryCss, /pointer-events:none|\.axe-ornate-frame--library/);
  assert.doesNotMatch(libraryCss, /col-resize/);
});
