# Avatar creator: living face and face framing (14 Oct 2026)

On the first-login creator stage (`GenesisWizard`, also `/CharacterCreationTest`), the character now looks back at you. It reacts when you change its look, and the camera moves in to the face while you edit the face or hair.

## Eye contact

`src/components/onboarding/creatorFace.js` (`CreatorFace`) is a layer on top of whatever clip poses the body. On the creator stage that clip is the calm Stand.

- **Eyes lead, then the head follows.** The head, neck and upper chest turn toward the camera:
  - the turn is shared 12 % / 33 % / 55 % between chest, neck and head;
  - the head takes 80 % of the yaw and 65 % of the pitch, up to 60° yaw, 18° up and 24° down;
  - the eyes cover the rest, up to 28° and 16°.
- **The eyes aim their real gaze.** Each eye aims its own iris axis: the line from the eye bone (the eyeball's pivot) through the iris centre. The irises of both bodies rest a few degrees apart, so aiming the head's forward instead would leave the eyes looking past you.
- **Small eye flicks.** The eyes make small flicks (±1.4° / ±0.9°, every 0.7–2.4 s), so the gaze doesn't freeze into a stare.
- **It lets go:**
  - when the camera swings behind the character (fading from 95° to 140° off the face);
  - while it runs (fading out as speed rises past a walk);
  - while a skill animation owns the body.

**Frame order.** `restore()` runs at the start of a frame, before any mixer. three's mixer only writes values that changed, so the layer puts back what it covered, the same reason as `PoseInertializer._unapply`. `update(dt)` runs after locomotion has settled. The stage's pause freezes the layer as well.

## Reactions

Editing the look triggers a short expression on the body's own face shapes:
- the order is **pleased** (smile and squint), then **curious** (brows up), then **smirk**;
- each one comes with a small nod and head tilt;
- each runs 0.35 s in, 1.1 s hold, 1.0 s out.

**What counts as an edit.** Colours, shapes, hair, skin, style, assets and similar fields. Name, voice and the first look do not trigger a reaction. Dragging a slider keeps the current expression held instead of restarting it.

## Face framing

`focus('face' | 'body')` on the stage eases the camera (0.9 s) to a close-up of the face or back to the full-body framing.
- The face close-up is centred a little below the eyes, 0.8 m away.
- The move keeps your orbit direction, levelled toward the face.
- Grabbing the camera ends a move where it is.

**When it moves in.** `GenesisWizard` passes the focus to `GenesisModelPreview`:
- the face goes close up on the Face step (photo match) and on the Appearance step's Face and Hair tabs;
- every other step and tab shows the full body.

## Tests and checks

**Tests.** `node --test tests/avatar-face.test.mjs` passes 8/8 (both bodies, Stand clip, run through the stage's frame order). It checks:
- **Eye contact.** With the camera 20–45° to the side, the head ends 5–8° off the camera. The rendered eyes (skinned iris centre against the eyeball pivot) end within 1.6°.
- **Letting go.** The look drops when the camera is behind, while running and while busy.
- **No drift.** Nothing builds up while the clip writes nothing (paused): after `restore()`, bones and morphs are back to the clip's values exactly.
- **Reactions.** A reaction shows, holds while edits continue, clears completely, and the next edit brings the next expression.

**Checked on the real creator stage** (local harness, both bodies):
- the face close-up on the Face step and tab, and the full body on Body and Wardrobe;
- reactions while moving the face sliders;
- the head and eyes following the camera at ±45° and ±90°;
- the rendered eyes within 1.1° of the camera in the face close-up.
