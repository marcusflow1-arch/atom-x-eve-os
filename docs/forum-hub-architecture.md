# Forum Hub Architecture

The Forum Hub is the player-facing knowledge layer for game discussion, full guides, farming routes, achievement hunting, and card-unlock hints.

## Data flow

- `Post` remains the canonical forum post entity so legacy Community content continues to work.
- `Comment` remains the canonical reply entity and now supports stable ownership and one-level threaded replies.
- `ForumReaction` stores one emoji reaction per user/target and prevents raw client-side score inflation.
- `ForumReport` is the moderator review queue.
- `ForumRestriction` stores timed or indefinite mute/suspend/ban actions.
- `ForumModerator` stores appointed moderator roles separately from application administrators.
- `forumSystem` is the authoritative mutation boundary. The client does not directly create/delete/moderate forum content.

## Permissions

- Signed-in players can create posts, comment, reply, react, report, and delete their own content.
- Moderators can pin/lock/remove posts, delete comments, review reports, and restrict users.
- Administrators inherit moderator privileges and can appoint moderators.
- Active forum restrictions block posting, commenting, and reactions server-side.
- Legacy posts without `user_id` remain readable; ownership falls back to `created_by` email where possible.

## Knowledge formats

The composer supports normal discussion plus quick tips, guides, achievement hunts, farming routes, and full-game guides. Guide metadata includes game, tags, guide focus, and difficulty so the Forum Hub can be used like a searchable modern strategy-guide library rather than only a chronological message board.

## Stability decisions

- Feed loading is centralized into one effect/callback instead of multiple overlapping right-feed/hot-filter loops.
- Popularity is derived from reactions, comments, and views rather than unrestricted client score mutation.
- Post deletion cleans dependent comments, reactions, and reports.
- Comment deletion preserves a `[deleted]` parent when replies exist so thread structure does not break.
- Both `/Community` and `/Forum` resolve to the same hub for backwards compatibility.
