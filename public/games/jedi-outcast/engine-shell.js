// SPDX-License-Identifier: GPL-2.0
// Adapted from Virtastic jk2-web v1.1.0. See NOTICE.md and SOURCE.json.

var load = document.getElementById('load');
var ldStatus = document.getElementById('ld-status');
var ldDetail = document.getElementById('ld-detail');
var ldFill   = document.getElementById('ld-fill');
let booted = false;

// Drive the bar as a REAL percentage whenever the caller knows its byte counts. Anything that
// only writes a line of text leaves the bar sweeping its indeterminate animation, and on a
// ~626MB retail load that is indistinguishable from a hang.
function setProgress(done, total, label, detail){
  if (label && ldStatus) ldStatus.textContent = label;
  if (detail != null && ldDetail) ldDetail.textContent = detail;
  if (!(total > 0)) return;
  load.classList.remove('indet');
  if (ldFill) ldFill.style.width = Math.max(2, Math.min(100, (done / total) * 100)) + '%';
}
// Text-only path (Module.setStatus and the non-streaming staging fallback). Emscripten hands
// over strings like "Downloading data... (1234/56789)", so pull the counts out when present.
function setLoading(t){
  if (!t) return;
  var m = /\(?([\d.]+)\s*\/\s*([\d.]+)\)?/.exec(t);
  if (m && parseFloat(m[2]) > 0) setProgress(parseFloat(m[1]), parseFloat(m[2]), null, t);
  else if (ldDetail) ldDetail.textContent = t;
}
// A fatal must not keep spinning — that reads as "still working" and people wait forever.
function setFatal(t){
  load.classList.add('err');
  load.classList.remove('indet');
  if (ldStatus) ldStatus.textContent = 'Could not start';
  if (ldDetail) ldDetail.textContent = t;
}
function hideLoading(){ load.classList.add('hide'); setTimeout(function(){ load.remove(); }, 700); }

window.__JK2_GAMEDIR = 'base';
window.__JK2_PAKS = [];
var __argParam = null;

