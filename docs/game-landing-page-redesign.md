# Game landing page redesign

The Store → GameDetail route now uses a wide media gallery and a concise information/purchase panel. A game's banner or first screenshot supplies the background. Screenshots sit directly below the gallery; Overview, System requirements, Reviews and Luna extras organize the remaining content.

## Integration
- GameHubTabs owns a single catalog request, cancels stale responses, and provides retry/back navigation.
- GameGallery keeps inline and theater selection synchronized. Trailers start only on request. Native video, YouTube and Vimeo are supported; other safe trailer URLs open externally.
- Cart, ownership and sign-in use the existing shared contexts. Wishlist changes use the existing Wishlist entity/provider and show errors.
- Requirements show published values only. Missing prices remain unavailable, and future/planned games cannot be added to the cart.
- Reviews load/save through Post. The page no longer renders invented reviews, playtimes or votes.
- Expansions load through DLC (active records for this game); cards load through CardTemplate. Companion preview loads the existing dashboard character with idle-only behavior.
- Store navigation, restored search panels, shared sidebar controls and developer overlays remain in their existing components.

## Checks
- npm run build: passed.
- Targeted ESLint: passed.
- node tests/game-detail-ui.test.mjs: gallery selection, keyboard/theater controls, playback, cart/auth/ownership/availability, wishlist errors/persistence, review persistence, real DLC/cards and failed-load recovery passed with isolated SDK fixtures.
- node tests/store-ui.test.mjs: passed.
- The final CSS retains the current shared color tokens and supplies a viewport-height scroll surface, header/footer clearance, visible artwork, keyboard focus and mobile stacking.

The cloud browser rejected opening the local component preview. No live visual sign-off or real checkout transaction is claimed; production payments and real user reviews were not submitted by these checks.
