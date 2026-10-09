import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {requestNativeJediLaunch,JEDI_OUTCAST_PROTOCOL,JEDI_OUTCAST_DRIVE_FOLDER} from '../src/components/jedioutcast/nativeJediLauncher.js';

const read=p=>readFileSync(p,'utf8');
test('Jedi Outcast top button opens an independent floating native launcher',()=>{
 const l=read('src/Layout.jsx');
 const w=read('src/components/jedioutcast/NativeJediLauncher.jsx');
 assert.match(l,/onClick=\{\(\) => \{ setNativeJediLauncherOpen\(true\); focusDashboardWindow\('jedi-native-launcher'\)/);
 assert.match(l,/<DashboardWindow id="jedi-native-launcher"/);
 assert.match(l,/<NativeJediLauncher onPreviewWeb=/);
 assert.match(w,/Launch on Desktop/);
 assert.match(w,/Use the original Windows executable/);
 assert.match(w,/web reconstruction \(not original game\)/);
 assert.doesNotMatch(w,/Math\.random\(|setInterval\(|Loading 100%|GAME RUNNING/);
});
test('browser sends fixed explicit native protocol; never reports a verified launch',()=>{
 let url='';
 const result=requestNativeJediLaunch(next=>{url=next;});
 assert.equal(url,'atomxe://launch/jedi-outcast');
 assert.equal(JEDI_OUTCAST_PROTOCOL,url);
 assert.equal(result.verifiedRunning,false);
 assert.equal(result.state,'handed-off');
 assert.equal(JEDI_OUTCAST_DRIVE_FOLDER,'1UAX0PH6PovSrFJOYl3M3zddjZJyzougz');
});
test('Windows companion syncs Drive and checks essential original game archives before running',()=>{
 const ps=read('tools/native-jedi-launcher/Launch-JediOutcast.ps1');
 const install=read('tools/native-jedi-launcher/Install-Companion.ps1');
 assert.match(ps,/--drive-root-folder-id=/);
 assert.match(ps,/& \$rclone\.Source copy/);
 assert.match(ps,/& \$rclone\.Source check/);
 assert.match(ps,/--one-way/);
 assert.match(ps,/assets0\.pk3/);
 assert.match(ps,/assets1\.pk3/);
 assert.match(ps,/assets2\.pk3/);
 assert.match(ps,/assets5\.pk3/);
 assert.match(ps,/Start-Process -FilePath \$exe -WorkingDirectory \$installDir/);
 assert.match(ps,/\$LaunchUrl -ne \$expected/);
 assert.doesNotMatch(ps,/Invoke-Expression|iex |curl .*\|.*powershell/);
 assert.match(install,/HKCU:\\Software\\Classes\\atomxe/);
 assert.match(install,/Launch-JediOutcast.ps1/);
});
test('launcher documents the known incomplete retail-asset set instead of faking compatibility',()=>{
 const docs=read('tools/native-jedi-launcher/README.md');
 assert.match(docs,/not a verified complete installation/);
 assert.match(docs,/cannot be guaranteed/);
 assert.match(docs,/Google Drive OAuth/);
 assert.match(docs,/source-code tree/);
});