var Module = {
  canvas: document.getElementById('canvas'),
  arguments: __argParam ? __argParam.split(/\s+/).filter(Boolean) : [],
  // Route through the same hoisted handlers the ring installs below (see "Console
  // hygiene"). They used to differ -- this literal wrote straight to console.log/warn while
  // a later assignment replaced them with the ring versions -- and emscripten captures
  // printErr once, early, so exactly which one a given line took was a race. In practice one
  // of the two GL-emulation banners went to the ring and the other to console.warn. Same
  // function in both places, no race.
  print:    (t)=>__idt3_print(t),
  printErr: (t)=>__idt3_printErr(t),
  setStatus: setLoading,
  onFatal: (t)=>{ setFatal(t); },
  preRun: [function(){
    // ── Persistence ─────────────────────────────────────────────────────────────────────
    // JK2 has NO fs_homepath either — the string appears nowhere in its source (checked
    // independently of JKA, same result). Savegames go to "saves/<name>.sav" relative to the
    // gamedir (sv_savegame.cpp:114) and the config to <gamedir>/jk2config.cfg
    // (common.cpp:1979), i.e. /jk2/base/. Setting ENV.HOME and mounting IDBFS at /userdata
    // persisted nothing; both were written to plain MEMFS and lost on reload.
    //
    // /jk2/base itself cannot be the mount point — the staged paks live there and IDBFS would
    // try to push ~626MB of retail assets into IndexedDB.
    FS.mkdirTree('/userdata');
    FS.mount(IDBFS, {}, '/userdata');
    FS.mkdirTree('/jk2');
    FS.mkdirTree('/jk2/base');            // BASEGAME
    FS.mkdirTree('/jk2/demo');            // DEMOGAME — where the free demo's pak lives
    FS.mkdirTree('/jk2/base/saves');
    FS.mount(IDBFS, {}, '/jk2/base/saves');
    FS.mkdirTree('/jk2/demo/saves');
    FS.mount(IDBFS, {}, '/jk2/demo/saves');
    addRunDependency('idbfs-restore');
    FS.syncfs(true, function(err){
      if (err) console.warn('IDBFS restore failed', err);
      // Must land before Com_Init execs jk2config.cfg (common.cpp:1836).
      try { __restoreCfg(); } catch (e) { console.warn('config restore failed', e); }
      removeRunDependency('idbfs-restore');
    });
    // Mount staged paks + the SP game side module. JK2/JKA SP link cgame+ui
    // into the exe, so the game DLL is the only separate module.
    // Streamed, not buffered: a retail install is ~626MB across assets0/1/2/5, and
    // `FS.writeFile(dst, new Uint8Array(await r.arrayBuffer()))` holds every pak TWICE at
    // peak — once as the response buffer, once as MEMFS's own copy. Read the body into one
    // exactly-sized array and hand that array to MEMFS with canOwn=1 so MEMFS adopts it
    // instead of copying. Streaming also yields real byte progress for the loading screen.
    var __gd = window.__JK2_GAMEDIR || 'base';
    var __remote = (window.__JK2_REMOTE_PAKS || []).map(function(p){
      return [null, '/jk2/' + __gd, p.name, Number(p.size || 0), p.chunks || []];
    });
    var __files = (__remote.length
      ? __remote
      : (window.__JK2_PAKS || []).map(function(n){ return ['' + __gd + '/' + n, '/jk2/' + __gd, n, 0, null]; }))
      .concat([['qagame.wasm', '/jk2', 'qagame.wasm', 0, null]]);
    var __MB = function(b){ return (b / 1048576).toFixed(1); };
    // Every pak is fetched CONCURRENTLY, so a per-file percentage makes the bar jump backwards
    // each time another file reports. Accumulate across all of them and show one honest total.
    // Files whose headers have not arrived yet contribute 0 to both sides, so the total grows
    // as they land rather than starting wrong.
    var __got = {}, __need = {};
    function __reportProgress(){
      var done = 0, total = 0, n = 0;
      for (var k in __need){ total += __need[k]; done += (__got[k] || 0); n++; }
      setProgress(done, total, 'Loading game data',
        __MB(done) + ' / ' + __MB(total) + ' MB · ' + n + ' file' + (n === 1 ? '' : 's'));
    }
    async function __stage(url, dstDir, name, idx, expectedSize, chunks){
      var label = name + ' (' + (idx + 1) + ' of ' + __files.length + ')';
      var buf;

      if (chunks && chunks.length) {
        var total = Number(expectedSize || 0);
        if (!(total > 0)) throw new Error(name + ': canonical archive size is missing');
        __need[name] = total; __got[name] = 0; __reportProgress();
        buf = new Uint8Array(total);

        for (var ci = 0; ci < chunks.length; ci++) {
          var chunk = chunks[ci];
          var chunkOffset = Number(chunk.offset || 0);
          var chunkSize = Number(chunk.size || 0);
          if (!(chunkSize > 0) || chunkOffset < 0 || chunkOffset + chunkSize > total) {
            throw new Error(name + ': invalid cached chunk ' + ci);
          }

          var cr = await fetch(chunk.url, { redirect: 'follow' });
          if (!cr.ok) throw new Error(name + ' chunk ' + (ci + 1) + ': HTTP ' + cr.status);

          var local = 0;
          if (cr.body && cr.body.getReader) {
            var rd = cr.body.getReader(), c;
            while (!(c = await rd.read()).done) {
              if (local + c.value.length > chunkSize) {
                throw new Error(name + ' chunk ' + (ci + 1) + ': response exceeds cached chunk size');
              }
              buf.set(c.value, chunkOffset + local);
              local += c.value.length;
              __got[name] = Math.max(__got[name] || 0, chunkOffset + local);
              __reportProgress();
            }
          } else {
            var part = new Uint8Array(await cr.arrayBuffer());
            local = part.byteLength;
            if (local > chunkSize) throw new Error(name + ' chunk ' + (ci + 1) + ': response exceeds cached chunk size');
            buf.set(part, chunkOffset);
            __got[name] = Math.max(__got[name] || 0, chunkOffset + local);
            __reportProgress();
          }

          if (local !== chunkSize) {
            throw new Error(name + ' chunk ' + (ci + 1) + ': short read (' + local + ' of ' + chunkSize + ')');
          }
        }

        if ((__got[name] || 0) !== total) {
          throw new Error(name + ': reconstructed archive is incomplete (' + (__got[name] || 0) + ' of ' + total + ')');
        }
      } else {
        var r = await fetch(url, { redirect: 'follow' });
        if (!r.ok) throw new Error(name + ': HTTP ' + r.status);
        var len = parseInt(r.headers.get('Content-Length') || '0', 10) || Number(expectedSize || 0);
        if (expectedSize > 0 && len > 0 && len !== expectedSize) {
          throw new Error(name + ': source size changed (' + len + ' vs expected ' + expectedSize + ')');
        }

        if (len > 0 && r.body && r.body.getReader) {
          __need[name] = len; __got[name] = 0; __reportProgress();
          buf = new Uint8Array(len);
          var reader = r.body.getReader(), off = 0, packet;
          while (!(packet = await reader.read()).done) {
            if (off + packet.value.length > len) { off = -1; break; }
            buf.set(packet.value, off); off += packet.value.length;
            __got[name] = off; __reportProgress();
          }
          if (off !== len) throw new Error(name + ': short read (' + off + ' of ' + len + ')');
        } else {
          setLoading('loading ' + label + '…');
          buf = new Uint8Array(await r.arrayBuffer());
        }
      }

      FS.createDataFile(dstDir, name, buf, true, false, true);
    }
    __files.forEach(function(f, i){
      var url = f[0], name = f[2], dependency = 'pre:' + name;
      addRunDependency(dependency);
      __stage(url, f[1], name, i, f[3], f[4]).then(function(){
        removeRunDependency(dependency);
      }).catch(function(e){
        // Staging failures used to warn and drop the dependency, so the engine booted on top
        // of missing data and died later somewhere unrelated. Fail loudly, here.
        console.error('staging failed:', e.message);
        try { Module.onFatal && Module.onFatal(e.message); } catch (_){}
      });
    });
  }],
  onRuntimeInitialized: function(){
    // Engine drives its own frame loop via emscripten_set_main_loop.
    booted = true;
    var c = Module.canvas || document.getElementById('canvas');
    if (c) {
      c.style.setProperty('width', '100vw', 'important');
      c.style.setProperty('height', '100vh', 'important');
      c.style.setProperty('object-fit', 'contain', 'important');
      try { c.focus({ preventScroll: true }); } catch (_) { try { c.focus(); } catch (_) {} }
    }
    if (parent !== window) {
      parent.postMessage({type:'atom-jedi-status', state:'engine-ready'}, location.origin);
      parent.postMessage({
        type: 'atom-jedi-video',
        cssWidth: innerWidth || 0,
        cssHeight: innerHeight || 0,
        canvasWidth: c ? c.width : 0,
        canvasHeight: c ? c.height : 0,
        clientWidth: c ? c.clientWidth : 0,
        clientHeight: c ? c.clientHeight : 0,
        devicePixelRatio: window.devicePixelRatio || 1
      }, location.origin);
    }
    setTimeout(hideLoading, 300);
    // Fullscreen is the game's native presentation and is not discoverable otherwise.
    setTimeout(function(){ __toast('Click the game for mouse look · WASD to move · Alt+Enter fullscreen', 5000); }, 1800);
  }
};

