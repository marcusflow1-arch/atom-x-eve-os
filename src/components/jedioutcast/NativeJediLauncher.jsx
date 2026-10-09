import { useState } from 'react';
import { ExternalLink, FolderDown, Gamepad2, HardDrive, Info, MonitorPlay, ShieldCheck } from 'lucide-react';
import { JEDI_OUTCAST_DRIVE_URL, requestNativeJediLaunch } from './nativeJediLauncher';
import './native-jedi-launcher.css';

const SOURCE_ROOT = 'https://github.com/marcusflow1-arch/atom-x-eve-os/tree/main/tools/native-jedi-launcher';

/** This is a native Windows launcher handoff, not a counterfeit browser game. */
export default function NativeJediLauncher({ onPreviewWeb }) {
  const [requested, setRequested] = useState(false);
  const launch = () => {
    setRequested(true);
    requestNativeJediLaunch();
  };
  return <section className="jko-native-launcher" aria-label="Jedi Outcast desktop launcher">
    <div className="jko-native-launcher__header">
      <span className="jko-native-launcher__icon"><Gamepad2 size={24} /></span>
      <div>
        <small>Atom XE · Original desktop game</small>
        <h2>Star Wars Jedi Knight II: Jedi Outcast</h2>
        <p>Use the original Windows executable, renderer, controls and video settings in its own desktop window.</p>
      </div>
    </div>
    <div className="jko-native-launcher__steps">
      <div><FolderDown size={17}/><strong>Google Drive</strong><span>Source folder connected. Files must first sync to your PC.</span></div>
      <div><ShieldCheck size={17}/><strong>Verify installation</strong><span>Requires jk2sp.exe and original base/*.pk3 archives. Missing retail archives prevent launching.</span></div>
      <div><MonitorPlay size={17}/><strong>Native game window</strong><span>The installed launcher starts jk2sp.exe; graphics settings remain under the real game engine.</span></div>
    </div>
    <div className="jko-native-launcher__notice" role="status"><Info size={17}/><span>
      A web page cannot execute a Windows EXE or mount private Drive files. Install the Windows desktop companion and authorize your Drive account first. The supplied folder has the EXE and loose game files, but the original PK3 archives were not present at its top level.
    </span></div>
    <div className="jko-native-launcher__actions">
      <button type="button" onClick={launch} className="jko-native-launcher__primary"><MonitorPlay size={17}/> Launch on Desktop</button>
      <a href={SOURCE_ROOT + '/README.md'} target="_blank" rel="noopener noreferrer"><HardDrive size={16}/> Desktop setup instructions <ExternalLink size={13}/></a>
      <a href={JEDI_OUTCAST_DRIVE_URL} target="_blank" rel="noopener noreferrer"><FolderDown size={16}/> View Drive files <ExternalLink size={13}/></a>
      {onPreviewWeb && <button type="button" className="jko-native-launcher__secondary" onClick={onPreviewWeb}>Open existing web reconstruction (not original game)</button>}
    </div>
    {requested && <p className="jko-native-launcher__hint" role="status">
      Handoff requested. If Windows asks to open Atom XE, allow it. If no desktop launcher is installed, follow the setup instructions; this web page cannot verify that the game started.
    </p>}
  </section>;
}
