import { useEffect, useRef } from 'react';
import './luna-liquid-waterfall.css';

// A single continuous translucent water sheet over the inside of the existing
// AI Attribute panel. It does not paint lines, orbit the frame or alter buttons.
const VERTEX = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0., 1.);
}`;
const WATER = `
precision mediump float;
uniform float uTime;
uniform vec2 uResolution;
varying vec2 vUv;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1., 0.)), f.x),
             mix(hash(i + vec2(0., 1.)), hash(i + vec2(1., 1.)), f.x), f.y);
}
float fbm(vec2 p) {
  float n = 0.0;
  float amp = 0.5;
  for (int i = 0; i < 4; i++) {
    n += amp * noise(p);
    p = p * 2.02 + vec2(9.3, 3.7);
    amp *= 0.5;
  }
  return n;
}
void main() {
  vec2 uv = vUv;
  float t = uTime;
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  // Water features advect downward: increasingly positive y offset causes
  // visual features to drift from high to low screen positions as t advances.
  vec2 sheet = vec2(uv.x * (3.0 + aspect), uv.y * 3.4 + t * 0.39);
  float flow = fbm(sheet + vec2(sin(sheet.y * 0.8 + t * 0.4) * 0.24, 0.0));
  float eddy = fbm(vec2(uv.x * 7.2 + flow * 1.2, uv.y * 5.1 + t * 0.53));
  float slow = fbm(vec2(uv.x * 2.7, uv.y * 2.6 + t * 0.23));
  // Broad changing shapes create fluid refraction rather than streaks of hair.
  float wave = sin(uv.y * 22.0 + flow * 8.0
               + 1.9 * sin(uv.x * 5.0 + eddy * 4.0) + t * 3.1);
  float crest = smoothstep(0.30, 0.90, wave) * (0.35 + slow * 0.65);
  float shimmer = smoothstep(0.57, 0.86, eddy + 0.23 * wave);
  float pooled = smoothstep(0.28, 0.72, flow);
  vec2 p = vec2(uv.x * 4.3 + flow * 0.3, uv.y * 9.0 + t * 0.84);
  float ripple = 0.5 + 0.5 * sin(p.y * 3.0 + fbm(p) * 6.5);
  ripple = smoothstep(0.55, 0.96, ripple);
  vec3 tint = mix(vec3(0.12, 0.48, 0.68), vec3(0.54, 0.90, 1.0),
    clamp(crest * 0.52 + shimmer * 0.38 + ripple * 0.25, 0.0, 1.0));
  // Stats remain clearly visible: at least 77% of every pixel is transparent.
  float alpha = clamp(0.038 + pooled * 0.070 + crest * 0.060
                 + shimmer * 0.041 + ripple * 0.018, 0.035, 0.205);
  gl_FragColor = vec4(tint, alpha);
}`;

function makeShader(gl, kind, source) {
  const shader = gl.createShader(kind);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error('Luna water shader: ' + log);
  }
  return shader;
}
function createProgram(gl) {
  const vert = makeShader(gl, gl.VERTEX_SHADER, VERTEX);
  const frag = makeShader(gl, gl.FRAGMENT_SHADER, WATER);
  const program = gl.createProgram();
  gl.attachShader(program, vert);
  gl.attachShader(program, frag);
  gl.linkProgram(program);
  gl.deleteShader(vert);
  gl.deleteShader(frag);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Luna water program: ' + log);
  }
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.useProgram(program);
  const pos = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
  return {
    program, buffer,
    time: gl.getUniformLocation(program, 'uTime'),
    resolution: gl.getUniformLocation(program, 'uResolution'),
  };
}

export default function LunaLiquidWaterfall() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const motion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    let gl, shader;
    try {
      gl = canvas.getContext('webgl', {
        alpha: true, premultipliedAlpha: false, depth: false,
        stencil: false, antialias: false, powerPreference: 'low-power',
      });
      if (!gl) throw new Error('WebGL unavailable');
      shader = createProgram(gl);
      canvas.classList.add('axe-waterfall-glass__canvas--running');
    } catch (error) {
      // CSS fallback is animated even on devices without WebGL.
      console.warn('[Luna] water shader unavailable, using CSS fallback', error);
      return undefined;
    }

    let frame = 0, previous = 0, last = -1000, elapsed = 0, stopped = false;
    const resize = () => {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
      const w = Math.max(1, Math.round(box.width * dpr));
      const h = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
    };
    const paint = t => {
      if (stopped || gl.isContextLost()) return;
      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(shader.program);
      gl.uniform1f(shader.time, t);
      gl.uniform2f(shader.resolution, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    };
    const tick = timestamp => {
      frame = 0;
      if (stopped || document.hidden || motion?.matches) return;
      if (timestamp - last >= 1000 / 30) {
        elapsed += previous ? Math.min((timestamp - previous) / 1000, 0.10) : 0;
        previous = timestamp;
        last = timestamp;
        paint(elapsed);
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0; previous = 0;
      if (stopped) return;
      if (document.hidden || motion?.matches) paint(elapsed);
      else frame = requestAnimationFrame(tick);
    };
    const lost = event => {
      event.preventDefault();
      stopped = true;
      canvas.classList.remove('axe-waterfall-glass__canvas--running');
      if (frame) cancelAnimationFrame(frame);
    };
    canvas.addEventListener('webglcontextlost', lost);
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
    observer?.observe(canvas);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', sync);
    motion?.addEventListener?.('change', sync);
    resize();
    paint(0);
    sync();
    return () => {
      stopped = true;
      if (frame) cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', sync);
      motion?.removeEventListener?.('change', sync);
      canvas.removeEventListener('webglcontextlost', lost);
      if (gl && !gl.isContextLost()) {
        gl.deleteBuffer(shader.buffer);
        gl.deleteProgram(shader.program);
      }
    };
  }, []);
  return (
    <div className="axe-waterfall-glass" aria-hidden="true">
      <canvas ref={canvasRef} className="axe-waterfall-glass__canvas" />
    </div>
  );
}