// Flush persistence periodically and on tab hide/close.
// ── Config mirror ───────────────────────────────────────────────────────────
// jk2config.cfg lives in <gamedir>/, which cannot be an IDBFS mount point because the staged
// pak files share that directory. It is a few KB, so mirror it to /userdata (which IS IDBFS)
// instead of mounting. Saves need no mirror — /jk2/*/saves are mounted directly.
var __CFG = 'jk2config.cfg';
function __cfgGamedirs(){ return ['/jk2/base', '/jk2/demo']; }
function __restoreCfg(){
  __cfgGamedirs().forEach(function(dir){
    var src = '/userdata/cfg' + dir.replace(/\//g, '_') + '_' + __CFG;
    try {
      var data = FS.readFile(src);                     // throws if absent: nothing saved yet
      FS.writeFile(dir + '/' + __CFG, data);
    } catch (e) { /* first run */ }
  });
}
function __saveCfg(){
  __cfgGamedirs().forEach(function(dir){
    var dst = '/userdata/cfg' + dir.replace(/\//g, '_') + '_' + __CFG;
    try {
      var data = FS.readFile(dir + '/' + __CFG);       // throws until the engine writes one
      FS.writeFile(dst, data);
    } catch (e) { /* engine has not written a config yet */ }
  });
}
// Copy the config into IDBFS FIRST — syncfs only pushes what is already inside a mount.
function sync(){
  try { __saveCfg(); } catch(e){}
  try { FS.syncfs(false, function(){}); } catch(e){}
}
setInterval(()=>{ if (booted) sync(); }, 15000);
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) sync(); });
window.addEventListener('pagehide', sync);

