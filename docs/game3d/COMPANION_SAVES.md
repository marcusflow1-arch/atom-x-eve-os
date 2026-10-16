# GameView companion equipment saves

## Scope

This change continues Game 3D at `src/pages/GameView.jsx`, on main `632177cc0f0e32dac2fdc00e4e04ed06e0af4a50`. It retains Claude's weapon archetype/affinity/quick-switch integration and the merged mount/vanity transaction fix (#87).

The old companion store used a global browser key, a single account-wide `User.companion_state`, mutable subscriber snapshots, and delayed callbacks that read whichever character happened to be current. The Gear menu also had its own disconnected equipment save.

Now both equipment menu stores use one validated companion loadout. The current Character Hub's Mounts service panel shows save status and conflict/retry controls. The older Gear and Companion panels use the same feedback component. Those older panels are not newly installed as a replacement for the current Character Hub inventory.

## Persistence contract

- Local document: `wwm_companion_state_v1::<user.id>::<characterId>`; version 2 envelope with `loadout`, `dirty`, and last acknowledged cloud `{id, revision}`. Local writes must succeed before equipment changes publish. Riding is transient and does not require storage or cloud access.
- Local schema owns only companion selection and saddle/armor/charm catalog preferences. It does not grant equipment ownership, currency, progression, or authoritative combat bonuses.
- New cloud entity: `Game3DCompanionLoadout`, declared in `base44/entities/game3-d-companion-loadout.jsonc`. One intended record per `owner_id`/`character_id`, with `revision` and `loadout`.
- RLS declares owner-only create/read/update; FLS prevents owner and character reassignment. Deletes are denied. The client verifies `auth.me().id` against its captured namespace before remote operations. Server access restrictions must still be verified after deployment.
- Updates use the pinned SDK 0.8.54's `updateMany` query with record ID, owner, character and expected revision, plus `$set`/`$inc`. A result other than exactly one updated record is a conflict. No direct fallback to unconditional `update` or `auth.updateMe` exists.
- Each request carries a captured account, character and generation. Obsolete responses cannot hydrate or acknowledge a different character. Edits made during a read are retained. Writes are serialized within a generation; edits made during a write inherit its acknowledged revision for their next write.
- A pending timer is canceled on account/character change. Already-sent writes may finish for the original character; their responses cannot change the new character. Dirty local state survives reload. A lost acknowledgement is recovered when the cloud already contains the same normalized loadout.
- `Keep this device’s equipment` explicitly retries against the currently observed cloud revision; a concurrent change is still rejected. `Replace with cloud equipment` must save the downloaded state locally before publishing it.
- Anonymous and pre-character (`__default__`) profiles stay local. Authentication mismatch, unavailable entity/network, invalid records, and duplicates are visible failures, not successful cloud saves.

## Migration

Reuse the existing legacy-owner/Dev-Test rules in `characterStorage.jsx`. Canonical companion data takes precedence over the old Gear-menu `wwm_companion_fusion_v1` preference. The fusion save is considered only if canonical local data is absent. Global legacy keys remain intact. An authenticated account's old `companion_state` is imported only into `__dev_test__`, only when neither a local nor a cloud record exists. New characters never inherit that account-wide equipment automatically. `isMounted` is never imported or persisted.

## Known boundaries before deployment

1. **Schema is prepared, not deployed.** Before releasing this client, deploy the new entity using the project's reviewed workflow and verify RLS/FLS with two actual accounts. Without it, device saves work and cloud sync reports an error.
2. **First-save uniqueness is not guaranteed.** The verified entity schema contract provides no unique owner/character constraint. Simultaneous first creates can produce duplicate records. Reads fetch up to two records, stop on duplicates, preserve local data and direct the player to support. No automatic destructive reconciliation is attempted. A server-enforced unique key/transaction and a reviewed repair path remain follow-up work.
3. **Live conditional-write behavior is unverified.** Tests simulate the documented SDK boundary; they do not prove deployed database atomicity or authorization. Verify competing revisions, denied cross-account queries/updates, immutable identity, session expiry and lost responses against the real service.
4. The character roster remains local to the current app. A cloud loadout does not synchronize roster creation or establish server-authoritative character ownership. Cross-device recovery requires the same character ID.
5. Offline same-character edits in multiple browser tabs still share a localStorage document. There is no local multi-tab transaction/lock protocol. Cloud revision checks prevent blind stale remote updates; they do not solve every local multi-tab edit collision.
6. Physical saddle/armor/charm mesh bindings are not supplied by the catalog. No visual attachment or new asset is claimed. AXE mount speed/bonuses remain the primary world rules; this change does not wire catalog defense into combat or change speed precedence.
7. Live GameView mounting/dismounting, model visibility on account changes, full-world rendering and multiplayer are not verified by these panel tests. The world has its own mounted refs; no physics/input/render code is rewritten here.

## Reproduction and evidence

```bash
node --test tests/game3d/companion-persistence.test.mjs tests/game3d/progression-integration.test.mjs
npx eslint src/components/game3d/companion src/components/game3d/companionStore.jsx src/components/game3d/equipment/companionFusionStore.jsx src/components/game3d/equipment/CompanionSaveStatus.jsx src/components/game3d/equipment/CompanionTab.jsx src/components/game3d/equipment/GearTab.jsx src/components/game3d/progression/hub/MountSubTab.jsx
npm run build
```

38 tests pass: 19 companion persistence/adapter tests and 19 prior progression integration tests. They exercise actual production stores with simulated external service responses. Schema assertions check declared access policy, not live enforcement. Targeted ESLint passes. Production build passes with the existing missing Base44 app/proxy environment and browser-data/style warnings.

`tools/game3d/review-progression.mjs` mounts the real panels/stores in an isolated browser harness. Set `PLAYWRIGHT_MODULE`, `CHROMIUM_PATH`, and `REVIEW_OUTPUT_DIR` as needed. The cloud simulator exists only inside this QA runner. The runner covers failed equip/no false update, retry, both conflict choices, offline retry, character switching/reload, plus the existing mount/vanity/halo upgrade/cancel/failure and mobile-layout checks. It does not authenticate to or alter a live account.
