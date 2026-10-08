#!/usr/bin/env python3
from pathlib import Path
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-browser-port.py <jk2-web-checkout>")

root = Path(sys.argv[1]).resolve()
path = root / "shared/wasm-build/sys_emscripten_jk/sys_jk_gl.cpp"
text = path.read_text()

old_block = r'''	// idTech3-web: unless the user pinned a custom mode (r_mode -1), render at the FULL
	// viewport at device pixels — real aspect, no 4:3 pillarbox — under a ~4 MP pixel
	// budget (Module.__idt3_ss scales it for SSAA). Mirrors sys_emscripten/sys_glimp.c;
	// the old gate (rmode==4) also missed JK2 entirely (its default is 3), pinning it to
	// a CSS-stretched 640x480.
	if ( rmode != -1 ) {
		int packed = EM_ASM_INT({
			var dpr = window.devicePixelRatio || 1;
			var de = document.documentElement;
			var vw = window.innerWidth  || (de && de.clientWidth)  || 1280;
			var vh = window.innerHeight || (de && de.clientHeight) || 720;
			var ss = (typeof Module !== 'undefined' && Module.__idt3_ss > 0) ? Module.__idt3_ss : 1;
			var w = Math.max(320, Math.round(vw * dpr * ss));
			var h = Math.max(240, Math.round(vh * dpr * ss));
			var maxPix = Math.min(4.0e6 * ss * ss, 8.0e6);
			var scale = Math.sqrt(Math.min(1, maxPix / (w * h)));
			w = Math.max(320, (Math.floor(w * scale) >> 1) << 1);
			h = Math.max(240, (Math.floor(h * scale) >> 1) << 1);
			return (w << 16) | h;
		});
		w = ( packed >> 16 ) & 0xffff;
		h = packed & 0xffff;
		aspect = (float)w / (float)h;
	}
'''
replacement = '''	// Atom XE: preserve Raven's selected video mode.
	//
	// R_GetModeInfo above already resolved r_mode (or r_customwidth/r_customheight for
	// r_mode -1). Do not replace those values with window.innerWidth/innerHeight.
	// This keeps the original Graphics menu authoritative and makes vid_restart apply
	// the resolution the player actually selected.
'''

next_text, count = re.subn(old_block, replacement, text, count=1, flags=re.MULTILINE)
if count != 1:
    raise SystemExit("viewport override block not found exactly once")
text = next_text

old_in_frame = r'''void IN_Frame( void ) {
	// Debounced resize → vid_restart (skip when the user pinned r_mode -1).
	if ( s_resizePending && emscripten_get_now() - s_resizeAt > 300.0 ) {
		s_resizePending = qfalse;
#ifdef IDT3_JKA
		if ( IDT3_RI_CVARGET( "r_mode", "4", 0 )->integer != -1 ) {
#else
		if ( IDT3_RI_CVARGET( "r_mode", "3", 0 )->integer != -1 ) {
#endif
			int vw = EM_ASM_INT({ var d = window.devicePixelRatio || 1; return Math.round((window.innerWidth || 1280) * d); });
			int vh = EM_ASM_INT({ var d = window.devicePixelRatio || 1; return Math.round((window.innerHeight || 720) * d); });
			float dw = (float)vw / (float)glConfig.vidWidth;
			float dh = (float)vh / (float)glConfig.vidHeight;
			int pix = glConfig.vidWidth * glConfig.vidHeight;
			if ( dw < 0.94f || ( dw > 1.06f && pix < 3900000 )
			  || dh < 0.94f || ( dh > 1.06f && pix < 3900000 ) ) {
				// idTech3-web: a vid_restart re-uploads every texture and re-runs
				// R_SetColorMappings — on screen that is a brightness flash plus a hitch.
				// Browsers emit resize events in BURSTS (zoom, devicePixelRatio change, a
				// scrollbar appearing, fullscreen transition), so without a floor the renderer
				// can restart repeatedly and the game appears to flash bright at random.
				// Headless never resizes, so this path does not appear in our own captures at
				// all — hence the log line as well as the cooldown.
				static double s_lastRestart = -1.0e9;
				static int    s_restartCount = 0;
				if ( emscripten_get_now() - s_lastRestart < 3000.0 ) {
					IDT3_RI_PRINTF( PRINT_ALL, "IDT3: resize %dx%d -> %dx%d suppressed (vid_restart cooldown)\n",
						glConfig.vidWidth, glConfig.vidHeight, vw, vh );
				} else {
					s_lastRestart = emscripten_get_now();
					IDT3_RI_PRINTF( PRINT_ALL, "IDT3: vid_restart #%d from resize %dx%d -> %dx%d\n",
						++s_restartCount, glConfig.vidWidth, glConfig.vidHeight, vw, vh );
					Cbuf_AddText( "vid_restart\n" );
				}
			}
		}
	}
}'''
new_in_frame = '''void IN_Frame( void ) {
	// Atom XE: browser/window resize must not silently replace the resolution chosen
	// in Raven's Graphics menu. The canvas is scaled in CSS while its backing buffer
	// stays at glConfig.vidWidth x glConfig.vidHeight until the player applies a new
	// r_mode and Raven performs its normal CL_Vid_Restart_f().
	s_resizePending = qfalse;
}'''
next_text, count = re.subn(old_in_frame, new_in_frame, text, count=1, flags=re.MULTILINE)
if count != 1:
    raise SystemExit("resize-driven IN_Frame block not found exactly once")
text = next_text

path.write_text(text)
print("patched", path)
