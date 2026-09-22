# Individual game landing page

Scope: the page opened by clicking a game in the Store (`/GameDetail?id=…&from=store`). The Store overview and its header were restored to their pre-redesign version (reference `2dadbf80`). New header, search, card styling, and catalog hooks live under `components/game/detail` so this work does not restyle the Store.

## Layout and behavior

- Persistent game-page header includes navigation, catalog search, the player's AGP balance, cart, and profile. Focusing search offers catalog matches and retains the existing lower search panel.
- Wide gallery on the left, compact information and purchase controls on the right, screenshots beneath, and the selected game's artwork in the background.
- Achievements and avatar rewards are visible immediately below the gallery. Rewards are loaded for this game from Achievement records. Categories, unlock conditions, rewards, and existing unlock status use stored data.
- Overview, Games, Studio, and Stream controls are visible near the title. The existing footer's three mini-page switches share that selection.
- Games shows the studio catalog using stored developer/profile associations. Profile titles absent from the store are clearly labeled as unavailable.
- Studio shows published information and current/upcoming projects. No generation service runs automatically on a page visit.
- Stream reads actual live records for the selected game from Stream/AuraStream and uses the existing stream player for supported video, HLS, YouTube, and Twitch sources. Trailers are not treated as live streams. Playback starts after a click.
- Requirements, reviews, expansions, cards, wishlist, ownership, and cart continue to use their existing data and contexts. The companion preview remains the existing dashboard avatar in idle mode.
- Missing data and failed requests have explicit empty/error states. No sample rewards, fake reviews, viewer counts, discounts, or studio claims were added.

## Verification

- Production build passed; existing browser-data and Tailwind duration warnings remain.
- Targeted ESLint passed.
- `node tests/game-detail-ui.test.mjs` passed with an isolated SDK: media selection, theater/keyboard controls, explicit playback, cart/auth/ownership/availability, wishlist persistence and errors, saved reviews, actual record-backed DLC/cards/rewards, studio tabs, offline stream state, and failed-load recovery.
- `node tests/game-landing-header.test.mjs` passed: main navigation event, header destinations, balance/cart, catalog search on focus and Enter, lower search-panel callback, and synchronized footer controls.
- Store overview, header, search, discovery helpers, catalog schema, checkout functions, and purchase-ranking function were compared to the pre-redesign reference for exact restoration.

Live visual sign-off was unavailable in this session. No real purchase, user review, or streaming session was created during validation.