// ── Launcher boot gate ──────────────────────────────────────────────────────
// The engine only starts when a card is chosen: the launcher is removed, the themed loading
// screen appears, and the engine script is injected. The PREVIEW plaque stays.
var __q = new URLSearchParams(location.search);
var __STAMP = 'atom-jk2-v1.1.0';

// ── Console hygiene: engine output → in-memory ring, console stays clean ───
// Engine warnings (demo-data gaps etc.) used to spam console.warn on every run. They now land
// in a 2000-line ring; genuine fatals still hit console.error + the loading-screen message.
// ?debug shows a live log panel with a download button. window.__idt3_dumpLog() from devtools.
var __LOG = [], __LOG_MAX = 2000;
var __FATAL_RE = /ERR_FATAL|Sys_Error|RuntimeError|abort\(|Aborted|could not create WebGL|out of memory/i;
function __logLine(t){
  __LOG.push(t); if (__LOG.length > __LOG_MAX) __LOG.shift();
  var p = document.getElementById('vt-logbody');
  if (p) { p.textContent += t + '\n'; if (p.textContent.length > 120000) p.textContent = p.textContent.slice(-80000); p.scrollTop = p.scrollHeight; }
}
window.__idt3_dumpLog = function(){ return __LOG.join('\n'); };
// Emscripten's GL emulation announces itself through printErr with two unconditional
// lines the moment the WebGL context is created (libglemu.js:189 and :2843):
//   "WARNING: using emscripten GL emulation. ... do not expect it to work."
//   "WARNING: using emscripten GL immediate mode emulation. This is very limited ..."
// They describe which backend is in use -- LEGACY_GL_EMULATION, which this port links on
// purpose because idTech3's renderer is fixed-function -- and say nothing about the health
// of this build. Neither is suppressible by a link flag. On an otherwise clean boot they
// were the only two lines a reader could mistake for a problem, so they are recorded on
// the informational stream with their origin instead of under the stderr "!" prefix.
// Nothing is dropped: both still appear verbatim in the log and in the F9 dump.
var __GLEMU_BANNER_RE = /^WARNING: using emscripten GL (emulation|immediate mode emulation)\b/;
// Declared as hoisted functions, not assignments, so the Module literal further up can name
// them before this block has run.
function __idt3_print(t){ __logLine(t); }
function __idt3_printErr(t){
  if (__GLEMU_BANNER_RE.test(t)) { __logLine('(gl-emulation) ' + String(t).replace(/^WARNING: /, '')); return; }
  __logLine('! ' + t);
  if (__FATAL_RE.test(t)) { console.error(t); try { Module.onFatal && Module.onFatal(t); } catch(e){} }
}
Module.print    = __idt3_print;
Module.printErr = __idt3_printErr;
// …and one of the two banners never reaches printErr at all. Traced with a CDP stack:
//   at init <engine>.js:13511  (GLEmulation.init)
//   at setupHooks / setupFuncs <engine>.js:15675
//   at (anon) <engine>.js:34168
// GLEmulation.init() runs from a top-level setupFuncs() call at line 34168, while the
// hook that adopts our handler — `if (Module["printErr"]) err = Module["printErr"];` —
// sits at line 34296, further down the same file. So at the moment that banner is printed
// `err` is still the default console.error binding. (GLImmediate.init() runs later, at
// context creation, which is why the second banner does go through printErr.)
//
// Divert exactly that one line, by content, and pass everything else through untouched.
// This is not a console silencer: any other console.error/warn still reaches devtools.
['error', 'warn'].forEach(function(k){
  var orig = console[k].bind(console);
  console[k] = function(){
    var first = arguments.length ? arguments[0] : '';
    if (typeof first === 'string' && __GLEMU_BANNER_RE.test(first)) {
      __logLine('(gl-emulation) ' + first.replace(/^WARNING: /, ''));
      return;
    }
    return orig.apply(null, arguments);
  };
});
// ── ?diag=1 — live renderer HUD, for catching artifacts on real hardware ────
// These artifacts do not reproduce in our headless captures: headless never resizes the window,
// never changes devicePixelRatio, and runs SwiftShader rather than a real driver. So let the
// player's own machine report instead. Shows fps, how many times the renderer has been
// re-initialised (a vid_restart re-uploads every texture and re-runs R_SetColorMappings, which
// on screen is a brightness flash), and how many resize-driven restarts were suppressed by the
// cooldown. F9 downloads the whole engine log so it can be read after the fact.
if (__q.has('diag')) document.addEventListener('DOMContentLoaded', function(){
  var d = document.createElement('div');
  d.id = 'vt-diag';
  d.style.cssText = 'position:fixed;right:10px;top:10px;z-index:92;padding:7px 10px;'
    + 'background:rgba(0,0,0,.72);border:1px solid var(--line);border-radius:5px;'
    + 'font:11px/1.5 ui-monospace,Menlo,monospace;color:var(--gold-hi);white-space:pre;'
    + 'pointer-events:none';
  document.body.appendChild(d);
  var n = 0, t0 = performance.now(), fps = 0;
  (function tick(){ n++; var dt = performance.now() - t0;
    if (dt >= 1000) { fps = n / (dt / 1000); n = 0; t0 = performance.now(); }
    requestAnimationFrame(tick); })();
  setInterval(function(){
    var log = (window.__idt3_dumpLog ? window.__idt3_dumpLog() : '').split('\n');
    var inits = 0, restarts = 0, suppressed = 0, last = '';
    for (var i = 0; i < log.length; i++) {
      var l = log[i];
      if (l.indexOf('Initializing Renderer') !== -1) inits++;
      if (l.indexOf('vid_restart #') !== -1) { restarts++; last = l.trim(); }
      if (l.indexOf('vid_restart cooldown') !== -1) suppressed++;
    }
    var c = document.getElementById('canvas');
    d.textContent = 'fps ' + fps.toFixed(0)
      + '\nrenderer inits ' + inits
      + '\nresize vid_restarts ' + restarts
      + '\nsuppressed (cooldown) ' + suppressed
      + '\ncanvas ' + (c ? c.width + 'x' + c.height : '-')
      + '\nwindow ' + innerWidth + 'x' + innerHeight + ' dpr ' + (devicePixelRatio || 1)
      + (last ? '\n' + last.slice(0, 46) : '')
      + '\nF9 = download engine log';
  }, 500);
  addEventListener('keydown', function(e){
    if (e.key !== 'F9') return;
    e.preventDefault();
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([window.__idt3_dumpLog ? window.__idt3_dumpLog() : ''],
                                          { type: 'text/plain' }));
    a.download = 'jk2-diag.log'; a.click();
  });
});
if (__q.has('debug')) document.addEventListener('DOMContentLoaded', function(){
  var d = document.createElement('div');
  d.id = 'vt-log';
  d.style.cssText = 'position:fixed;left:10px;bottom:52px;z-index:90;width:min(560px,90vw);height:240px;'
    + 'display:flex;flex-direction:column;background:rgba(0,0,0,.82);border:1px solid var(--line);border-radius:6px;'
    + 'font:11px/1.5 ui-monospace,Menlo,monospace;color:var(--muted)';
  d.innerHTML = '<div style="display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid var(--line)">'
    + '<b style="color:var(--ink)">engine log</b><a href="#" id="vt-logdl" style="color:var(--gold)">download</a></div>'
    + '<pre id="vt-logbody" style="flex:1;margin:0;padding:8px 10px;overflow:auto;white-space:pre-wrap"></pre>';
  document.body.appendChild(d);
  document.getElementById('vt-logdl').onclick = function(e){
    e.preventDefault();
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([__LOG.join('\n')], {type:'text/plain'}));
    a.download = 'jk2-engine.log'; a.click();
  };
});

