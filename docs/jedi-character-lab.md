# Jedi character systems lab

This route is a separate test surface from the normal Jedi Outcast campaign launcher.

## Scope

The dashboard button **Jedi Character Test** sits immediately to the right of **Star Wars Jedi Knight II: Jedi Outcast** and opens `/JediCharacterLab`.

The page is deliberately isolated from the Atom XE application shell. The only Atom XE control drawn over the game is **Return to Dashboard**. The original Raven browser runtime owns rendering, player movement, Ghoul2 animation, weapons, Force powers, HUD selectors, input, sound, and gameplay.

## Character asset actually present

The canonical Jedi Outcast retail data already stored by the project contains Raven's Jedi Outcast player:

- `models/players/kyle/model.glm`
- `models/players/_humanoid/_humanoid.gla`

The existing archive audit records Kyle's GLM as 2LGM v6 with 72 bones and the humanoid GLA as 2LGA v6 with the matching 72-bone skeleton.

No **Cal Kestis** model or Cal-specific animation set is present in the Jedi Outcast source/data currently registered in this repository/admin integration. Therefore this first systems test deliberately uses the original Jedi Outcast player asset rather than inventing or substituting a Cal model. A later Cal visual swap requires a separate compatible model/rig asset.

## Test boot

`?lab=character` changes only the new lab route. Normal Jedi Outcast launches still use Raven's original menu/campaign progression.

The lab boots the original single-player engine with source-backed development commands:

```text
devmap kejim_post
wait 120
give all
setForceAll 3
weapon 1
```

From Raven's released source:

- `devmap` enables the single-player cheat state.
- `give all` fills health, inventory, player weapons, ammo, batteries, armor, and Force energy.
- `setForceAll 3` sets Force Jump, Saber Throw, Heal, Push, Pull, Speed, Grip, Lightning, Mind Trick, Saber Defense, and Saber Offense to level 3.
- `weapon 1` selects the lightsaber after the test load.

This is intentionally a development override. It does not change normal campaign progression.

## Native input under test

The canonical Jedi Outcast configuration/source maps the main controls as follows:

- **W / A / S / D** — forward / left / back / right
- **Space** — jump / Force Jump when Levitation is unlocked
- **Shift** — speed/run modifier
- **Mouse 1** — primary attack
- **Mouse 2 / Alt** — alternate attack
- **Mouse wheel up/down** — previous/next weapon; the original HUD selector remains engine-owned
- **Q / R** — previous/next weapon
- **Z / X** — previous/next Force power
- **F** — use selected Force power
- **F1** — Force Push
- **F2** — Force Pull
- **F3** — Force Speed
- **F4** — Mind Trick/Distraction
- **F5** — Force Heal
- **F6** — Force Grip
- **F7** — Force Lightning
- **L** — cycle lightsaber combat style
- **E / Ctrl** — use/interact

The existing iframe keyboard bridge already forwards letter keys, digits, arrows, Space, modifiers and F1-F12. Mouse and wheel input remain native to the focused game canvas.

## Acceptance boundary

Repository tests verify that the route/button exists, the page stays full-screen, and the lab boot arguments use Raven's commands. They do **not** prove live WebGL rendering, animation playback, weapon discharge, or Force effects on the user's GPU. Those require the authenticated browser runtime to be opened and exercised.
