/* eslint-disable */
// 2D overlay: health / force bars, power chips, saber style, live animation names, messages, enemy bars, help.
import { POWERS, POWER_BY_ID, FORCE_DUR, FORCE_HOTKEY_LABELS } from './force.js';
import { STYLE_NAMES } from './saber.js';

const STYLE_COL = ['', '#7fd3ff', '#b6ff8a', '#ff9a6a'];
const rr = (x, a, b, c, d, r) => { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + c, b, a + c, b + d, r); x.arcTo(a + c, b + d, a, b + d, r); x.arcTo(a, b + d, a, b, r); x.arcTo(a, b, a + c, b, r); x.closePath(); };
export const HELP = [
  ['Move', 'W A S D  (Shift = walk)'], ['Look / camera', 'Mouse (click to lock; hover-look if blocked) · arrows if needed · wheel zoom'], ['Crouch', 'Hold C'], ['Roll', 'C while running'],
  ['Jump / Force Jump', 'Space  (hold Space = Force Jump, J = jump level 1-3)'], ['Saber on / off', 'R  (draw from thigh, ignite)'], ['Saber attack', 'Left mouse  (+ W/A/S/D picks the swing)'],
  ['Saber stance', 'Tab cycles Fast / Medium / Strong'], ['Saber throw', 'Right mouse (hold)'], ['Quick cast', '1 Push · 2 Pull · 3 Grip · 4 Lightning · 5 Heal'], ['More quick casts', '6 Speed · 7 Mind Trick · 8 Rage · 9 Protect · 0 Absorb'],
  ['Force selector', 'Mouse wheel chooses · F uses highlighted ability (hold to channel)'], ['More Force', 'Drain · Sight · Team Heal · Team Energize via selector'], ['Respawn · Controls · Debug · Mute', 'Enter · F1 · F3 · M'],
];
export const HELP_DUEL = [
  ['Move · look', 'W A S D (Shift = walk)  ·  mouse  ·  C crouch / roll'], ['Jump / Force Jump', 'Space  (hold Space = Force Jump)'],
  ['Saber on / off · stance', 'R toggles saber  ·  Tab cycles Fast / Medium / Strong'], ['Saber attack · throw', 'Left mouse (look up/down to direct slash) · hold right mouse to guide throw'],
  ['Force menu', 'Mouse wheel or [ ] selects highlighted Force power'], ['Cast highlighted Force', 'F to cast  ·  hold F for Grip / Lightning / Heal / Drain'],
  ['Quick cast 1–5', '1 Push · 2 Pull · 3 Grip · 4 Lightning · 5 Heal'], ['Quick cast 6–0', '6 Speed · 7 Mind Trick · 8 Rage · 9 Protect · 0 Absorb'], ['Other Force powers', 'Drain and Sight available with wheel + F'],
  ['Break a Grip', 'press 1 (Push), 2 (Pull), 0 (Absorb) or select one with wheel + F'], ['Block a push / pull', 'stand still on the ground with Force left, not mid-swing; moving = weaker'],
  ['Zoom · rematch · controls · mute', 'Ctrl + wheel or - = · Enter · F1 · M'],
];
export class HUD {
  constructor(canvas) { this.c = canvas; this.x = canvas.getContext('2d'); this.msgs = []; this.help = true; this.debug = true; this.dmg = 0; this.heal = 0; this.W = 1; this.H = 1; this.dpr = 1; this.hint = 1; this.flash = 0; this.banners = []; this.helpW = 640; this.helpList = HELP; this.title = 'JEDI OUTCAST · EXPLORER'; this.subtitle = 'Ghoul2 _humanoid rig  ·  original Jedi Outcast animations  ·  click to play'; }
  banner(text, col = [1, 1, 1], life = 1.5) { const last = this.banners[this.banners.length - 1]; if (last && last.t === text && last.life > life * 0.35) { last.life = life; return; } this.banners.push({ t: text, col, life, max: life }); if (this.banners.length > 3) this.banners.shift(); }
  msg(t) { if (this.msgs.length && this.msgs[this.msgs.length - 1].t === t) { this.msgs[this.msgs.length - 1].life = 3; return; } this.msgs.push({ t, life: 3.2 }); if (this.msgs.length > 5) this.msgs.shift(); }
  hit(d) { this.dmg = Math.min(1, this.dmg + 0.25 + d * 0.02); }
  resize() { const dpr = Math.min(window.devicePixelRatio || 1, 2); const w = this.c.clientWidth, h = this.c.clientHeight; if (this.c.width !== Math.floor(w * dpr) || this.c.height !== Math.floor(h * dpr)) { this.c.width = Math.floor(w * dpr); this.c.height = Math.floor(h * dpr); } this.W = w; this.H = h; this.dpr = dpr; }
  project(R, p) { const m = R.vp; const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12], y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13], w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15]; if (w <= 0.05) return null; return [(x / w * 0.5 + 0.5) * this.W, (1 - (y / w * 0.5 + 0.5)) * this.H, w]; }
  bar(x, X, Y, W, H, k, col, label) {
    x.fillStyle = 'rgba(8,10,20,0.62)'; rr(x, X, Y, W, H, H / 2); x.fill(); x.save(); rr(x, X, Y, W, H, H / 2); x.clip(); const g = x.createLinearGradient(X, 0, X + W, 0); g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    x.fillStyle = g; x.fillRect(X, Y, W * Math.max(0, Math.min(1, k)), H); x.restore(); x.strokeStyle = 'rgba(190,210,255,0.35)'; x.lineWidth = 1; rr(x, X + .5, Y + .5, W - 1, H - 1, H / 2); x.stroke();
    if (label) { x.fillStyle = '#fff'; x.font = '600 11px system-ui,sans-serif'; x.textBaseline = 'middle'; x.fillText(label, X + 10, Y + H / 2 + 1); }
  }
  draw(g, dt) {
    this.resize(); const x = this.x, W = this.W, H = this.H, dpr = this.dpr, P = g.player, F = g.force; x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
    this.dmg = Math.max(0, this.dmg - dt * 1.4); this.heal = P.healFlash > 0 ? Math.min(1, P.healFlash) : Math.max(0, this.heal - dt * 2); if (P.healFlash > 0) P.healFlash = Math.max(0, P.healFlash - dt);
    for (const m of this.msgs) m.life -= dt; this.msgs = this.msgs.filter(m => m.life > 0);
    // vignettes
    const low = P.hp / P.maxHp < 0.3 && P.status !== 'dead' ? 0.25 + 0.15 * Math.sin(g.t * 6) : 0; const v = Math.max(this.dmg * 0.6, low);
    if (v > 0.01) { const gr = x.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.85); gr.addColorStop(0, 'rgba(160,0,0,0)'); gr.addColorStop(1, `rgba(190,10,10,${v})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
    if (this.heal > 0.01) { const gr = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.9); gr.addColorStop(0, 'rgba(0,200,90,0)'); gr.addColorStop(1, `rgba(30,230,110,${this.heal * 0.3})`); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
    if (F.active.see) { x.fillStyle = 'rgba(40,200,255,0.07)'; x.fillRect(0, 0, W, H); }
    if (F.active.rage) { const gr = x.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.9); gr.addColorStop(0, 'rgba(255,0,0,0)'); gr.addColorStop(1, 'rgba(255,40,10,0.28)'); x.fillStyle = gr; x.fillRect(0, 0, W, H); }
    // enemy / ally bars
    for (const n of g.npcs) {
      if (n.status === 'dead' && !F.active.see) continue; if (g.duel && !F.active.see) continue; const hp = n.headPos(); const s = this.project(g.R, [hp[0], hp[1] + 0.35, hp[2]]); if (!s) continue; if (s[0] < -50 || s[0] > W + 50 || s[1] < -50 || s[1] > H + 50) continue;
      const d = Math.hypot(n.pos[0] - P.pos[0], n.pos[2] - P.pos[2]); if (d > 26 && !F.active.see) continue; const sc = Math.max(0.55, Math.min(1.1, 9 / (s[2] + 4)));
      const col = n.team === 'ally' ? ['#2bd96b', '#8dffb7'] : ['#d92b2b', '#ff8f6a']; const w = 54 * sc; x.globalAlpha = n.status === 'dead' ? 0.35 : 0.95;
      this.bar(x, s[0] - w / 2, s[1] - 14 * sc, w, 5 * sc + 1, n.hp / n.maxHp, col);
      x.fillStyle = n.team === 'ally' ? '#bfffd6' : '#ffd0c8'; x.font = `600 ${Math.round(10 * sc + 1)}px system-ui,sans-serif`; x.textAlign = 'center'; x.textBaseline = 'bottom'; x.fillText(n.label, s[0], s[1] - 16 * sc); x.textAlign = 'left';
      if (F.active.see) { x.strokeStyle = 'rgba(80,220,255,0.9)'; x.lineWidth = 1.5; x.beginPath(); x.moveTo(s[0], s[1] + 4 * sc); x.lineTo(s[0] + 6 * sc, s[1] + 10 * sc); x.lineTo(s[0], s[1] + 16 * sc); x.lineTo(s[0] - 6 * sc, s[1] + 10 * sc); x.closePath(); x.stroke(); }
      x.globalAlpha = 1;
    }
    // crosshair
    const cx = W / 2, cy = H / 2; const ready = !P.saber.holstered; x.strokeStyle = 'rgba(210,230,255,0.75)'; x.lineWidth = 1.5; x.beginPath(); x.arc(cx, cy, 7, 0, 7); x.stroke(); x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(cx - 1, cy - 1, 2, 2);
    // bars bottom-left
    const bx = 22, by = H - 62; this.bar(x, bx, by, 250, 18, P.hp / P.maxHp, ['#c01818', '#ff6a4a'], 'HEALTH  ' + Math.ceil(P.hp)); this.bar(x, bx, by + 26, 250, 18, F.fp / F.max, ['#1f5fd6', '#6fd2ff'], 'FORCE  ' + Math.floor(F.fp));
    // power chips bottom-center
    const chips = g.duel ? F.list.map(id => POWER_BY_ID[id]) : POWERS; const chip = 64, gap = 6; const perRow = W < 1280 ? (g.duel ? 6 : 7) : (g.duel ? 12 : 14); const rows = Math.ceil(chips.length / perRow); const totalW = Math.min(perRow, chips.length) * (chip + gap) - gap; const sx = Math.max(300, (W - totalW) / 2 + (W > 1280 ? 120 : 130)); void sx;
    const x0 = Math.min(W - totalW - 16, Math.max(bx + 270, (W - totalW) / 2)); const y0 = H - 18 - rows * (46 + gap) + gap;
    const selId = g.duel ? F.selId() : null;
    chips.forEach((pw, i) => {
      const r = Math.floor(i / perRow), c = i % perRow; const X = x0 + c * (chip + gap), Y = y0 + r * (46 + gap); const act = F.active[pw.id], hold = F.holding === pw.id, afford = F.fp >= pw.cost;
      x.fillStyle = hold ? 'rgba(60,110,200,0.85)' : act ? 'rgba(40,120,110,0.8)' : 'rgba(8,10,22,0.62)'; rr(x, X, Y, chip, 46, 7); x.fill(); x.strokeStyle = hold || act ? '#9fe8ff' : afford ? 'rgba(160,190,255,0.38)' : 'rgba(255,90,90,0.4)'; x.lineWidth = hold || act ? 2 : 1; rr(x, X + .5, Y + .5, chip - 1, 45, 7); x.stroke();
      x.fillStyle = afford ? '#fff' : '#ff9b9b'; x.font = '700 15px system-ui,sans-serif'; x.textBaseline = 'top'; x.fillText(FORCE_HOTKEY_LABELS[pw.id] ?? '↕', X + 7, Y + 5);
      x.font = '10.5px system-ui,sans-serif'; x.fillStyle = afford ? '#cfe0ff' : '#e99'; x.fillText(pw.name.replace('Force ', ''), X + 7, Y + 25); x.textAlign = 'right'; x.fillStyle = '#8fb4ff'; x.font = '10px system-ui,sans-serif'; x.fillText(pw.hold ? pw.cost + '/s' : String(pw.cost), X + chip - 6, Y + 7); x.textAlign = 'left';
      if (act) { const t = (F.active[pw.id].until - g.t) / (FORCE_DUR[pw.id] || 10); x.fillStyle = '#9fe8ff'; x.fillRect(X + 5, Y + 41, (chip - 10) * Math.max(0, t), 2); }
      if (pw.id === selId) { x.strokeStyle = '#ffd76a'; x.lineWidth = 2.5; rr(x, X - 1, Y - 1, chip + 2, 48, 8); x.stroke(); x.fillStyle = 'rgba(255,215,106,0.14)'; rr(x, X, Y, chip, 46, 7); x.fill(); }
    });
    if (g.duel) { const sp = POWER_BY_ID[selId]; x.textAlign = 'center'; x.font = '600 12px system-ui,sans-serif'; x.textBaseline = 'bottom'; x.fillStyle = F.selShow > 0 ? '#ffe9a8' : '#9fb4e0'; x.fillText(sp.name.toUpperCase() + (sp.hold ? '  (hold)' : '') + '   ·   F = use   ·   wheel or [ ] = switch power', x0 + totalW / 2, y0 - 6); x.textAlign = 'left'; }
    // A temporary, readable Force selector shows the highlighted power after each wheel movement.
    if (g.duel && F.selShow > 0 && !this.help && selId) {
      const n = F.list.length, prev = POWER_BY_ID[F.list[(F.sel + n - 1) % n]], next = POWER_BY_ID[F.list[(F.sel + 1) % n]], current = POWER_BY_ID[selId];
      const boxW = Math.min(500, W - 32), boxX = (W - boxW) / 2, boxY = Math.max(106, H * 0.70 - 22);
      x.save(); x.globalAlpha = Math.min(1, F.selShow * 1.9);
      x.fillStyle = 'rgba(6,15,31,0.90)'; rr(x, boxX, boxY, boxW, 56, 12); x.fill();
      x.strokeStyle = '#9bdafa'; x.lineWidth = 1.5; rr(x, boxX + .5, boxY + .5, boxW - 1, 55, 12); x.stroke();
      x.textAlign = 'center'; x.textBaseline = 'top';
      x.fillStyle = '#899fbe'; x.font = '11px system-ui,sans-serif';
      x.fillText('‹ ' + prev.name.replace('Force ', ''), boxX + boxW * 0.18, boxY + 22);
      x.fillText(next.name.replace('Force ', '') + ' ›', boxX + boxW * 0.82, boxY + 22);
      x.fillStyle = '#fff'; x.font = '700 14px system-ui,sans-serif'; x.fillText(current.name.toUpperCase(), boxX + boxW / 2, boxY + 10);
      x.fillStyle = '#ffd479'; x.font = '700 11px system-ui,sans-serif'; x.fillText('F TO CAST' + (current.hold ? ' · HOLD F' : ''), boxX + boxW / 2, boxY + 33);
      x.textAlign = 'left'; x.restore();
    }
    // saber / style panel (top-left)
    const S = P.saber; x.font = '600 12px system-ui,sans-serif'; x.textBaseline = 'top'; let ty = 16;
    x.fillStyle = 'rgba(8,10,22,0.6)'; rr(x, 14, 10, 330, this.debug ? 118 : 44, 9); x.fill();
    x.fillStyle = S.holstered ? '#9aa6c8' : '#fff'; x.fillText(S.holstered ? 'SABER  holstered   [R] draw' : 'SABER  ignited   [R] holster', 26, ty); ty += 18;
    x.fillStyle = STYLE_COL[S.level]; x.fillText('STYLE  ' + STYLE_NAMES[S.level] + '   [Tab] change stance', 26, ty); ty += 18;
    if (this.debug) {
      x.font = '11px ui-monospace,Menlo,Consolas,monospace'; x.fillStyle = '#9fd0ff'; const a = P.actor; const tn = a.torsoFollow || !a.torso.cur ? '(follows legs)' : a.torso.name;
      x.fillText('legs   ' + a.legs.name, 26, ty); ty += 15; x.fillText('torso  ' + tn, 26, ty); ty += 15; x.fillText('move   ' + g.saberData.moves[S.move].ls + '   chain ' + S.chain + '   jump lvl ' + P.jumpLevel, 26, ty); ty += 15; x.fillText('state  ' + P.status + (P.ducked ? ' · crouched' : '') + '   ' + g.fps.toFixed(0) + ' fps', 26, ty);
    }
    // messages
    x.textAlign = 'center'; x.font = '600 14px system-ui,sans-serif'; this.msgs.forEach((m, i) => { const a = Math.min(1, m.life); x.globalAlpha = a; x.fillStyle = 'rgba(8,10,22,0.55)'; const tw = x.measureText(m.t).width + 24; const my = g.duel ? 92 : 58; rr(x, W / 2 - tw / 2, my + i * 28, tw, 24, 12); x.fill(); x.fillStyle = '#e6f0ff'; x.textBaseline = 'middle'; x.fillText(m.t, W / 2, my + 12 + i * 28); }); x.globalAlpha = 1; x.textAlign = 'left';
    // kills
    x.textAlign = 'right'; x.fillStyle = '#9aa6c8'; x.font = '12px system-ui,sans-serif'; x.textBaseline = 'top'; x.fillText(g.duel ? 'reflected ' + g.combat.reflected + '   ·   F1 = controls' : 'defeated ' + g.combat.kills + ' · reflected ' + g.combat.reflected + '   ·   F1 = controls', W - 18, 16); x.textAlign = 'left';
    // pointer lock hint
    if (!g.input.locked && !this.help && g.started) { x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '600 13px system-ui,sans-serif'; const tw = x.measureText('Click to capture the mouse').width + 28; x.fillStyle = 'rgba(8,10,22,0.72)'; rr(x, W / 2 - tw / 2, H * 0.62 + 20, tw, 26, 13); x.fill(); x.fillStyle = '#dfeaff'; x.fillText('Click to capture the mouse', W / 2, H * 0.62 + 33); x.textAlign = 'left'; }
    if (g.duel) this.drawDuel(g, x, W, H, dt);
    else if (P.status === 'dead') { x.fillStyle = 'rgba(30,0,0,0.5)'; x.fillRect(0, 0, W, H); x.fillStyle = '#ffd8d0'; x.textAlign = 'center'; x.font = '700 34px system-ui,sans-serif'; x.fillText('You have fallen', W / 2, H * 0.42); x.font = '16px system-ui,sans-serif'; x.fillText('Press Enter to rise again', W / 2, H * 0.42 + 44); x.textAlign = 'left'; }
    if (this.help) this.drawHelp(x, W, H);
  }
  // duel overlay: boss HP / Force bars, banners, grip prompt, round intro / result
  drawDuel(g, x, W, H, dt) {
    const B = g.boss, P = g.player, R = g.round, BF = B && B.force;
    if (B) {
      const pw = Math.min(380, W - 40), px = Math.max(W < 1100 ? 360 : 0, (W - pw) / 2), py = 12; // keep clear of the saber panel on narrow screens
      x.fillStyle = 'rgba(8,6,14,0.62)'; rr(x, px - 10, py - 4, pw + 20, 58, 10); x.fill();
      x.textAlign = 'center'; x.textBaseline = 'top'; x.font = '700 13px system-ui,sans-serif'; x.fillStyle = B.status === 'dead' ? '#8a8a96' : '#ff9a90'; x.fillText(B.label.toUpperCase(), W / 2, py);
      this.bar(x, px, py + 17, pw, 14, Math.max(0, B.hp) / B.maxHp, ['#8e1010', '#ff5a3a'], null);
      this.bar(x, px, py + 36, pw, 8, BF.fp / BF.max, ['#2b3fa8', '#7ab8ff'], null);
      x.font = '600 10px system-ui,sans-serif'; x.fillStyle = '#fff'; x.textAlign = 'right'; x.fillText(Math.ceil(Math.max(0, B.hp)) + ' / ' + B.maxHp, px + pw - 8, py + 19);
      const tags = []; for (const id of Object.keys(BF.active)) tags.push(POWER_BY_ID[id].name.replace('Force ', '').toUpperCase()); if (BF.holding) tags.push(BF.holding.toUpperCase()); if (B.status === 'gripped') tags.push('GRIPPED');
      if (tags.length) { x.textAlign = 'left'; x.font = '700 9.5px system-ui,sans-serif'; let tx = px; for (const t of tags) { const w = x.measureText(t).width + 12; x.fillStyle = 'rgba(255,120,100,0.22)'; rr(x, tx, py + 49, w, 14, 7); x.fill(); x.fillStyle = '#ffd0c8'; x.fillText(t, tx + 6, py + 52); tx += w + 4; } }
      x.textAlign = 'left';
    }
    // banners (blocked / absorbed / grip broken ...)
    for (const b of this.banners) b.life -= dt; this.banners = this.banners.filter(b => b.life > 0);
    this.banners.forEach((b, i) => {
      const k = Math.min(1, b.life / Math.min(0.5, b.max)), pop = 1 + 0.18 * Math.max(0, (b.life - (b.max - 0.18)) / 0.18);
      x.save(); x.globalAlpha = k; x.translate(W / 2, H * 0.24 + i * 38); x.scale(pop, pop); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 ' + (i === this.banners.length - 1 ? 26 : 20) + 'px system-ui,sans-serif';
      x.lineWidth = 5; x.strokeStyle = 'rgba(0,0,0,0.55)'; x.strokeText(b.t, 0, 0); x.fillStyle = `rgb(${b.col.map(v => Math.round(v * 255)).join(',')})`; x.fillText(b.t, 0, 0); x.restore();
    });
    x.textAlign = 'left';
    if (P.status === 'gripped') { x.textAlign = 'center'; x.font = '700 15px system-ui,sans-serif'; x.fillStyle = 'rgba(255,200,170,' + (0.75 + 0.25 * Math.sin(g.t * 9)) + ')'; x.textBaseline = 'bottom'; x.fillText('GRIPPED!  1 Push · 2 Pull · 0 Absorb (or select with wheel + F)', W / 2, H * 0.62); x.textAlign = 'left'; }
    if (R.state === 'intro' && !this.help) { const k = Math.max(0, 1 - R.t / 2.2); if (k > 0) { x.save(); x.globalAlpha = Math.min(1, k * 1.6); x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '800 44px system-ui,sans-serif'; x.lineWidth = 6; x.strokeStyle = 'rgba(0,0,0,0.6)'; x.strokeText('DARK JEDI', W / 2, H * 0.34); x.fillStyle = '#ff6a58'; x.fillText('DARK JEDI', W / 2, H * 0.34); x.font = '600 16px system-ui,sans-serif'; x.fillStyle = '#e8d8ff'; x.fillText('Same Force powers · same rules · break his Grip, answer his Push', W / 2, H * 0.34 + 38); x.restore(); } }
    if (R.state === 'won' || R.state === 'lost') {
      const won = R.state === 'won', a = Math.min(1, R.t / 0.8); x.fillStyle = won ? `rgba(0,20,10,${0.35 * a})` : `rgba(30,0,0,${0.5 * a})`; x.fillRect(0, 0, W, H);
      x.save(); x.globalAlpha = a; x.textAlign = 'center'; x.fillStyle = won ? '#c8ffd8' : '#ffd8d0'; x.font = '800 40px system-ui,sans-serif'; x.fillText(won ? 'VICTORY' : 'You have fallen', W / 2, H * 0.42); x.font = '16px system-ui,sans-serif';
      x.fillText(won ? 'The Dark Jedi is defeated' : 'The Dark Jedi stands victorious', W / 2, H * 0.42 + 38); if (R.t > 0.8) x.fillText('Press Enter for a rematch', W / 2, H * 0.42 + 70); x.restore(); x.textAlign = 'left';
    }
  }
  drawHelp(x, W, H) {
    const HL = this.helpList; const bw = Math.min(this.helpW || 640, W - 24), bh = Math.min(HL.length * 24 + 112, H - 24), X = (W - bw) / 2, Y = (H - bh) / 2;
    x.fillStyle = 'rgba(5,7,16,0.86)'; rr(x, X, Y, bw, bh, 14); x.fill(); x.strokeStyle = 'rgba(140,180,255,0.45)'; x.lineWidth = 1; rr(x, X + .5, Y + .5, bw - 1, bh - 1, 14); x.stroke();
    x.textAlign = 'center'; x.fillStyle = '#fff'; x.font = '700 20px system-ui,sans-serif'; x.textBaseline = 'top'; x.fillText(this.title, W / 2, Y + 16); x.fillStyle = '#9fb8ff'; x.font = '12px system-ui,sans-serif'; x.fillText(this.subtitle, W / 2, Y + 44); x.textAlign = 'left';
    x.font = '13px system-ui,sans-serif'; HL.forEach((h, i) => { const yy = Y + 74 + i * 24; x.fillStyle = '#8fb4ff'; x.fillText(h[0], X + 24, yy); x.fillStyle = '#e8f0ff'; x.fillText(h[1], X + Math.min(this.helpW > 700 ? 250 : 230, bw * 0.34), yy); });
    x.textAlign = 'center'; x.fillStyle = '#ffd76a'; x.fillText('Press F1, click, or use WASD to resume', W / 2, Y + bh - 26); x.textAlign = 'left';
  }
}