// ── Tuned boot config (+ ?cvar= URL overrides) ──────────────────────────────
// No hardware gamma ramp in the browser, so idTech3's overbright pipeline renders DARK by
// default: bake the correction into texture/lightmap upload instead (latched cvars, applied
// pre-first-map). Widescreen: the backing store follows the viewport, so give the 3D view a
// Hor+ fov (90° vertical-equivalent at 4:3). Any ?r_*/cg_*/com_*/s_*/cl_*=v query param
// becomes a trailing +set (wins over the baseline) for A/B tuning without redeploys.
// Keep Raven's stock controls while applying the browser port's verified
// viewport projection. default.cfg is the original retail binding file from assets0.pk3.
function __tuneArgs(){
  var vw = innerWidth || document.documentElement.clientWidth || 1280;
  var vh = innerHeight || document.documentElement.clientHeight || 720;
  var dpr = Math.max(1, window.devicePixelRatio || 1);
  var rw = Math.max(320, Math.round(vw * dpr));
  var rh = Math.max(240, Math.round(vh * dpr));

  // Match the browser port's own ~4 MP safety budget, but pin the result into
  // Raven's genuine custom video mode so R_GetModeInfo, glConfig, viewport and
  // canvas backing-store all receive the SAME dimensions.
  var maxPix = 4.0e6;
  var scale = Math.sqrt(Math.min(1, maxPix / Math.max(1, rw * rh)));
  rw = Math.max(320, (Math.floor(rw * scale) >> 1) << 1);
  rh = Math.max(240, (Math.floor(rh * scale) >> 1) << 1);

  var aspect = rw / Math.max(rh, 1);
  var fov = Math.round(2 * Math.atan(Math.tan(73.74 * Math.PI / 360) * aspect) * 360 / Math.PI);
  fov = Math.min(Math.max(fov, 90), 121);

  // The user's canonical retail config and default.cfg both use the stock bindings
  // (W/A/S/D, Space, Mouse1, etc.). Re-exec the retail default binding file after
  // browser-persisted config so an earlier broken session cannot leave movement unbound.
  //
  // IMPORTANT: r_mode -1 is intentional. The current browser port overrides every
  // normal r_mode with window.innerWidth/innerHeight, which is why changing the
  // resolution in Jedi Outcast's menu appeared to do nothing.
  var a = [
    '+exec', 'default.cfg',
    '+set', 'r_mode', '-1',
    '+set', 'r_customwidth', String(rw),
    '+set', 'r_customheight', String(rh),
    '+set', 'r_customaspect', String(aspect),
    '+set', 'cg_fov', String(fov),
    '+set', 'cg_draw2D', '1',
    '+set', 'cl_freelook', '1'
  ];

  __q.forEach(function(v, k){
    if (/^(r|cg|com|s|cl)_[A-Za-z0-9_]+$/.test(k)) a.push('+set', k, v);
  });
  return a;
}

