import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path,'utf8');
const frame = read('src/components/dashboard/FocusModePanel.jsx');
const status = read('src/components/dashboard/DateTimeTile.jsx');
const css = read('src/components/dashboard/dashboard-status.css');

test('status box is reduced by 35 percent without resizing the party or skill tree', () => {
  assert.match(frame, /luna-status-size-frame h-full min-w-0/);
  assert.match(frame, /width: '65%'/);
  assert.match(frame, /partySlots\.map/);
  assert.match(frame, /<SkillTreeAnchor/);
});

test('one shared box is split exactly 30/70 by an upright divider', () => {
  assert.match(css, /grid-template-columns:minmax\(0,30%\) minmax\(0,70%\)/);
  assert.match(css, /\.luna-status-split\{[\s\S]*?left:30%;[\s\S]*?width:1px/);
  assert.match(status, /<span className="luna-status-split" aria-hidden="true" \/>/);
  assert.match(status, /<LunaLightEdge variant="clock" \/>/);
  assert.match(css, /\.luna-status\{[\s\S]*?background:linear-gradient/);
});

test('time and date stay left; latest updates and reminders occupy the 70 percent pane', () => {
  assert.ok(status.indexOf('luna-status-calendar-side') < status.indexOf('luna-status-announcements'));
  assert.match(status, /aria-label="Open calendar"/);
  assert.match(status, /aria-label="Open system updates and reminders"/);
  assert.match(status, /data\.feeds\.notifications\[0\] \|\| data\.feeds\.updates\[0\]/);
  assert.match(status, /<strong>System updates &amp; reminders<\/strong>/);
  assert.match(status, /<StatusFeedButton label="System updates"/);
  assert.match(status, /<StatusFeedButton label="Notifications"/);
  assert.match(status, /SystemUpdatesRemindersOverlay/);
  assert.doesNotMatch(status, /luna-status-underline/);
});
