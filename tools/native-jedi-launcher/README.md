# Atom XE — native Jedi Outcast launcher

This companion is the path for launching the **original Windows Jedi Outcast game**, rather than recreating it in WebGL. It is meant to be started by the **Star Wars Jedi Knight II: Jedi Outcast** button in the Atom XE dashboard's floating launcher window.

## How it works

1. In Windows, install [rclone](https://rclone.org/downloads/) and configure a Google Drive remote named `atomxe-drive` using `rclone config` (you must authorize Drive yourself). **Do not put OAuth tokens in the website or GitHub.**
2. Download this `tools/native-jedi-launcher` folder from the Atom XE repository to your PC. Review `Install-Companion.ps1` and `Launch-JediOutcast.ps1`, then use Windows PowerShell to run `Install-Companion.ps1`. Installation registers `atomxe:` for the current Windows user, without administrator access.
3. In the Atom XE Dashboard, click **Star Wars Jedi Knight II: Jedi Outcast**, which opens an independent draggable launcher window. Click **Launch on Desktop**. Windows may ask you to confirm opening the Atom XE companion.
4. The companion downloads **all files recursively** from Drive folder `1UAX0PH6PovSrFJOYl3M3zddjZJyzougz` using `rclone copy` to `%LOCALAPPDATA%\AtomXE\Games\JediOutcast`. It runs `rclone check --one-way` before any launch; it does not delete local files or game saves.
5. It verifies the Windows `jk2sp.exe` executable and the required original `base\assets0.pk3`, `base\assets1.pk3`, `base\assets2.pk3`, `base\assets5.pk3` containers, then uses `Start-Process` to open the native game. If a file is missing, it stops with an explicit error rather than reporting a fake successful launch.

**Known Drive source limitation:** The supplied folder contains `jk2sp.exe`, `jk2mp.exe`, DLLs, configs, maps, textures, models and other unpacked resources, plus a separate source-code tree. The top-level listing did **not** show the original game archives `assets*.pk3`. It is therefore **not a verified complete installation**. Place your legally owned, unmodified original retail PK3 files into `%LOCALAPPDATA%\AtomXE\Games\JediOutcast\base`, or upload the original `base` folder containing them to this Drive source, before attempting to launch. The companion deliberately does not reconstruct the archives from loose extracted files.

## Graphics, resolution and controls

The launcher does not embed the game in a web canvas, set an artificial resolution, replace the renderer, or simulate Windows graphics options. The original process owns its independent native desktop window and manages the in-game Video/Graphics and input menus. Original Jedi Outcast was released in 2002; operation with modern Windows graphics drivers and displays may still require a separately tested compatibility fix or an updated native engine build. **Full resolution/graphics compatibility cannot be guaranteed by copying files.**

The button in Base44 opens a floating **launcher-control window**. The actual game is opened by Windows as its **own separate OS window** after the installed companion completes verification. Browsers and Google Drive cannot execute `.exe` files on their own.

## Security and privacy

- The browser invokes only `atomxe://launch/jedi-outcast`; the Windows handler rejects other URLs. No JavaScript, URL-supplied path, program name, or arbitrary arguments are executed.
- Google Drive OAuth is handled by the user's local rclone configuration, not by the Atom XE web page. Its credentials are never sent to Base44 or GitHub.
- The setup is explicit: review and run it locally. No game executable or launcher software is auto-installed by merely visiting the dashboard.
- To remove the protocol association, delete `HKCU\Software\Classes\atomxe`; the game files and rclone remain under your own control.
- Never run unknown downloaded binaries until you trust their source. No antivirus or malware-safety assessment is implied by an asset or MZ-signature check.

## Troubleshooting

**Nothing happens after clicking Launch on Desktop:** The custom protocol handler has not been registered; run `Install-Companion.ps1`, then try again. Depending on browser settings, a confirmation prompt may appear.

**rclone not found:** Install rclone and make sure `rclone.exe` is on PATH.

**Google Drive remote not configured:** Run `rclone config` and configure a Drive remote literally named `atomxe-drive`. Access must include the specified folder.

**Verification fails:** Check Drive permissions and network connection, then run the command again. Incomplete downloads are not reported as success.

**Original assets*.pk3 archives missing:** Add the original purchased game files under `base`. Loose `maps`, `textures`, etc. alone are not identical to a complete retail installation.

**Game starts but shows resolution or rendering issues:** This is a native game/driver compatibility issue, not a browser scaling defect. Test the original game graphics menu, the installed executable version, and Windows compatibility settings. Keep a known-good copy of your config files before modifications.

**Want to use the current browser version instead?** The launcher offers **Open existing web reconstruction** separately, without claiming that it runs the native engine.
