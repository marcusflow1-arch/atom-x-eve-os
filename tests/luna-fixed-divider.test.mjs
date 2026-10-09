import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = filename => readFileSync(filename,'utf8');
const page = read('src/pages/LunaTemplate.jsx');
const line = read('src/components/dashboard/LibrarySectionDivider.jsx');
const css = read('src/components/dashboard/library-divider.css');

test('left library and Skill Tree geometry remains the original fixed 330px layout', () => {
  assert.match(page, /width: uiVisible \? '388px' : '330px'/);
  assert.match(page, /left: '330px'/);
  assert.match(page, /left: '440px'/);
  assert.match(page, /<FocusModePanel/);
  assert.match(page, /<LibraryBrowser/);
  assert.match(page, /<LibrarySectionDivider \/>/);
});

test('no ratio, saved width, drag handlers, or responsive resizing logic remains in the dashboard', () => {
  assert.doesNotMatch(page, /libraryWidthFromRatio|libraryRatioFromWidth|LIBRARY_RATIO_STORAGE_KEY/);
  assert.doesNotMatch(page, /libraryWidth|resizeLibrary|dashboardContentRef/);
  assert.doesNotMatch(line, /onPointer|onMouse|onKeyDown|tabIndex|role="separator"|onResize/);
  assert.doesNotMatch(line, /setPointerCapture|ResizeObserver|localStorage/);
});

test('the divider is solely a plain dark-gray stationary vertical line', () => {
  assert.match(line, /aria-hidden="true"/);
  assert.match(line, /luna-library-divider-line/);
  assert.match(css, /left:329px/);
  assert.match(css, /width:2px/);
  assert.match(css, /pointer-events:none/);
  assert.match(css, /#55575e/);
  assert.doesNotMatch(css, /col-resize|hover|svg|grip/);
});
