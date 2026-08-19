export type WorldSelection = {
  objectId: string;
  name: string;
  kind: 'terrain' | 'model' | 'enemy' | 'player' | 'companion' | 'pet' | 'mount' | 'world';
  source: 'base44' | 'user_asset' | 'runtime';
};

export type AssetItem = {
  id: string;
  name: string;
  type: 'model' | 'animation' | 'texture' | 'material' | 'environment';
  source: 'pc' | 'world' | 'project';
  uri?: string;
};

/**
 * Selection-first editing contract for the existing Game Viewer scene.
 * The scene itself remains the source of truth: Base44-created and user-imported
 * objects are equally selectable/editable.
 */
export class GameWorldSelectionAndAssetDock {
  private selected: WorldSelection | null = null;
  private assets: AssetItem[] = [];

  selectWorldObject(selection: WorldSelection): void {
    this.selected = selection;
  }

  clearSelection(): void {
    this.selected = null;
  }

  getSelectedObject(): WorldSelection | null {
    return this.selected;
  }

  /** 15% left inspector is driven directly by the clicked world object. */
  getInspectorLayout(): { widthPercent: number; object: WorldSelection | null } {
    return { widthPercent: 15, object: this.selected };
  }

  /** 15% bottom asset/world library for drag-and-drop imports and world inventory. */
  getAssetDockLayout(): { heightPercent: number; items: AssetItem[] } {
    return { heightPercent: 15, items: [...this.assets] };
  }

  registerAsset(item: AssetItem): void {
    this.assets = [...this.assets.filter((asset) => asset.id !== item.id), item];
  }

  removeAsset(assetId: string): void {
    this.assets = this.assets.filter((asset) => asset.id !== assetId);
  }

  /** Import a local PC asset into the editor asset inventory. */
  importLocalAsset(file: { name: string; type: string; uri?: string }): AssetItem {
    const lower = file.name.toLowerCase();
    const type: AssetItem['type'] = /\.glb$|\.gltf$|\.fbx$|\.obj$/.test(lower)
      ? 'model'
      : /\.glb\.anim$|\.fbx$|\.anim$/.test(lower)
        ? 'animation'
        : /\.png$|\.jpg$|\.jpeg$|\.webp$/.test(lower)
          ? 'texture'
          : /\.hdr$|\.exr$/.test(lower)
            ? 'environment'
            : 'material';

    const item: AssetItem = {
      id: `local-${Date.now()}-${file.name}`,
      name: file.name,
      type,
      source: 'pc',
      uri: file.uri,
    };
    this.registerAsset(item);
    return item;
  }
}
