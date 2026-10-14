# Avatar creator recolour regions (14 Oct 2026)

Getsuga and Artemis each paint skin, hair and clothes into a single texture atlas, with one material. Before this change, only eye colour could be changed on them. Skin tone and hair colour were greyed out, and there were no outfit colours.

Each body now ships baked **region masks**. The body material recolours each region in its fragment shader and keeps the painted shading, folds, muscle lines and prints.

| Body | Regions |
|---|---|
| Getsuga | Skin, Hair, Shirt, Shorts, Sandals & straps |
| Artemis | Skin, Hair, Dress, Leather & armour (the gold trim goes with the leather) |

## In the creator

- **Skin.** Skin tone and Skin shine now work. Shine changes the roughness of the skin only, never the clothes. Highlight tint is hidden on these bodies because it can't be limited to the skin.
- **Hair.** Hair colour now works. It also recolours the eyebrows painted in the hair colour.
- **Wardrobe → Outfit colours.** One colour picker per garment.
- **Resets.** Every picker has an **Original** link that restores the painted colour.

**Saving.** Garment colours are saved in `material_colors` under keys `region:<id>`, for example `region:shirt`. The backend already validates and stores that map, so the server and schema need no change. Skin and hair use the existing `skin_tone` / `skin_tint_enabled` and `hair_color` / `hair_tint_enabled` fields.

## How it works

**`tools/avatar-regions/bake-regions.mjs`** (needs ffmpeg) handles the bake:
1. It rasterises each body mesh into UV space, so every texel knows its bind-pose position on the body and which bone moves it.
2. Each region has a colour model in Lab, fitted to seed spots on the body:
   - skin: cheeks, with forearms and calves added for Getsuga;
   - hair: the crown;
   - shirt: the chest;
   - shorts: the front of the thigh;
   - dress: the skirt panels between and behind the legs.
3. Each region may only appear on certain parts of the body. For example, hair only on the head (on Artemis, within 16.5 cm of the skull centre, so the quiver's arrows are excluded), and sandals and straps only on the feet, shins, forearms and hips.
4. A texel joins the region whose colour it matches best, among the regions allowed there.
5. Each region is then closed over thin gaps, in priority order (skin, then garments, then the rest). Painted lines therefore belong to what they're drawn on: muscle definition stays skin, and wrinkles stay shirt.
6. Masks are smoothed inside UV islands and padded 6 texels across island borders, so texture filtering never shows a seam.

The output is `public/models/characters/regions/<body>/mask-N.png` (1024², one region per RGBA channel) plus `regions.json`. The manifest holds each region's reference colour: the region's average, measured where the shader measures it.

**`src/components/onboarding/bodyRegions.js`** handles runtime:
- It binds the masks to `M_Character` and `M_Artemis` when a body loads.
- It chains onto any existing `onBeforeCompile` hook, and keeps its program separate through `material.defines`.
- The recolour is a **statistics transfer** in gamma-space luma/chroma. The region's average moves to the chosen colour, and each texel keeps its painted offset from that average.
  - Contrast scales with the change in lightness, so black hair made blond still shows strands.
  - Chroma offsets scale with the change in saturation, limited to between ×0.65 and ×1.3.
  - Very light choices are eased so they read as pale rather than glowing, and highlights roll off instead of clipping.

To regenerate (the output is deterministic: two runs give byte-identical masks):

```bash
node tools/avatar-regions/bake-regions.mjs
```

Debugging aids:
- `--debug <dir>` writes overlay images.
- `REGION_PROBE=` reports what the texels around body points became.
- `REGION_DUMP=` lists where a region's texels are.

## Evidence

**Tests.**
- `node --test tests/avatar-regions.test.mjs`: 5/5 pass. They cover the shipped masks against their manifests, shader generation and injection, how appearance maps to region colours, and the editor capabilities with live uniform updates.
- The existing avatar suites still pass: `avatar-creator`, `avatar-creator-ui`, `avatar-locomotion` and `artemis-skinning`.
- ESLint is clean.

**Checked in the browser on the real creator stage:**
- The full UI path, on Artemis: Wardrobe → Dress / Leather & armour pickers, Hair, and Skin.
- Four looks per body.
- Close-ups of the shirt hem and collar, the face, and the quiver.

**Coverage** (share of each body's atlas):

| Body | Skin | Hair | Clothing |
|---|---|---|---|
| Getsuga | 25 % | 6 % | shirt 29 %, shorts 13 %, straps 8 % |
| Artemis | 12 % | 5 % | dress 57 %, leather 13 % |

## Known limits

- **Masks are automatic, from a painted atlas.** A few texels at slit edges and strap borders land in the neighbouring region. For example, on Artemis a red dress shows some red flecks on the skin at the slits. Artist-painted masks, or separate materials, in the Blender phase would remove this.
- **Wrist wraps** on Getsuga are cloth, so they keep their colour.
- **Other scenes.** Only scenes that use the shared appearance runtime show the colours: the creator, the dashboard previews and the profile. Other scenes that load the body GLB directly still show the painted original.
