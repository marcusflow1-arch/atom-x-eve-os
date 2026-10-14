# Avatar creator shape sliders (14 Oct 2026)

The creator's face and body sliders now work on Getsuga and Artemis. Before, they were greyed out, because neither body had the `CC_*` shape keys they drive.

**Face** (Face section):
- Brow ridge
- Face width
- Jaw width
- Nose width
- Eye size

**Body** (Body section):
- Chest size
- Glute size
- Shoulder width
- Muscle

**Skin section:** Age appearance.

All are two-sided: −100 % … Original … +100 %. The exception is age, which runs from Original to More mature.

## How

`tools/avatar-shapes/shapes.mjs` bakes each key while the bodies are built (`node tools/avatar-motion/locomotion.mjs`, writing the `*_v5.glb` bodies).

**Displacement fields.** Each key is a smooth displacement field over bind-pose positions, placed from landmarks measured on the body itself:
- the eyeballs: the centre of their own meshes;
- the mouth, nostrils and brows: where the face's own expression shapes `Mouth_Open`, `Nostril_Flare` and `Brow_Up_*` move the skin;
- the chin: the lowest point on the front of the face;
- the chest and glutes: bones projected onto the skin;
- the shoulders: the upper-arm joints.

**Meshes it applies to.** The same field moves the body and the separate eye and mouth meshes, so eyes stay in their sockets and teeth stay inside the mouth.

**Storage.** Keys are stored sparse: only the vertices that move. Every clip that drives the body's expression weights gets zeros for the new keys. The creator sets those keys every frame (`applyPersistentShapes`), after the clip's face track has written its values.

**Strength at ±1:**

| Key | Getsuga | Artemis |
|---|---|---|
| Face width | 12 mm | 13 mm |
| Jaw width | 10 mm | 8 mm |
| Nose width | 5 mm | 5 mm |
| Eye size | 20 % eye scale (about 3 mm) | 20 % eye scale (about 3 mm) |
| Brow ridge | 6 mm | 6 mm |
| Chest | 20 mm | 24 mm |
| Glutes | 30 mm | 30 mm |
| Shoulders | 35 mm (sideways) | 35 mm (sideways) |
| Muscle | 9 mm on arms and legs | 9 mm on arms and legs |
| Age | 2–3 mm (jowls, lower cheeks, under-eye) | 2–3 mm (jowls, lower cheeks, under-eye) |

**Two-sided values.** `SHAPE_CONTROLS` in `base44/shared/avatarCustomization.ts` now carries `min: -1` for two-sided keys. `normalizeCustomization` keeps negative values on save; the stored `shape_controls` object has no bounds in the entity schema.

**File size.** v5 is v4 plus about 0.9 MB on Getsuga (8.7 MB) and 1.4 MB on Artemis (10.9 MB).

## Evidence

**Tests.** `node --test tests/avatar-locomotion.test.mjs` passes 15/15. The checks include:
- **v5 against v3.** Meshes, textures, skins and every clip value are compared accessor by accessor. The only differences allowed are the new keys, the zero-padded face tracks and Artemis's arm fix.
- **Shape regions.** Face keys never move anything below the neck. Body keys leave the head alone (except the shoulders). Eye meshes follow Eye size but not Chest.
- **Sliders in the runtime.** Every slider unlocks. Values reach the mesh in both directions and survive the Stand clip's face track.

All 38 avatar tests pass.

**Checked visually:**
- In the local motion viewer, each key at −1 and +1 on both bodies.
- On the real creator stage, Face width, Jaw width and Eye size at +100 % against −100 %.

## Next

- **Face scan.** Feed "Match from a photo" (`face_shape`) into these keys for the two bodies.
- **More keys.** Face height, eye spacing, mouth width, and a fuller age set.
