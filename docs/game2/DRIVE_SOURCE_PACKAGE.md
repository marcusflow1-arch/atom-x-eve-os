# Game Two — Google Drive replacement package (verified 2026-10-11)

## Source

User-provided Drive folder:
https://drive.google.com/drive/folders/1Ug-lWjnJBFI9tq51kjTn6Q04r5f_V_sG

This is the October 8 replacement archive unpacked in Google Drive:

- public/game2/: character GLB, rig.json, animation bank, sabermoves.json, Force and saber SFX
- src/components/game2/: original WebGL2 Dark Jedi implementation and engine files
- src/pages/Game2.jsx and src/Layout.jsx: dashboard-to-Game-Two entry points
- tests/: original duel and Force-rule tests
- README_APPLY.txt: original file deletion/overwrite request

## What is already integrated

The Game Two launcher is src/pages/Game2.jsx. The active runtime lives in
src/components/game2/Game2Duel.jsx and src/components/game2/engine/.

The following active main-branch files were verified byte-for-byte against
this specific Drive replacement package on 2026-10-11:

| Asset | Git blob SHA-1 |
| --- | --- |
| public/game2/rig.json | 9bcf68667017c9427f2b168a2e48e86be7926266 |
| public/game2/sabermoves.json | c6ec01838f579fc59270f8995fc41b153d466145 |
| src/components/game2/engine/forcerules.js | 4df49fa98a67d6ffe3998916af6bc306455fa33d |

Other Game Two files have since changed; for example, the newer Game2Duel
adds a single-player/online/practice menu and Railway-based multiplayer.
Do not overwrite those newer files with the older package.

The original Game Two viewer files identified by README_APPLY.txt have
already been removed, as enforced by tests/game2-duel.test.mjs.

The current Game Two duel imports a Lightsaber Training BSP from a *separate*
source folder; it is not a recreation of the complete Jedi Outcast campaign.
The project has not been verified here in a live published browser session.

## Import or verify the remaining Drive assets

No Google Drive OAuth token is stored in source control. Run these locally
from the repository root with a short-lived OAuth token that has Drive
read-only permission for the source package:

    GOOGLE_DRIVE_ACCESS_TOKEN='<read-only token>' node tools/game2/drive-source-sync.mjs
    GOOGLE_DRIVE_ACCESS_TOKEN='<read-only token>' node tools/game2/drive-source-sync.mjs --verify
    GOOGLE_DRIVE_ACCESS_TOKEN='<read-only token>' node tools/game2/drive-source-sync.mjs --sync-missing

On Windows PowerShell:

    $env:GOOGLE_DRIVE_ACCESS_TOKEN = '<read-only token>'
    node tools/game2/drive-source-sync.mjs --verify
    Remove-Item Env:GOOGLE_DRIVE_ACCESS_TOKEN

The default mode inventories the remote public/game2 subtree, checks
whether corresponding local assets exist, and prints missing assets.

--verify uses Google Drive MD5 metadata to check local files, including
the existing chunked GLB/animation bank. It does not download data.

--sync-missing downloads **only missing** public/game2 assets and checks
size/hash where Google metadata supports it. It never deletes files,
overwrites existing game data, or writes Game Two source files. This is
intentional: replacing src/components/game2 would roll back subsequent
input, combat and multiplayer work. The original large GLB and compressed
bank are already distributed as chunks; the command recognizes those.

Do not commit retail/copyrighted asset files without the applicable rights.
Keep any tokens out of commits, issues, logs, and browser source.

## Tests

    node --test tests/game2-drive-source.test.mjs tests/game2-duel.test.mjs
    npm run build

Build/run on a preview branch before changing the live app. For a complete
acceptance test, verify: Game Two menu; keyboard + mouse-look; model/rig
load; imported map; saber and Force actions; sound; exit; and two real
browser clients joining the same multiplayer room. These are test
requirements, not claims of live verification.
