export class CleanupManager {
  constructor() {
    this.cleanups = [];
  }

  add(cleanup) {
    if (typeof cleanup === 'function') this.cleanups.push(cleanup);
    return cleanup;
  }

  disposeObject3D(root) {
    if (!root?.traverse) return;
    root.traverse((node) => {
      if (node.geometry?.dispose) node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : node.material ? [node.material] : [];
      materials.forEach((mat) => {
        Object.values(mat).forEach((value) => {
          if (value?.isTexture && value.dispose) value.dispose();
        });
        mat.dispose?.();
      });
    });
  }

  dispose() {
    for (let i = this.cleanups.length - 1; i >= 0; i--) {
      this.cleanups[i]?.();
    }
    this.cleanups.length = 0;
  }
}