# Store claims and checkout recovery — 27 September 2026

This continues the reward-delivery audit from commit b2f232fee0f153f40037f1b422ffa3e550969d42 in Atom x Eve OS. It connects the card-delivery journal to the active game purchase panel, cart, checkout and order history.

## Player-facing behavior

- Free games have a **Claim free game** action on the current game landing page.
- Incomplete starter rewards display **Retry starter rewards**. The backend supplies this status, so it survives a reload and remains recoverable after a catalog price or availability change.
- Free games already in the cart have individual claim actions. Mixed carts send only their paid games/DLC to payment.
- Checkout opens Stripe's hosted payment page. The unused address fields, dummy card fields, mock-gateway label and script-dependent redirect were removed.
- Stripe presents the final catalog price before payment. The backend derives prices from catalog data; the browser supplies item IDs and types.
- Confirmation distinguishes verification failure, pending delivery, completed delivery and historical rewards needing review. Retrying verification/delivery never invokes payment creation.
- Order history links back to verification/recovery. It and confirmation display the stored currency instead of labelling Stripe USD purchases as AGP.
- Paid items leave the cart by both item ID and type after payment verification; unrelated items remain.
- Ownership and card-collection queries refresh after a claim or verified purchase.
- Reopening the same pending cart with a different request key resumes the earlier checkout. An overlapping paid order returns to verification. A changed overlapping cart offers the earlier Stripe link instead of silently starting another payment.

## Backend delivery contract

createCheckoutSession records a pending order **before** asking Stripe to create a session. Saved items include the server-approved USD price, game/DLC identity, display information and starter-card IDs. Short Stripe metadata contains the owner, order ID and fulfillment version, avoiding a full cart in a metadata value.

A request key scoped to the account and cart persists in browser session storage. The server reuses the recorded order and original Stripe idempotency key after a lost response. A recorded Stripe session is retrieved instead of recreated. An expired session requires a new attempt. An older request without a saved session stops for reconciliation once the provider-key retention guarantee can no longer be assumed.

checkoutFulfillment.ts is shared by authenticated verification and the signed webhook:

1. Retrieve the session and expanded payment intent/charge.
2. Check owner identifiers, completed paid payment, USD currency and succeeded payment intent. Reject refunded/disputed payments and refunded/failed orders.
3. Fetch all purchased line items with pagination and expanded product metadata. Validate quantity, identity and amounts against the saved order, without consulting today's catalog prices or availability.
4. Acquire a renewable, two-minute per-order delivery lease.
5. Grant each license and captured starter reward. Stable player/game/card keys reuse the reward journal.
6. Record completion for each item after delivery succeeds. A pending item remains visible and retryable.
7. Mark the order completed only after all intended item deliveries finish.

A completed receipt acknowledges later verification without reminting a transferred or consumed reward. A revoked license for the same order is not reactivated. The lease reduces overlapping work on the same saved order; it is not a multi-record transaction.

| Operation | Result |
| --- | --- |
| claimFreeGame with action: status | Read-only ownership/pending-reward status for the signed-in player |
| Free claim or verification, 200 | Completed delivery, or explicitly flagged historical review |
| Free claim or verification, 202 | Saved access/payment with delivery still pending |
| Create checkout, verify: true | Return to confirmation for the existing session |
| CHECKOUT_EXPIRED | Reset the request key for a new checkout attempt |
| CHECKOUT_IN_PROGRESS | Resolve/resume an earlier overlapping cart |
| Webhook, 503 | Delivery/configuration incomplete; do not acknowledge success |

The Order schema adds checkout identity/return URLs, payment status, fulfillment version, captured starter IDs, completed item keys, completion time, lease fields and a legacy-review marker. Existing owner/admin read and service/admin write policies remain unchanged.

## Historical orders

Older sessions have no reliable original starter-card snapshot. Recovery verifies the old server-authored metadata against Stripe line items and repairs missing game/DLC licenses, but does **not** infer rewards from today's catalog or automatically mint historical rewards again. It returns legacy_rewards_unverified, and the UI explains the review requirement.

No production migration, historical reward backfill, payment, refund or inventory mutation was run for verification.

## Stripe setup still required

The stripeCheckoutWebhook handler is implemented, but provider registration and a live end-to-end checkout have **not** been performed in this session.

1. Obtain the deployed function URL for stripeCheckoutWebhook from Base44.
2. Register it in the appropriate Stripe account/mode for checkout.session.completed and checkout.session.async_payment_succeeded.
3. Store the endpoint's signing secret as STRIPE_CHECKOUT_WEBHOOK_SECRET in Base44. Keep it server-side and distinct from STRIPE_SECRET_KEY.
4. In Stripe test mode, verify a purchase, closed-browser completion, webhook retries, duplicate events and confirmation-page retry against actual Base44 policies.
5. Confirm the corresponding live configuration before relying on unattended fulfillment.

The handler verifies the raw request with Stripe's SDK before service-role access and returns non-2xx for incomplete deliveries. It does not send emails or messages.

References: [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment?locale=en-GB&payment-ui=embedded-page), [line-item pagination](https://docs.stripe.com/api/checkout/sessions/line_items), [metadata limits](https://docs.stripe.com/metadata), and [idempotent requests](https://docs.stripe.com/api/idempotent_requests).

## Verification

All **192 checks pass** in the combined Node test run:

- 48 checkout/recovery backend tests.
- 57 reward/event tests.
- 38 ownership/authorization tests.
- 36 battle/equipment tests.
- 13 store-claim/checkout UI tests.

The game-detail UI test and both Skill Book UI checks also pass. All four changed/new backend entry points bundle, the production frontend build passes, and whitespace checks pass.

Tests run actual bundled handlers/components against the schema-aware in-memory SDK fixture, provider stubs, injected failures before/after writes and JSDOM interaction. Coverage includes lost provider responses and acknowledgements, separate-tab recovery, leases, catalog changes, partial licenses/cards, repeated delivery, owner conflicts, refunds/disputes, pagination, legacy safeguards, webhook control flow and visible retries. Webhook signatures are provider-mocked; this is not a real Stripe webhook acceptance test.

~~~sh
node --test tests/card-ownership-security.test.mjs tests/battle-skill-eligibility.test.mjs tests/reward-delivery.test.mjs tests/checkout-recovery.test.mjs tests/store-claim-checkout-ui.test.mjs
node tests/game-detail-ui.test.mjs
node tests/skill-book-eligibility-ui.test.mjs
node tests/skill-book-avatar-refresh.test.mjs
npm run build
~~~

The game-detail fixture uses the current cardCollection and gameReviews APIs. The battle test checks the existing turn handoff and cooldown instead of the older continuous-ATB expectation. Combat implementation was not changed by this pass; parallel battle/rig changes were preserved.

## Remaining limits

- The Base44 SDK contract does not establish cross-request uniqueness or multi-record transactions. Simultaneous first-time creates across independent orders/claims can still race. The prior-checkout scan and per-order lease reduce repeat work but do not establish a global exactly-once guarantee.
- Actual Base44 conditional-update/RLS behavior, live Stripe signatures, provider registration, simultaneous first claims and a live browser payment flow remain unverified. No supported live preview was available for visual acceptance; UI checks use JSDOM and the build.
- Orders without historical reward evidence need support reconciliation. Lost older checkout attempts without a saved provider session also require review instead of creating a possible duplicate charge.
- Paid checkout currently handles USD, one copy per game/DLC, cards, and no shipping/tax/discount adjustments at Stripe. Additional billing rules require matching validation and UI work.
- Existing browser-data freshness and ambiguous Tailwind-duration warnings remain nonfatal.
