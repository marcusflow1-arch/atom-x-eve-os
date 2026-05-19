// ─── Hardware Profile ─────────────────────────────────────────────────────
// One-time detection of the user's hardware capabilities. All values come
// from standard browser APIs — nothing native required. We cache the
// result on `window.__hwProfile` so any system (terrain, renderer, UI)
// can read it synchronously after the first call.
//
// Detected:
//   • GPU vendor + renderer (via WEBGL_debug_renderer_info)
//   • Approx VRAM (heuristic from renderer string + MAX_TEXTURE_SIZE)
//   • System RAM (navigator.deviceMemory, GB)
//   • CPU threads (navigator.hardwareConcurrency)
//   • Hardware acceleration (true if a real GPU renderer is exposed)
//   • WebGL2 + WebGPU availability
//   • Suggested baseline preset

function detectGL() {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl2') ||
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');
    if (!gl) return { ok: false };

    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor   = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL)   : gl.getParameter(gl.VENDOR);
    const renderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    const maxTex   = gl.getParameter(gl.MAX_TEXTURE_SIZE);
    const webgl2   = !!(window.WebGL2RenderingContext && gl instanceof WebGL2RenderingContext);

    return { ok: true, vendor, renderer, maxTex, webgl2 };
  } catch {
    return { ok: false };
  }
}

// Rough VRAM estimate. Browsers don't expose VRAM directly, so we use
// renderer-string keywords + MAX_TEXTURE_SIZE as a heuristic.
function estimateVRAM(renderer, maxTex) {
  const r = (renderer || '').toLowerCase();
  // Discrete high-end signatures
  if (/(rtx 40|rtx 30|rtx 20|rx 7|rx 6)/.test(r))           return 8192; // 8 GB+
  if (/(gtx 16|gtx 10|rx 5)/.test(r))                       return 4096;
  if (/(apple m[1-4]|m1 max|m2 max|m3 max)/.test(r))        return 8192; // unified memory
  if (/(apple m[1-4])/.test(r))                             return 4096;
  if (/(intel.*iris|intel.*arc|intel.*xe)/.test(r))         return 2048;
  if (/(intel|uhd|hd graphics)/.test(r))                    return 1024;
  // Fallback by max texture size
  if (maxTex >= 16384) return 4096;
  if (maxTex >= 8192)  return 2048;
  return 1024;
}

function suggestPreset({ vramMB, ramGB, threads, hwAccel, webgl2 }) {
  if (!hwAccel) return 'low';
  if (vramMB >= 6144 && ramGB >= 16 && threads >= 8 && webgl2) return 'ultra';
  if (vramMB >= 3072 && ramGB >= 8  && threads >= 4 && webgl2) return 'high';
  if (vramMB >= 1536 && ramGB >= 4)                            return 'medium';
  return 'low';
}

export function detectHardwareProfile() {
  if (typeof window !== 'undefined' && window.__hwProfile) return window.__hwProfile;

  const gl = detectGL();
  const ramGB   = navigator.deviceMemory || 0;          // 0 = unknown
  const threads = navigator.hardwareConcurrency || 0;
  // "Software" / "SwiftShader" / "llvmpipe" renderers = no hw accel.
  const r = (gl.renderer || '').toLowerCase();
  const hwAccel = gl.ok && !/(swiftshader|software|llvmpipe|microsoft basic)/.test(r);

  const vramMB = gl.ok ? estimateVRAM(gl.renderer, gl.maxTex) : 0;
  const webgpu = typeof navigator !== 'undefined' && !!navigator.gpu;

  const profile = {
    ok: gl.ok,
    gpu: gl.renderer || 'Unknown',
    gpuVendor: gl.vendor || 'Unknown',
    vramMB,
    ramGB,
    threads,
    hwAccel,
    webgl2: !!gl.webgl2,
    webgpu,
    maxTextureSize: gl.maxTex || 0,
    suggestedPreset: 'medium',
  };
  profile.suggestedPreset = suggestPreset(profile);

  if (typeof window !== 'undefined') window.__hwProfile = profile;
  return profile;
}