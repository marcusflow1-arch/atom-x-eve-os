import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path,'utf8');
const frame = read('src/components/dashboard/FocusModePanel.jsx');
const status = read('src/components/dashboard/DateTimeTile.jsx');
const clock = read('src/components/dashboard/DashboardClockTile.jsx');
const css = read('src/components/dashboard/dashboard-status.css');

test('top row places calendar/time then upright divider then exactly five real party slots',()=>{
  const from=frame.indexOf('<div className="luna-header-status-row"');
  const to=frame.indexOf('{/* Bottom Row: Nav Boxes + Intelligence Feed */}',from);
  assert.ok(from>0 && to>from);
  const markup=frame.slice(from,to);
  const clockPos=markup.indexOf('<div className="luna-party-clock">{calendarBox}</div>');
  const linePos=markup.indexOf('<span className="luna-party-clock-divider" aria-hidden="true" />');
  const slotsPos=markup.indexOf('<div className="luna-party-five-slots"');
  const notificationPos=markup.indexOf('<div className="luna-attribute-notifications"');
  assert.ok(clockPos>0 && clockPos<linePos && linePos<slotsPos && slotsPos<notificationPos);
  assert.match(markup,/partySlots\.map\(\(member, index\) =>/);
  assert.match(markup,/data-party-slot=\{index \+ 1\}/);
  assert.match(markup,/data-party-portrait/);
  assert.match(markup,/setAIBoxSocialMode\('party'\)/);
  assert.match(markup,/lunaAIBattleRejoin/);
});

test('calendar tile has functional icon, live time, date and calendar-window action',()=>{
  assert.match(frame,/calendarBox=\{<DashboardClockTile onCalendarClick=\{onOpenCalendar \|\| openCalendar\} \/>\}/);
  assert.match(clock,/CalendarDays size=\{22\}/);
  assert.match(clock,/aria-label="Open calendar"/);
  assert.match(clock,/toLocaleTimeString/);
  assert.match(clock,/toLocaleDateString/);
  assert.match(clock,/window\.setInterval/);
  assert.match(clock,/window\.clearInterval/);
});

test('silver line creates a small visual gap without placing notifications between the party boxes',()=>{
  assert.match(css,/\.luna-party-clock-group\{[^}]*gap:12px/);
  assert.match(css,/\.luna-party-clock-divider\{[^}]*width:1px;height:62px/);
  assert.match(css,/\.luna-party-five-slots\{/);
  assert.match(css,/\.luna-party-five-slots::\-webkit-scrollbar/);
  assert.doesNotMatch(status,/luna-status-split|luna-status-calendar-side/);
});

test('separate notification strip starts at and matches AI Attribute panel width',()=>{
  const dashboard=read('src/components/dashboard/DashboardAvatarOverview.jsx');
  assert.match(dashboard,/right: 'min\(338px, 30vw\)'/);
  assert.match(css,/\.luna-attribute-notifications\{width:min\(338px,30vw\)/);
  assert.match(frame,/<div className="luna-attribute-notifications" data-luna-ai-notifications>/);
  assert.match(frame,/notificationsBox=\{<DateTimeTile \/>\}/);
  assert.match(status,/aria-label="System notifications"/);
  assert.match(status,/<strong>System notifications<\/strong>/);
  assert.match(status,/SystemUpdatesRemindersOverlay/);
  assert.match(status,/<StatusFeedButton label="System updates"/);
  assert.match(status,/<StatusFeedButton label="Notifications"/);
});
