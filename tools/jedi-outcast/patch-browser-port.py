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

replacement = """\t// Atom XE: preserve Raven's selected video mode.\n\t// R_GetModeInfo above already resolved r_mode (or r_customwidth/r_customheight\n\t// for r_mode -1). Do not replace it with browser viewport dimensions.\n"""
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

