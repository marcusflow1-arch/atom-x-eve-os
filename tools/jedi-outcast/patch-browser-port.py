#!/usr/bin/env python3
from pathlib import Path
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-browser-port.py <jk2-web-checkout>")

root = Path(sys.argv[1]).resolve()
path = root / "shared/wasm-build/sys_emscripten_jk/sys_jk_gl.cpp"
text = path.read_text()

anchor = "\t// idTech3-web: unless the user pinned a custom mode (r_mode -1), render at the FULL"
start = text.find(anchor)
if start < 0:
    raise SystemExit("viewport override start not found")
end_anchor = "\temscripten_webgl_init_context_attributes( &attrs );"
end = text.find(end_anchor, start)
if end < 0:
    raise SystemExit("viewport override end not found")

replacement = """\t// Atom XE: force the gameplay framebuffer to the reconstruction contract.\n\t// The browser port can otherwise fall back to the HTML canvas default (300x150)\n\t// during a renderer re-init / cinematic-to-game transition. That changes the\n\t// projection and makes the third-person framing look as if the camera is inside\n\t// the player even though the camera cvars themselves are valid.\n\twidth = 1024;\n\theight = 768;\n\t// Preserve Raven's selected mode semantics, but never replace this fixed native\n\t// gameplay buffer with browser viewport dimensions. CSS may scale presentation.\n"""
text = text[:start] + replacement + text[end:]

start = text.find("void IN_Frame( void ) {")
if start < 0:
    raise SystemExit("IN_Frame definition not found")
end = text.find("void IN_Activate( void )", start)
if end < 0:
    raise SystemExit("IN_Frame end not found")

replacement = """void IN_Frame( void ) {\n\t// Atom XE: preserve the resolution selected in Raven's Graphics menu.\n\t// Browser/window resize changes presentation only; it must not silently invoke\n\t// vid_restart and replace the player's r_mode.\n\ts_resizePending = qfalse;\n}\n"""
text = text[:start] + replacement + text[end:]

path.write_text(text)
print("patched", path)

