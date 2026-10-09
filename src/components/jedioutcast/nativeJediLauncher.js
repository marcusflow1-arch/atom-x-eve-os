// User-initiated desktop handoff; browser JavaScript does not execute native binaries.
// Only the single, registered Atom XE Jedi Outcast command is supported.
export const JEDI_OUTCAST_DRIVE_FOLDER = '1UAX0PH6PovSrFJOYl3M3zddjZJyzougz';
export const JEDI_OUTCAST_DRIVE_URL = 'https://drive.google.com/drive/folders/' + JEDI_OUTCAST_DRIVE_FOLDER;
export const JEDI_OUTCAST_PROTOCOL = 'atomxe://launch/jedi-outcast';

export function requestNativeJediLaunch(openUrl = url => { window.location.href = url; }) {
  // The installed Windows protocol handler downloads/verifies content locally,
  // then starts the original .exe in a separate OS-controlled window.
  openUrl(JEDI_OUTCAST_PROTOCOL);
  return { state: 'handed-off', verifiedRunning: false };
}
