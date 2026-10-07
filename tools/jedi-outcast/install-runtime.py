#!/usr/bin/env python3
"""Install a pinned original-source engine. Never downloads or fabricates retail data."""
from pathlib import Path
import argparse
import hashlib
import io
import json
import re
import urllib.request
import zipfile

URL = 'https://github.com/Virtastic/jk2-web/releases/download/v1.1.0/jk2-web-v1.1.0.zip'
SHA = 'c415f53ca19804b21c9c0bffb2d94e493037d7482d1b3c35eee05e8053aad74e'
HASHES = {
    'jk2.js': '0a8c6a8ef8ab630cf5e30e9abfdce78bfac9956fd19c6883be430c84a51fe86e',
    'jk2.wasm': 'd95c3f02722d72fa2e8eec0652e6d1e8789b50ce9b6aae3ff738a89de8fb7de4',
    'qagame.wasm': '9c696cf6f7c8a768cdff4a46270c8f4d31dcd5da3769b4cac02e06dd1b728f3f',
}

def replace_once(source, old, new):
    if source.count(old) != 1:
        raise ValueError('Pinned upstream shell changed: ' + old[:65])
    return source.replace(old, new, 1)

def adapt_shell(html):
    script = html.rsplit('<script>', 1)[1].split('</script>', 1)[0]
    # Keep the engine bootstrap, filesystem, config/save persistence, audio and
    # lifecycle from the matching source release. Replace only its launch UI.
    begin = script.index('// Data is bring-your-own:')
    end = script.index('var Module =', begin)
    script = script[:begin] + "window.__JK2_GAMEDIR = 'base';\nwindow.__JK2_PAKS = [];\nvar __argParam = null;\n\n" + script[end:]
    begin = script.index('function card(id, fn)')
    end = script.index('// ── Lifecycle', begin)
    script = script[:begin] + script[end:]
    begin = script.index('(function(){\n  // Probe for a staged full install')
    script = script[:begin]
    begin = script.index('function __tuneArgs(){')
    end = script.index('function boot(args, relay)', begin)
    script = script[:begin] + '// Preserve the original game defaults; use the in-game settings menu.\nfunction __tuneArgs(){ return []; }\n\n' + script[end:]
    script = re.sub(r"var __relay = .*?;\n", '', script, count=1, flags=re.S)
    script = replace_once(script, "var __STAMP = '1785103811';", "var __STAMP = 'atom-jk2-v1.1.0';")
    script = script.replace("FS.mkdir(", "FS.mkdirTree(")
    script = replace_once(script,
        "var s = document.createElement('script'); s.src = 'jk2.js?v=' + __STAMP + ''; document.body.appendChild(s);",
        "var s = document.createElement('script'); s.src = 'jk2.js?v=' + __STAMP; s.onerror = function(){ Module.onFatal('The original engine download failed. Reload and try again.'); }; document.body.appendChild(s);")
    script = replace_once(script, 'booted = true;', "booted = true;\n    if (parent !== window) parent.postMessage({type:'atom-jedi-status', state:'engine-ready'}, location.origin);")
    # No runtime splash may conceal a subsequent fatal; atom-launcher owns a
    # separate persistent error surface even after the upstream loader is removed.
    return '// SPDX-License-Identifier: GPL-2.0\n// Adapted from Virtastic jk2-web v1.1.0. See NOTICE.md and SOURCE.json.\n' + script

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', type=Path, help='Use an already-downloaded, checksum-verified bundle')
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    target = root / 'public/games/jedi-outcast'
    data = args.archive.read_bytes() if args.archive else urllib.request.urlopen(URL, timeout=60).read()
    if hashlib.sha256(data).hexdigest() != SHA:
        raise ValueError('Runtime archive hash mismatch. Nothing installed.')
    with zipfile.ZipFile(io.BytesIO(data)) as archive:
        contents = {name: archive.read(name) for name in [*HASHES, 'LICENSE', 'NOTICE.md', 'THIRD-PARTY-LICENSES.md']}
        shell = adapt_shell(archive.read('index.html').decode())
        for name, expected in HASHES.items():
            if hashlib.sha256(contents[name]).hexdigest() != expected:
                raise ValueError('Runtime file hash mismatch: ' + name)
    target.mkdir(parents=True, exist_ok=True)
    for name, content in contents.items():
        (target / name).write_bytes(content)
    (target / 'engine-shell.js').write_text(shell)
    manifest = {
        'original_source': 'https://github.com/grayj/Jedi-Outcast',
        'original_commit': '85f58467344d3ccbc6e2501a9af573ff4488a898',
        'browser_port': 'https://github.com/Virtastic/jk2-web/tree/v1.1.0',
        'browser_port_commit': '3aa6c1daee11cfc491a4f57f8d51dbb1402d67fd',
        'corresponding_source': 'https://github.com/Virtastic/jk2-web/releases/download/v1.1.0/jk2-web-src-v1.1.0.tar.gz',
        'bundle': URL, 'bundle_sha256': SHA, 'files_sha256': HASHES,
        'license': 'GPL-2.0', 'retail_data_included': False,
        'engine_binaries_modified': False,
        'integration': 'Local original-data picker, required-file and format checks, iframe lifecycle and launcher. No replacement models, maps, AI, combat, animation or HUD.'
    }
    (target / 'SOURCE.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print('Installed verified jk2-web v1.1.0 engine + game module. Retail data remains external.')

if __name__ == '__main__':
    main()
