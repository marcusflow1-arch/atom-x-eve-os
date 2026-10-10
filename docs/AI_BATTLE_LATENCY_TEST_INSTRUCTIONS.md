# PvP latency instrumentation: how to use

Changes on this branch only:
- PvPArenaStage emits `atomxePvPLatency` CustomEvents for `cast_input`, `cast_server_ack`, `peer_cast_received`, `last_cast_fallback`, `hit_log_observed`.
- The opt-in WSS relay forwards visual actions through the same PvP validation handler as WebRTC; it does **not** authorize damage.
- A secure, authenticated, match-scoped WebSocket relay server must be deployed separately before the WSS test can work. No endpoint is provided or deployed in this commit.

In each browser's DevTools console:
```js
localStorage.setItem('atomxe_pvp_latency_debug', '1');
window.addEventListener('atomxePvPLatency', e => console.log('PvP diagnostic', e.detail));
```
Reload the page, join a PvP match, and cast Chidori. Capture logs on both clients. The same browser's `cast_server_ack.at - cast_input.at` measures input-to-server-confirmation latency. Compare peer-receive and fallback event timing on the receiving browser. Browser performance clocks are **not** synchronized between browsers.

For an experimental WSS relay (requires your own authenticated server implementing join, pvp_action, ping/pong):
```js
localStorage.setItem('atomxe_pvp_wss_url', 'wss://YOUR-SECURE-RELAY');
localStorage.setItem('atomxe_pvp_wss_enabled', '1');
```
Reload after changing settings. To disable:
```js
localStorage.removeItem('atomxe_pvp_wss_enabled');
```

IMPORTANT: The server must validate authentication, match membership, and message permissions independently. The browser-supplied source identity and cast contents must never be treated as authoritative. The experimental path is visual-only. A real server-authoritative combat transport requires a separate server implementation and a coordinated migration of authoritative game rules. This branch has not undergone live two-player testing or build verification.
