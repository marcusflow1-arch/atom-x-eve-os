/* eslint-disable */
// Keyboard / mouse input with pointer lock (falls back to arrow-key camera when pointer lock is unavailable).
// Listeners are tracked so dispose() can remove every one of them (the game is mounted inside a React page).
export class Input {
  constructor(canvas) {
    this.canvas = canvas; this.down = new Set(); this.pressedSet = new Set(); this.releasedSet = new Set(); this.btn = [false, false, false]; this.btnPressed = [false, false, false];
    this.dx = 0; this.dy = 0; this.wheel = 0; this.zoom = 0; this.wheelThrottle = 0; this.lastWheel = -1e9; this.locked = false; this.sens = 0.0022; this.enabled = true; this.onFirstGesture = null; this.cleanups = [];
    const on = (t, type, fn, o) => { t.addEventListener(type, fn, o); this.cleanups.push(() => t.removeEventListener(type, fn, o)); };
    const prevent = new Set(['Space', 'Tab', 'F1', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'F3']);
    const typing = e => { const t = e.target; return !!t && t !== canvas && t.nodeType === 1 && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)); }; // never swallow keys meant for a text field
    on(window, 'keydown', e => { if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return; if (prevent.has(e.code)) e.preventDefault(); if (!e.repeat) { this.down.add(e.code); this.pressedSet.add(e.code); } this.gesture(); });
    on(window, 'keyup', e => { this.down.delete(e.code); this.releasedSet.add(e.code); });
    on(window, 'blur', () => { this.down.clear(); this.btn.fill(false); });
    on(canvas, 'mousedown', e => { e.preventDefault(); this.btn[e.button] = true; this.btnPressed[e.button] = true; this.gesture(); if (!this.locked && e.button === 0) this.lock(); });
    on(window, 'mouseup', e => { this.btn[e.button] = false; });
    on(canvas, 'contextmenu', e => e.preventDefault());
    on(window, 'mousemove', e => { if (this.locked || this.btn[1]) { this.dx += e.movementX || 0; this.dy += e.movementY || 0; } });
    // Browser editor iframes may deny pointer lock. Keep camera look functional while the mouse is over the game canvas.
    // Locked events bubble to window and must not be added twice.
    on(canvas, 'mousemove', e => { if (!this.locked && !this.btn[1]) { this.dx += e.movementX || 0; this.dy += e.movementY || 0; } });
    on(canvas, 'wheel', e => { e.preventDefault(); const s = Math.sign(e.deltaY); if (e.ctrlKey) { this.zoom += s; return; } if (this.wheelThrottle && e.timeStamp - this.lastWheel < this.wheelThrottle) return; this.lastWheel = e.timeStamp; this.wheel += s; }, { passive: false }); // wheelThrottle: one step per notch even on trackpads
    on(document, 'pointerlockchange', () => { this.locked = document.pointerLockElement === canvas; });
  }
  gesture() { if (this.onFirstGesture) { const f = this.onFirstGesture; this.onFirstGesture = null; f(); } }
  lock() { try { const p = this.canvas.requestPointerLock(); if (p && p.catch) p.catch(() => { }); } catch (e) { } }
  held(code) { return this.down.has(code); }
  pressed(code) { return this.pressedSet.has(code); }
  released(code) { return this.releasedSet.has(code); }
  endFrame() { this.pressedSet.clear(); this.releasedSet.clear(); this.btnPressed.fill(false); this.dx = this.dy = 0; this.wheel = 0; this.zoom = 0; }
  dispose() {
    for (const f of this.cleanups) f(); this.cleanups.length = 0; this.down.clear();
    try { if (document.pointerLockElement === this.canvas) document.exitPointerLock(); } catch (e) { }
  }
}
