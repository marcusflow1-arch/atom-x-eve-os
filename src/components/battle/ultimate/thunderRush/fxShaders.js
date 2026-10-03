// GLSL ES 3.00 for the Chidori lightning and impact effects. Shared by the PvP
// arena (three.js RawShaderMaterial, glslVersion GLSL3) and the offline preview
// renderer. No #version line: three.js adds it.

const HEADER = `
precision highp float;
precision highp int;
precision highp sampler2D;
`;

// ---------------------------------------------------------------------------
// Effects: one dynamic vertex stream drawn twice (additive, then alpha).
// Per vertex: position(3) uv(2) color(4) shape(1).
// ---------------------------------------------------------------------------
export const fxVertex = `${HEADER}
in vec3 position;
in vec2 uv;
in vec4 color;
in float shape;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
out vec2 vUv;
out vec4 vColor;
out float vShape;
void main() {
  vUv = uv;
  vColor = color;
  vShape = shape;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}
`;

export const fxFragment = `${HEADER}
in vec2 vUv;
in vec4 vColor;
in float vShape;
out highp vec4 fragColor;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  float a = 0.0;
  int s = int(vShape + 0.5);
  if (s == 0) {
    // Soft glow.
    a = exp(-r * r * 3.2) * (1.0 - smoothstep(0.85, 1.0, r));
  } else if (s == 1) {
    // Ribbon cross-section (bolts, trails): hot core, soft falloff.
    float x = abs(p.y);
    a = pow(max(0.0, 1.0 - x), 2.2);
  } else if (s == 2) {
    // Thin shock ring.
    a = exp(-pow((r - 0.8) / 0.09, 2.0)) * (1.0 - smoothstep(0.95, 1.0, r));
  } else if (s == 3) {
    // Four-point sparkle.
    float cross = max(exp(-abs(p.x) * 14.0 - abs(p.y) * 2.2), exp(-abs(p.y) * 14.0 - abs(p.x) * 2.2));
    a = max(cross, exp(-r * r * 18.0)) * (1.0 - smoothstep(0.9, 1.0, r));
  } else if (s == 4) {
    // Cartoon dust puff: solid body with a soft rim.
    a = 1.0 - smoothstep(0.62, 1.0, r);
    a *= 0.75 + 0.25 * smoothstep(0.1, 0.7, r);
  } else if (s == 5) {
    // Spark streak, bright head at u = 1.
    a = pow(max(0.0, 1.0 - abs(p.y)), 2.0) * smoothstep(0.0, 1.0, vUv.x);
  } else {
    // Blob shadow.
    a = (1.0 - smoothstep(0.25, 1.0, r));
  }
  a *= vColor.a;
  fragColor = vec4(vColor.rgb * a, a);
}
`;
