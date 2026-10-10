/* eslint-disable */
// Port of Jedi Outcast's saber move state machine (bg_saber.c: PM_WeaponLightsaber / PM_SetSaberMove /
// PM_SaberAnimTransitionAnim / PM_SaberAttackForMovement).  Pure logic: it asks the host to play torso anims.
export const Q = { BR: 0, R: 1, TR: 2, T: 3, TL: 4, L: 5, BL: 6, B: 7 };
export const STYLE_NAMES = ['', 'FAST', 'MEDIUM', 'STRONG'];
export class SaberLogic {
  constructor(data, host) {
    this.M = data.moves; this.TR = data.transition; this.host = host;
    this.id = {}; this.M.forEach(m => this.id[m.ls] = m.id);
    const I = this.id; this.I = I;
    this.level = 2; this.move = I.LS_READY; this.weaponTime = 0; this.torsoTimer = 0; this.chain = 0;
    this.holstered = true; this.inFlight = false; this.blocked = null; this.active = false;
    this.attackStartedAt = -1; this.moveAnim = null; this.moveStart = 0; this.moveLen = 0;
    this.rageMul = 1;
  }
  // --- predicates (bg_panimate.c)
  inAttack(m) { const I = this.I; return (m >= I.LS_A_TL2BR && m <= I.LS_A_T2B) || this.inSpecial(m); }
  inSpecial(m) { const I = this.I; return m === I.LS_A_BACK || m === I.LS_A_BACK_CR || m === I.LS_A_BACKSTAB || m === I.LS_A_LUNGE || m === I.LS_A_JUMP_T__B_ || m === I.LS_A_FLIP_STAB || m === I.LS_A_FLIP_SLASH; }
  inIdle(m) { const I = this.I; return m === I.LS_NONE || m === I.LS_READY || m === I.LS_DRAW || m === I.LS_PUTAWAY; }
  inParry(m) { const I = this.I; return m >= I.LS_PARRY_UP && m <= I.LS_PARRY_LL; }
  inReflect(m) { const I = this.I; return m >= I.LS_REFLECT_UP && m <= I.LS_REFLECT_LL; }
  inTransition(m) { const I = this.I; return m >= I.LS_T1_BR__R && m <= I.LS_T1_BL__L; }
  inBounce(m) { const I = this.I; return (m >= I.LS_B1_BR && m <= I.LS_B1_BL) || (m >= I.LS_D1_BR && m <= I.LS_D1_BL); }
  inStart(m) { const I = this.I; return m >= I.LS_S_TL2BR && m <= I.LS_S_T2B; }
  isActiveSwing() { return this.inAttack(this.move) || this.inStart(this.move) || this.inTransition(this.move); }
  stanceAnim() { return this.level === 2 ? 'BOTH_STAND2' : this.level === 3 ? 'BOTH_SABERSLOW_STANCE' : 'BOTH_SABERFAST_STANCE'; }
  kataDone() { const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1)); return (this.level >= 3 && this.chain > r(0, 1)) || (this.level === 2 && this.chain > r(2, 5)); }
  // anim name for a move at the current style level
  animFor(move) {
    const m = this.M[move]; let a = m.anim; const lv = this.level;
    if (lv > 1 && !this.inIdle(move) && !this.inParry(move) && !this.inReflect(move) && !this.inSpecial(move) && !this.inTransition(move)) {
      const cand = a.replace(/^BOTH_([ABDSR])1_/, (s, g) => 'BOTH_' + g + lv + '_');
      if (cand !== a && this.host.hasAnim(cand)) a = cand;
    }
    return a;
  }
  // PM_SetSaberMove
  setMove(newMove, now, flags = {}) {
    const I = this.I, m = this.M[newMove], H = this.host;
    if (newMove === I.LS_READY) this.chain = 0; else if (this.inAttack(newMove)) this.chain = Math.min(16, this.chain + 1);
    let anim = this.animFor(newMove); const info = H.animInfo(anim);
    const hold = m.flag !== 'AFLAG_IDLE'; const holdless = m.flag === 'AFLAG_ACTIVE';
    let parts = 'torso';
    if (anim === 'BOTH_STAND1' || anim === 'BOTH_STAND2' || anim === 'BOTH_SABERFAST_STANCE' || anim === 'BOTH_SABERSLOW_STANCE') {
      // idle moves play the stance when standing, otherwise the torso just follows the legs
      anim = H.torsoIdleAnim(this.stanceAnim());
    }
    if ([I.LS_A_LUNGE, I.LS_A_JUMP_T__B_, I.LS_A_BACKSTAB, I.LS_A_BACK, I.LS_A_BACK_CR, I.LS_A_FLIP_STAB, I.LS_A_FLIP_SLASH].includes(newMove)) parts = 'both';
    const lerp = 1000 / Math.abs(info.fps);
    let dur = hold ? info.n * lerp : 0; if (holdless) dur = Math.max(lerp, dur - 2 * lerp);
    dur /= this.rageMul;
    const restart = this.M[this.move].anim === m.anim && newMove > I.LS_PUTAWAY;
    H.playTorso(anim, { parts, restart: restart || flags.restart, blendMs: m.blend, durMs: dur, idle: !hold, rage: this.rageMul });
    const was = this.move; this.move = newMove; this.torsoTimer = dur; this.moveAnim = anim; this.moveStart = now; this.moveLen = dur; this.curBlock = m.blocking;
    if (this.inAttack(newMove) && was !== newMove) H.event('swing', { move: newMove });
    if (this.weaponTime <= 0) this.blocked = null;
    return anim;
  }
  // PM_SaberAnimTransitionAnim
  transitionAnim(cur, nw) {
    const I = this.I, M = this.M; let ret = nw;
    const isA = x => x >= I.LS_A_TL2BR && x <= I.LS_A_T2B, isR = x => x >= I.LS_R_TL2BR && x <= I.LS_R_T2B;
    if (cur === I.LS_READY) { if (isA(nw)) ret = I.LS_S_TL2BR + (nw - I.LS_A_TL2BR); }
    else if (isA(nw)) {
      if (M[cur].endQuad === M[nw].startQuad) ret = nw;
      else if (isA(cur) || isR(cur) || this.inParry(cur) || this.inReflect(cur)) ret = this.TR[M[cur].endQuad][M[nw].startQuad];
    }
    return ret === I.LS_NONE || ret === 0 ? nw : ret;
  }
  quadFor(c) { // PM_SaberMoveQuadrantForMovement
    if (c.right > 0) return c.fwd > 0 ? Q.TL : c.fwd < 0 ? Q.BL : Q.L;
    if (c.right < 0) return c.fwd > 0 ? Q.TR : c.fwd < 0 ? Q.BR : Q.R;
    return c.fwd !== 0 ? Q.T : Q.R;
  }
  // PM_SaberAttackForMovement: c.right>0 means moving right (D key)
  attackForMovement(cur, c) {
    const I = this.I; let nm = -1;
    // Player camera pitch chooses the vertical attack animation, regardless of
    // WASD movement; neutral aim retains the original movement-driven saber chains.
    if (c.aimPitch > 0.4 && !c.enemyBehind) return I.LS_A_T2B;
    if (c.aimPitch < -0.32 && !c.enemyBehind) return I.LS_A_BL2TR;
    if (c.right > 0) nm = c.fwd > 0 ? I.LS_A_TL2BR : c.fwd < 0 ? I.LS_A_BL2TR : I.LS_A_L2R;
    else if (c.right < 0) nm = c.fwd > 0 ? I.LS_A_TR2BL : c.fwd < 0 ? I.LS_A_BR2TL : I.LS_A_R2L;
    else if (c.fwd > 0) {
      if (this.level === 2 && c.velZ > 1.8 && c.groundDist < 0.8 && c.enemyFront) nm = Math.random() < 0.5 ? I.LS_A_FLIP_STAB : I.LS_A_FLIP_SLASH;
      else if (this.level === 1 && c.ducked && this.weaponTime <= 0) { nm = I.LS_A_LUNGE; this.host.event('lunge'); }
      else nm = I.LS_A_T2B;
    } else if (c.fwd < 0) {
      if (c.enemyBehind) { nm = this.level >= 2 ? ((c.ducked || c.up < 0) ? I.LS_A_BACK_CR : I.LS_A_BACK) : I.LS_A_BACKSTAB; }
      else nm = I.LS_A_T2B;
    } else if (this.inBounce(cur)) nm = this.kataDone() ? this.M[cur].chainIdle : this.M[cur].chainAttack;
    else if (cur === I.LS_READY) nm = I.LS_A_TL2BR + Math.floor(Math.random() * 7);
    return nm;
  }
  // ---- main per-tick update (PM_WeaponLightsaber).  c = {attack, alt, fwd, right, up, ducked, velZ, groundDist, enemyFront, enemyBehind, busy}
  update(dtMs, c, now) {
    const I = this.I, H = this.host; let newmove = I.LS_NONE, anim = null;
    if (this.holstered) {
      if (this.move !== I.LS_READY) { this.move = I.LS_READY; }
      if (this.weaponTime > 0) this.weaponTime -= dtMs;
      if (this.torsoTimer > 0) this.torsoTimer -= dtMs;
      if (this.weaponTime < 1 && c.attack && !c.busy) H.requestDraw();
      return;
    }
    if (c.busy) { // other full-body actions (roll, force anims) pause the saber logic but time still runs
      if (this.weaponTime > 0) this.weaponTime -= dtMs; if (this.torsoTimer > 0) this.torsoTimer -= dtMs; return;
    }
    if (this.inFlight) { // guiding the thrown saber: play the throw once and hold its last frame, arm out
      // single-player throw: BOTH_SABERTHROW1START from the throwing motion (frame 18) at 3x, held with the arm extended toward the saber
      if (this.moveAnim !== 'BOTH_SABERTHROW1START') { H.playTorso('BOTH_SABERTHROW1START', { parts: 'torso', blendMs: 80, durMs: 100, hold: true, speed: 3, startAt: 0.3 }); this.moveAnim = 'BOTH_SABERTHROW1START'; }
      this.torsoTimer = 1; return;
    }
    if (this.torsoTimer > 0) this.torsoTimer -= dtMs;
    if (this.weaponTime > 0) this.weaponTime -= dtMs; else this.state = 'ready';
    if (this.state === 'ready' && this.move !== I.LS_READY && this.weaponTime <= 0 && !this.blocked) this.setMove(I.LS_READY, now);
    // blocked / parried
    if (this.blocked) {
      const b = this.blocked; this.blocked = null; const first = this.weaponTime <= 0;
      let mv = null;
      switch (b) {
        case 'UR': mv = I.LS_PARRY_UR; break; case 'UL': mv = I.LS_PARRY_UL; break; case 'LR': mv = I.LS_PARRY_LR; break; case 'LL': mv = I.LS_PARRY_LL; break; case 'T': mv = I.LS_PARRY_UP; break;
        case 'UR_P': mv = I.LS_REFLECT_UR; break; case 'UL_P': mv = I.LS_REFLECT_UL; break; case 'LR_P': mv = I.LS_REFLECT_LR; break; case 'LL_P': mv = I.LS_REFLECT_LL; break; case 'T_P': mv = I.LS_REFLECT_UP; break;
        case 'BOUNCE': {
          if (this.move >= I.LS_T1_BR__R) break; // transitions aren't bounced
          const sq = this.M[this.move].startQuad; let bm;
          if (c.attack) { let nq = this.quadFor(c); let g = 0; while (nq === sq && g++ < 8) nq = Math.floor(Math.random() * 7); bm = this.TR[sq][nq] || I.LS_B1_BR + sq; }
          else bm = sq === Q.T ? I.LS_R_BL2TR : sq < Q.T ? I.LS_R_TL2BR + sq - Q.BR : I.LS_R_BR2TL + sq - Q.TL;
          this.setMove(bm, now); this.weaponTime = this.torsoTimer; break;
        }
      }
      if (mv != null) { this.setMove(mv, now); this.weaponTime = 250; this.torsoTimer = 250; this.state = 'blocking'; }
      return;
    }
    if (this.weaponTime > 0) return; // still in the previous move
    // ---- attack selection
    let cur = (this.move > I.LS_NONE && this.move < this.M.length) ? this.move : I.LS_READY;
    if (!c.attack) {
      if (cur >= I.LS_S_TL2BR && cur <= I.LS_S_T2B) newmove = I.LS_A_TL2BR + (cur - I.LS_S_TL2BR);
      else if (cur >= I.LS_A_TL2BR && cur <= I.LS_A_T2B) newmove = I.LS_R_TL2BR + (cur - I.LS_A_TL2BR);
      else if (this.inTransition(cur)) newmove = this.M[cur].chainAttack;
      else if (this.inBounce(cur)) newmove = this.M[cur].chainIdle;
      else { if (cur !== I.LS_READY) this.setMove(I.LS_READY, now); return; }
    }
    // pressing attack (or finishing a started swing)
    if (cur >= I.LS_PARRY_UP && cur <= I.LS_REFLECT_LL) {
      switch (this.M[cur].endQuad) { case Q.T: newmove = I.LS_A_T2B; break; case Q.TR: newmove = I.LS_A_TL2BR; break; case Q.TL: newmove = I.LS_A_TR2BL; break; case Q.BR: newmove = I.LS_A_BR2TL; break; case Q.BL: newmove = I.LS_A_BL2TR; break; }
    }
    if (newmove !== I.LS_NONE && c.attack === false) anim = this.M[newmove].anim; // continuing (returns / finishes)
    else if (newmove !== I.LS_NONE) anim = this.M[newmove].anim;
    if (anim == null) {
      if (this.inTransition(cur)) newmove = this.M[cur].chainAttack;
      else if (this.inStart(cur)) newmove = I.LS_A_TL2BR + (cur - I.LS_S_TL2BR);
      else if (this.kataDone()) newmove = this.M[cur].chainIdle;
      else { const mv = this.attackForMovement(cur, c); if (mv !== -1) newmove = mv; }
      if (newmove !== I.LS_NONE) { newmove = this.transitionAnim(cur, newmove); anim = this.M[newmove].anim; }
    }
    if (anim == null) { newmove = this.M[cur].chainAttack; anim = this.M[newmove].anim; }
    if (anim == null || newmove === I.LS_NONE) { newmove = I.LS_READY; }
    if (!this.active) this.active = true;
    this.setMove(newmove, now);
    this.weaponTime = this.torsoTimer; this.state = 'firing';
    if (this.inAttack(newmove)) this.attackStartedAt = now;
  }
}
