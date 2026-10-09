import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path,'utf8');
const frame = read('src/components/dashboard/FocusModePanel.jsx');
const status = read('src/components/dashboard/DateTimeTile.jsx');
const clock = read('src/components/dashboard/DashboardClockTile.jsx');
const css = read('src/components/dashboard/dashboard-status.css');

test('top row places icon-only Environment Hub first, divider, party slots, then unchanged clock next to notifications',()=>{
  const from=frame.indexOf('<div className="luna-header-status-row"');
  const to=frame.indexOf('{/* Bottom Row: Nav Boxes + Intelligence Feed */}',from);
  assert.ok(from>0 && to>from);
  const markup=frame.slice(from,to);
  const environmentPos=markup.indexOf('className="luna-environment-top-icon"');
  const environmentDividerPos=markup.indexOf('<span className="luna-environment-party-divider" aria-hidden="true" />');
  const slotsPos=markup.indexOf('<div className="luna-party-five-slots"');
  const clockGroupPos=markup.indexOf('<div className="luna-attribute-clock-group"');
  const clockPos=markup.indexOf('<div className="luna-party-clock">{calendarBox}</div>');
  const calendarDividerPos=markup.indexOf('<span className="luna-party-clock-divider" aria-hidden="true" />');
  const notificationPos=markup.indexOf('<div className="luna-attribute-notifications"');
  assert.ok(environmentPos>0 && environmentPos<environmentDividerPos && environmentDividerPos<slotsPos
    && slotsPos<clockGroupPos && clockGroupPos<clockPos && clockPos<calendarDividerPos && calendarDividerPos<notificationPos);
  assert.match(markup,/aria-label="Open Environment Hub"/);
  assert.match(markup,/onClick=\{\(\) => window\.dispatchEvent\(new Event\('openEnvironmentHub'\)\)\}/);
  assert.match(markup,/<Globe size=\{23\} strokeWidth=\{1\.6\} aria-hidden="true" \/>/);
  assert.doesNotMatch(markup,/>\s*Environments\s*</);
  assert.match(markup,/partySlots\.map\(\(member, index\) =>/);
  assert.match(markup,/data-party-slot=\{index \+ 1\}/);
  assert.match(markup,/data-party-portrait/);
  assert.match(markup,/openLunaSocialWindow/);
  assert.match(markup,/mode: 'party'/);
  assert.doesNotMatch(markup,/setAIBoxSocialMode\('party'\)/);
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

test('two silver lines separate Environment from party and Calendar from notifications',()=>{
  assert.match(css,/\.luna-environment-party-group\{[^}]*gap:12px/);
  assert.match(css,/\.luna-environment-party-divider\{[^}]*width:1px;height:62px/);
  assert.match(css,/\.luna-party-clock-divider\{[^}]*width:1px;height:62px/);
  assert.match(css,/\.luna-attribute-clock-group\{[^}]*gap:12px/);
  assert.match(css,/\.luna-party-five-slots\{/);
  assert.match(css,/\.luna-party-five-slots::\-webkit-scrollbar/);
  assert.doesNotMatch(status,/luna-status-split|luna-status-calendar-side/);
});

test('separate notification strip starts at and matches AI Attribute panel width',()=>{
  const dashboard=read('src/components/dashboard/DashboardAvatarOverview.jsx');
  assert.match(dashboard,/right: 'min\(338px, 30vw\)'/);
  assert.match(css,/\.luna-attribute-notifications\{width:min\(338px,30vw\)/);
  assert.match(css,/\.luna-party-clock\{width:162px;height:77px;flex:none;min-width:0\}/);
  assert.match(css,/\.luna-attribute-clock-group\{[^}]*margin-left:auto/);
  assert.match(frame,/<div className="luna-attribute-notifications" data-luna-ai-notifications>/);
  assert.match(frame,/notificationsBox=\{<DateTimeTile \/>\}/);
  assert.match(status,/aria-label="System notifications"/);
  assert.match(status,/<strong>System notifications<\/strong>/);
  assert.match(status,/SystemUpdatesRemindersOverlay/);
  assert.match(status,/<StatusFeedButton label="System updates"/);
  assert.match(status,/<StatusFeedButton label="Notifications"/);
});