function boot(args, relay){
  if (relay) window.__IDT3_NET_RELAY = relay;
  // ?ss=N — SSAA factor consumed by the engine's viewport sizing (scales the pixel budget).
  var ss = parseFloat(__q.get('ss') || '');
  if (ss > 0 && ss <= 2) Module.__idt3_ss = ss;
  // Pre-create the AudioContext inside this click gesture at the device rate ('playback'
  // hint) — the engine's sound backend reuses it, so audio starts un-suspended and unresampled.
  try {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (AC && !Module.__idt3_audioCtx) Module.__idt3_audioCtx = new AC({ latencyHint: 'playback' });
  } catch(e){}
  Module.arguments = __tuneArgs().concat(args && args.length ? args : []);
  var l = document.getElementById('vt-launcher'); if (l) l.remove();
  var mb = document.getElementById('modal-bd'); if (mb) mb.remove();   // help sheet goes with it
  document.body.classList.add('launching');
  document.getElementById('load').style.display = 'flex';
  window.__idt3_booting = true;
  // Cache-bust the engine: the .js/.wasm are served immutable, so stale CF/browser copies
  // from an earlier deploy would otherwise keep loading. Stamp both the script URL and every
  // .wasm fetch (main engine + side modules) with this page generation's version.
  var of = window.fetch;
  window.fetch = function(u, o) {
    if (typeof u === 'string' && /\.wasm$/.test(u)) u += '?v=' + __STAMP + '';
    return of.call(window, u, o);
  };
  var s = document.createElement('script'); s.src = 'jk2.js?v=' + __STAMP; s.onerror = function(){ Module.onFatal('The original engine download failed. Reload and try again.'); }; document.body.appendChild(s);
}
// ── Lifecycle ───────────────────────────────────────────────────────────────
// Saves/config live in IDBFS — ask the browser not to LRU-evict them.
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch(e){}
// GPU context loss has no restore path under LEGACY_GL_EMULATION: flush saves, tell the
// player, reload. (Same policy as openmw-web.)
document.getElementById('canvas').addEventListener('webglcontextlost', function(ev){
  ev.preventDefault();
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;inset:0;z-index:95;display:flex;align-items:center;justify-content:center;'
    + 'background:rgba(0,0,0,.88);color:var(--ink);font:16px "Optima","Gill Sans",sans-serif';
  d.textContent = 'GPU context lost — saving and reloading\u2026';
  document.body.appendChild(d);
  var done = false, go = function(){ if (!done) { done = true; location.reload(); } };
  try { FS.syncfs(false, go); setTimeout(go, 2500); } catch(e) { go(); }
});
// ── Fullscreen: Alt+Enter ───────────────────────────────────────────────────
// Jedi Outcast is a fullscreen game and the port had no way to get there at all. F11 works
// but is browser chrome, not the page; Alt+Enter is the shortcut a PC player's hands already
// know. Registered in the CAPTURE phase at page load — i.e. before the engine installs its own
// window key listener at IN_Init — so stopImmediatePropagation() also keeps the engine from
// seeing a bare Enter and confirming whatever menu item is under the cursor during the
// transition. Entering or leaving fullscreen changes innerWidth/innerHeight, which the platform
// layer's debounced resize->vid_restart already turns into a correctly-sized backing store, so
// the render resolution follows the screen with no extra work here.
addEventListener('keydown', function(e){
  if (e.key === 'Enter' && e.altKey) {
    e.preventDefault(); e.stopImmediatePropagation();
    if (document.fullscreenElement) { document.exitFullscreen(); return; }
    var el = document.documentElement;
    var req = el.requestFullscreen || el.webkitRequestFullscreen;
    if (req) { try { var p = req.call(el); if (p && p.catch) p.catch(function(){}); } catch(_){} }
  }
}, true);
// Transient top-centre hint, reused for the fullscreen tip and the pointer-lock tip.
function __toast(text, ms){
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:70;'
    + 'background:rgba(0,0,0,.75);color:var(--muted);border:1px solid var(--line);border-radius:5px;'
    + 'padding:7px 14px;font:13px "Optima","Gill Sans",sans-serif;pointer-events:none';
  d.textContent = text;
  document.body.appendChild(d);
  setTimeout(function(){ d.remove(); }, ms || 2600);
}
// Always hand keyboard focus to the game before the C++ mouse handler requests
// pointer lock. This matters inside the Base44 editor/preview shell, where clicking the
// nested iframe does not reliably leave its canvas as the active keyboard target.
var __gameCanvas = document.getElementById('canvas');
if (__gameCanvas) {
  __gameCanvas.addEventListener('mousedown', function(){
    try { __gameCanvas.focus({ preventScroll: true }); } catch (_) { try { __gameCanvas.focus(); } catch (_) {} }
  }, true);
  __gameCanvas.addEventListener('click', function(){
    try { __gameCanvas.focus({ preventScroll: true }); } catch (_) { try { __gameCanvas.focus(); } catch (_) {} }
  }, true);
}

