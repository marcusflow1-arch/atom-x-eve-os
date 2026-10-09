import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {findRegisteredJediArchives, collectCachedArchiveChunks, missingRegisteredJediArchives, originalArchiveManifest, REQUIRED_JEDI_ARCHIVES} from '../src/components/jedioutcast/jediArchiveSources.js';

const read=f=>readFileSync(f,'utf8');
const mb=16*1024*1024;
const source=(name,size=2*mb+23)=>({id:'id-'+name,path:'base/'+name,category:'retail_archive',drive_file_id:'drive-'+name,byte_size:size});
const stored=(name,size)=>({id:'file-'+name,path:'GameData/base/'+name,display_name:name,area:'original_asset',byte_size:size,storage_url:'https://files.example.test/'+name});

test('Game Rebuilds already stored original PK3 files are accepted without local selection',()=>{
 const originals=[source('assets0.pk3',37),source('assets1.pk3',38)];
 const admin=[stored('assets2.pk3',39),stored('assets5.pk3',40)];
 const byName=findRegisteredJediArchives(originals,admin);
 assert.deepEqual(missingRegisteredJediArchives(byName),[]);
 assert.equal(byName.get('assets0.pk3').kind,'drive');
 assert.equal(byName.get('assets2.pk3').kind,'stored');
 const manifest=originalArchiveManifest(byName,[
  {archive_asset_id:'id-assets0.pk3',status:'cached',chunk_index:0,offset:0,byte_size:37,source_size:37,storage_url:'https://store.test/0'},
  {archive_asset_id:'id-assets1.pk3',status:'cached',chunk_index:0,offset:0,byte_size:38,source_size:38,storage_url:'https://store.test/1'},
 ]);
 assert.equal(manifest.length,4);
 assert.deepEqual(manifest.map(x=>x.name),[...REQUIRED_JEDI_ARCHIVES]);
 assert.equal(manifest[2].chunks.length,1);
 assert.equal(manifest[3].chunks[0].url,'https://files.example.test/assets5.pk3');
});

test('reuses only validated cached chunk layouts and refetches incomplete archives',()=>{
 const archive={...source('assets0.pk3'),name:'assets0.pk3',kind:'drive'};
 const chunks=collectCachedArchiveChunks(archive,[
  {archive_asset_id:archive.id,archive_name:archive.name,status:'cached',chunk_index:0,offset:0,byte_size:mb,source_size:archive.byte_size,storage_url:'https://store.test/0'},
  {archive_asset_id:archive.id,status:'cached',chunk_index:1,offset:mb,byte_size:12,source_size:archive.byte_size,storage_url:'https://store.test/bad'},
 ]);
 assert.equal(chunks.length,3);
 assert.ok(chunks[0].url.endsWith('/0'));
 assert.equal(chunks[1],undefined);
 assert.equal(chunks[2],undefined);
});

test('never claims a partial Drive/Game Rebuilds archive set can start the engine',()=>{
 const onlyPatch=findRegisteredJediArchives([],[stored('assets5.pk3',550829)]);
 assert.deepEqual(missingRegisteredJediArchives(onlyPatch),['assets0.pk3','assets1.pk3','assets2.pk3']);
 assert.throws(()=>originalArchiveManifest(onlyPatch,[]),/not registered/);
});

test('new provided GOG Drive assets5 is recognized through the whitelisted backend only',()=>{
 const fn=read('base44/functions/jediOutcastSource/entry.ts');
 const runtime=read('src/components/jedioutcast/JediOutcastRuntime.jsx');
 const app=read('src/Layout.jsx');
 const chrome=read('src/components/dashboard/windows/DashboardWindow.jsx');
 assert.match(fn,/registerProvidedArchive/);
 assert.match(fn,/1uGN9pbzUvPueJVXv_vtqYE3L7xDdCrBP/);
 assert.match(fn,/getDriveToken\(base44\)/);
 assert.match(fn,/source_root_key: 'user_drive_gog_2026_10_08'/);
 assert.match(runtime,/original game data is incomplete/i);
 assert.match(runtime,/data-jedi-embedded/);
 assert.match(runtime,/state !== 'engine-ready'/);
 assert.match(runtime,/activeDashboardWindow\(\) !== 'jedi-outcast-game'/);
 assert.match(app,/captureEscape=\{false\}/);
 assert.match(app,/atom:jedi-request-window-close/);
 assert.match(runtime,/atom:jedi-request-window-close/);
 assert.match(runtime,/atom-jedi-progress/);
 assert.match(read('public/games/jedi-outcast/engine-shell.js'),/atom-jedi-progress/);
 assert.match(read('src/components/jedioutcast/jedi-outcast-window.css'),/\.jko-loading-cover/);
 assert.match(chrome,/!captureEscape \|\| event\.key !== 'Escape'/);
});
