# Store and dashboard social update

The Store overview now uses a single catalog with clear Discover, All games, Top sellers, New releases, and For you sections. The game detail page keeps its existing structure and uses more horizontal space.

## Store behavior

- Search matches titles, genres, tags, developers, and descriptions. Suggestions support the keyboard and open the selected game.
- Filters combine genre, price, play style, availability, and library ownership. An empty result stays empty.
- Discovery interleaves genres, rotates between visits, and includes a manual refresh. The hero pauses on focus, hover, or reduced-motion settings.
- Top sellers uses completed orders from the past 30 days. If the 10,000-order processing limit is reached, the UI labels the ranking as a sample.
- New releases uses confirmed release dates and excludes future/planned releases.
- For you saves genres and selected played games per account. Recent valid launch requests can influence recommendations; users can turn off using played games. Guests save preferences locally.
- Unknown prices are labeled as unannounced, not free.

## Dashboard and social behavior

- Main and mini character viewers run idle without the animation/cycle panel.
- Dashboard presence uses authenticated heartbeats, expires after 20 seconds, and admits five total players. The host appears on the right with visitors one body-width apart to the left.
- Join opens the destination immediately; heartbeat admission determines the connected/error state.
- Friend, dashboard, and party invitations appear in system notifications. Accepting a friend request creates both friendship records. Retrying partial friendship or party acceptance repairs the existing operation.
- Party capacity is five total members. Occupied portrait tiles appear vertically next to the assistant panel, with message and party actions.
- Voice signaling uses the supported ice message type, queues candidates until remote SDP, deduplicates signals, and handles microphone denial, delayed permission, departed peers, and room cleanup. Microphone capture starts only after enabling it.
- Party and dashboard voice rooms have separate scopes.

## Verification

Passed in the Base44 project sandbox:

- npm run build
- node tests/store-discovery.test.mjs
- node tests/store-ui.test.mjs
- node tests/social-backend.test.mjs
- node tests/voice-lifecycle.test.mjs
- ESLint checks for the new Store and social modules plus the updated avatar, notification, party, and voice components.

The backend tests run the actual function source against an in-memory SDK with schema checks. UI interaction tests render the actual Store components with a simulated SDK. Voice tests use simulated peers and permission responses. These tests do not send messages, invitations, or notifications to real people.

The broader lint run still reports existing unused imports/variables in FocusModePanel, both legacy game-detail components, and unused legacy store sections.

Authenticated browser layout review and a real call between two devices have not been completed. Voice currently has STUN only; networks requiring a TURN relay need relay provisioning before connectivity can be guaranteed. Production build passes with existing browser-data and Tailwind utility warnings.
