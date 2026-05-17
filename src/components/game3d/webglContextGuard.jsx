// ─── WebGL Context-Loss Guard ───────────────────────────────────────────
// Wraps a THREE.WebGLRenderer so it safely no-ops when:
//   • the WebGL context has been lost (common in iframes / preview / GPU stress)
//   • the renderer has been disposed (route change, HMR, StrictMode remount)
//
// Without this, Three.js's shadow-map pass will crash inside getUniforms()
// with: "Cannot read properties of null (reading 'trim')" — because
// gl.getShaderSource() returns null on a lost context, and Three.js calls
// .trim() on that null value when compiling depth materials.
//
// Usage:
//   const guard = attachContextGuard(renderer);   // call once after creating renderer
//   guard.render(scene, camera);                   // use instead of renderer.render
//   ...
//   guard.dispose();                               // call on unmount BEFORE renderer.dispose()

export function attachContextGuard(renderer) {
  let contextLost = false;
  let disposed = false;

  const onLost = (e) => { e.preventDefault?.(); contextLost = true; };
  const onRestored = () => { contextLost = false; };

  const canvas = renderer?.domElement;
  if (canvas) {
    canvas.addEventListener('webglcontextlost', onLost, false);
    canvas.addEventListener('webglcontextrestored', onRestored, false);
  }

  return {
    render(scene, camera) {
      if (disposed || contextLost || !renderer) return false;
      try {
        renderer.render(scene, camera);
        return true;
      } catch (err) {
        // Swallow the shader-trim crash so it doesn't blow up the React tree.
        console.warn('[GW3D] render skipped (context invalid):', err?.message || err);
        contextLost = true;
        return false;
      }
    },
    isAlive() { return !disposed && !contextLost; },
    markDisposed() { disposed = true; },
    dispose() {
      disposed = true;
      if (canvas) {
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
      }
    },
  };
}