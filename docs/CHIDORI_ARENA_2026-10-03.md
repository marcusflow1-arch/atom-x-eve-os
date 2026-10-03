# Chidori in the PvP arena (2026-10-03)

## The move (both bodies, identical)
Timeline from the cast. The palm strike lands at 2.0 s, lined up with the
server's `resolves_at` (Chidori `hit_ms` is 2000), so the HP drop and stun
arrive at the visible impact.

| Time | Caster | Target |
| --- | --- | --- |
| 0–0.48 s | grabs the right wrist, crouches, slams the hand into the ground (flash, shock ring) | |
| 0.48–1.42 s | charges: lightning in the hand, ground arcs, sparks | can still dodge |
| 1.42–2.0 s | sprints across the net, dragging the hand through a glowing trench | |
| 2.0 s | palm strike to the torso: impact frame, bolts burst out the back | thrown back |
| 2.42–2.6 s | fades out in a lightning column | staggers, drops to the knees |
| 2.76–2.98 s | fades back in on their own side, hand still crackling | collapses face down, lightning running through the body, stars |
| | returns to idle at ~3.8 s | lies stunned for the 2.8 s stun, then pushes up, one knee, stands, back on their spot |

A dodged or missed strike leaves the target alone (the palm hits air).

Code: `src/components/battle/ultimate/thunderRush/arenaChidori.js` is the
choreography (engine-agnostic IK poses, so the male and female skeletons move
the same, plus the lightning effects and screen hints).
`src/components/battle/chidoriArenaPresenter.js` applies it to the arena
fighters: it poses their skeletons on top of their own clips, blends in and out,
fades the caster, draws the effects and plays `public/sfx/chidori-arena.mp3`.
`PvPArenaStage` uses it in place of `createChidoriCaster` (the dashboard and
onboarding Chidori are unchanged). Rest poses are captured when a fighter loads.

## Rate limits (from the match video)
The recorded match showed "Rate limit exceeded" (HTTP 429): a skill press
failed, the room heartbeat missed, and "Reconnect to Match" covered the turn
banner. On top of the realtime/deadline refresh already on main:
- A skill or melee strike that gets a rate-limit reply is re-sent (0.7 s,
  1.6 s, 3 s) with the same `cast_id`. The server answers a repeated `cast_id`
  with the original result, so a retry never casts or hits twice and never
  fails as "not your turn". If all retries fail: "The server is busy. Try that
  again in a moment." Dodge is not retried (it has no cast id).
- The opponent's relayed dodge also wakes the match refresh (their turn ended).
- Background fight poll every 2 s (was 1 s); realtime, hit deadlines and the
  opponent's relayed actions already refresh right away.
- Position writes need a 0.5 m move (was 5 cm).
- A missed room heartbeat ("reconnecting") is not a lost room: no re-joining,
  and the Reconnect button waits 6 s and sits at the top right, clear of the
  turn banner.
- `last_cast` carries `damage`/`crit`.

Tests: `tests/chidori-arena.test.mjs` (crosses the net, palm reaches the torso,
fades home, target down for the stun and back up, identical on UE and Mixamo
skeletons, dodge leaves the target alone); `tests/ai-battle-matchmaking.test.mjs`
(a retried skill and melee with the same `cast_id` apply once; small moves do
not write).
