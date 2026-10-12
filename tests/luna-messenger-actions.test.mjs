import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (relative) => readFileSync(new URL(relative, import.meta.url), 'utf8');

test('Messages header has Call, Video, Trade, and Profile in that order', () => {
  const message = source('../src/components/friends/MessengerHub.jsx');
  const header = message.match(/<header className="flex h-\\[68px\\][\\s\\S]*?<\\/header>/)?.[0];
  assert.ok(header, 'active Messages conversation header exists');
  const actions = [
    'title="Voice call"',
    'title="Video call"',
    'title="Trade cards"',
    'title="View profile"',
  ];
  let last = -1;
  for (const action of actions) {
    const index = header.indexOf(action);
    assert.ok(index > last, action + ' must appear to the right of the previous control');
    last = index;
  }
  assert.match(header, /aria-label=\\{\x60Trade with/);
  assert.match(header, /aria-label=\\{\x60View /);
});

test('Trade reuses existing Friend Card Trade dialog and profile uses dashboard profile event', () => {
  const message = source('../src/components/friends/MessengerHub.jsx');
  const dashboard = source('../src/components/dashboard/DashboardAvatarOverview.jsx');
  assert.match(message, /<FriendTradePanel key=\\{tradeFriend.id\\} friend=\\{tradeFriend\\} overlayMode="dashboard"/);
  assert.match(message, /createPortal\\(/);
  assert.match(message, /openLunaGamerProfile/);
  assert.match(dashboard, /window.addEventListener\\('openLunaGamerProfile', openProfile\\)/);
  assert.match(message, /friend_id: String\\(selected.partner_id\\)/);
});

test('misplaced circles were removed from the Friends quick-access header', () => {
  const friends = source('../src/components/dashboard/LunaFriendsQuickAccessPanel.jsx');
  assert.doesNotMatch(friends, /Reserved blank circle|aria-label="Open my profile"/);
  assert.match(friends, /aria-label=\\{"Trade with /);
  assert.match(friends, /aria-label=\\{"View /);
});
