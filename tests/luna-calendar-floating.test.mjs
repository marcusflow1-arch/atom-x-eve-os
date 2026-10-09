import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = path => readFileSync(path,'utf8');

test('Luna dashboard has a detachable calendar while other routes retain full-screen mode', () => {
  const layout = read('src/Layout.jsx');
  const calendar = read('src/components/calendar/IntelligentCalendarOverlay.jsx');
  const status = read('src/components/dashboard/DateTimeTile.jsx');
  const theme = read('src/components/calendar/luna-calendar-window.css');
  assert.match(layout, /<DashboardWindow id="calendar" title="Calendar" width=\{980\} height=\{690\}/);
  assert.match(layout, /<IntelligentCalendarOverlay embedded/);
  assert.match(layout, /<IntelligentCalendarOverlay onClose=/);
  assert.match(layout, /focusDashboardWindow\('calendar'\)/);
  assert.match(calendar, /return embedded \? overlay : createPortal\(overlay, document\.body\)/);
  assert.match(status, /luna-status-calendar-side[\s\S]*luna-status-announcements/);
  assert.doesNotMatch(status, /luna-status-divider|luna-status-underline/);
  assert.match(theme, /#315d80|#315f82/);
  assert.match(theme, /text-white\/22/);
});

test('calendar reuses window move resize focus and supports nested event creator', () => {
  const shell = read('src/components/dashboard/windows/DashboardWindow.jsx');
  const calendar = read('src/components/calendar/IntelligentCalendarOverlay.jsx');
  const creator = read('src/components/calendar/AIEventCreator.jsx');
  assert.match(shell, /setPointerCapture/);
  assert.match(shell, /onPointerMove=\{move\}/);
  assert.match(shell, /onMinimizedChange/);
  assert.match(shell, /data-window-dismiss-layer/);
  assert.match(calendar, /if \(!embedded\) document\.body\.style\.overflow = 'hidden'/);
  assert.match(calendar, /if \(embedded && !showCreator\) return/);
  assert.match(calendar, /calendarAgent/);
  assert.match(calendar, /data-calendar-day/);
  assert.match(creator, /data-window-dismiss-layer/);
  assert.match(creator, /luna-calendar-creator/);
});