// Keyboard fallback for the Base44 parent shell. Native iframe key events remain the
// primary path; this only handles keys that the outer preview receives instead.
window.addEventListener('message', function(ev){
  if (ev.source !== parent || ev.origin !== location.origin || ev.data?.type !== 'atom-jedi-key') return;
  var d = ev.data || {};
  var event = new KeyboardEvent(d.eventType === 'keyup' ? 'keyup' : 'keydown', {
    key: d.key || '',
    code: d.code || '',
    repeat: !!d.repeat,
    altKey: !!d.altKey,
    ctrlKey: !!d.ctrlKey,
    shiftKey: !!d.shiftKey,
    metaKey: !!d.metaKey,
    bubbles: true,
    cancelable: true
  });
  window.dispatchEvent(event);
});

// Esc drops pointer lock; hint how to get the mouse back (the engine re-requests on click).
document.addEventListener('pointerlockchange', function(){
  var had = window.__idt3_hadlock;
  window.__idt3_hadlock = !!document.pointerLockElement;
  if (had && !document.pointerLockElement && window.__idt3_booting) {
    __toast('click to recapture the mouse');
  }
});
// ?bright=N — page-level brightness fallback (CSS filter on the canvas only).
if (__q.get('bright')) document.getElementById('canvas').style.filter = 'brightness(' + (+__q.get('bright') || 1) + ')';

