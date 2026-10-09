import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { constrainLibraryWidth, libraryWidthFromRatio, libraryRatioFromWidth, LIBRARY_DEFAULT_WIDTH, LIBRARY_MIN_WIDTH, LIBRARY_RATIO_STORAGE_KEY } from '../src/components/dashboard/libraryResize.js';

const read = path => readFileSync(path, 'utf8');
const page = read('src/pages/LunaTemplate.jsx');
const splitter = read('src/components/dashboard/LibraryWidthDivider.jsx');
const libraryCss = read('src/components/dashboard/gamehub/library-browser.css');
const hotbar = read('src/components/dashboard/LunaSkillXpHud.jsx');
const dateTile = read('src/components/dashboard/DateTimeTile.jsx');

test('ratio uses the full page width while reserving 450px of main workspace', () => {
  assert.equal(constrainLibraryWidth(undefined, 1600), LIBRARY_DEFAULT_WIDTH);
  assert.equal(constrainLibraryWidth(10, 1600), LIBRARY_MIN_WIDTH);
  assert.equal(constrainLibraryWidth(9999, 1600), 1120);
  assert.equal(constrainLibraryWidth(9999, 800), 350);
  assert.equal(constrainLibraryWidth(480, 650), 220);
  assert.equal(constrainLibraryWidth(NaN, 1600), LIBRARY_DEFAULT_WIDTH);
  assert.equal(libraryWidthFromRatio(.5,1600),800);
  assert.equal(libraryWidthFromRatio(.5,1200),600);
  assert.equal(libraryRatioFromWidth(700,1400),.5);
});

test('drag line handles pointer capture, keyboard adjustments and reset', () => {
  assert.match(splitter, /setPointerCapture/);
  assert.match(splitter, /releasePointerCapture/);
  assert.match(splitter, /onPointerMove=\{move\}/);
  assert.match(splitter, /onPointerUp=\{stop\}/);
  assert.match(splitter, /onPointerCancel=\{stop\}/);
  assert.match(splitter, /onDoubleClick=/);
  assert.match(splitter, /role="separator"/);
  assert.match(splitter, /aria-orientation="vertical"/);
  assert.match(splitter, /ArrowLeft/);
  assert.match(splitter, /ArrowRight/);
});

test('resizing applies to library, normal main area and full library mode', () => {
  assert.match(page, /<LibraryWidthDivider width=\{libraryWidth\} onResize=\{resizeLibrary\}/);
  assert.match(page, /width: uiVisible \? '388px' : \x60\$\{libraryWidth\}px\x60/);
  assert.match(page, /left: \x60\$\{libraryWidth\}px\x60/);
  assert.match(page, /LIBRARY_RATIO_STORAGE_KEY/);
  assert.match(page, /libraryWidthFromRatio\(libraryRatio, contentWidth\)/);
  assert.match(page, /libraryRatioFromWidth\(pixelWidth, total\)/);
  assert.equal(LIBRARY_RATIO_STORAGE_KEY, 'atomxe.dashboard.libraryRatio.v2');
  assert.match(page, /ResizeObserver/);
  assert.match(page, /id="luna-resizable-main"/);
});

test('library/card area reverts from opaque gray to a transparent vignette', () => {
  assert.match(libraryCss, /\.ll-browser \{/);
  assert.match(libraryCss, /rgba\(70,105,135,\.11\)/);
  assert.doesNotMatch(libraryCss, /rgba\(17,30,46,\.96\),rgba\(10,20,34,\.96\)/);
});

test('clock keeps its light outline while skill slots return to the previous ornate design', () => {
  assert.match(dateTile, /<LunaLightEdge variant="clock"/);
  assert.match(hotbar, /<LunaOrnateChrome variant="skills"/);
  assert.match(hotbar, /SKILL_KEYS\.map/);
  assert.match(hotbar, /onDrop=\{drop\}/);
});
