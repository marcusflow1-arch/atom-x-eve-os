/**
 * ReactorBridge — Global event bus that syncs Reactor Editor ↔ Luna 3D Viewer.
 *
 * The editor writes reactor configs and animation state here.
 * The Luna TransparentModel3DViewer listens and applies them live.
 *
 * This is a singleton module — import it from both sides.
 */

const listeners = new Map();
let _state = {
  // Which model the editor is working on (matches Model3D.id or 'ybot'/'c1')
  activeModelId: null,
  activeModelName: null,

  // Current animation being previewed in the editor
  previewAnimationUrl: null,
  previewAnimationName: null,
  isPlaying: false,
  animTime: 0, // normalized 0-1

  // All reactors for the active model (mirrors DB but live)
  reactors: [],

  // Currently firing reactor (editor scrubs into a reactor's active window)
  firingReactorId: null,
  firingBone: null,
  firingDamageType: null,

  // FX being previewed
  previewFX: null, // { id, name, color, bone, effect_type }

  // Live scene model list (populated by Luna viewer)
  sceneModels: [], // [{ id, name, type:'ybot'|'c1'|'ai', file_url }]
};

function emit(eventName, data) {
  const cbs = listeners.get(eventName) || [];
  cbs.forEach(cb => cb(data));
  // Also dispatch a DOM event for cross-component communication
  window.dispatchEvent(new CustomEvent(`reactor:${eventName}`, { detail: data }));
}

function on(eventName, callback) {
  if (!listeners.has(eventName)) listeners.set(eventName, []);
  listeners.get(eventName).push(callback);
  return () => {
    const cbs = listeners.get(eventName);
    if (cbs) {
      const idx = cbs.indexOf(callback);
      if (idx >= 0) cbs.splice(idx, 1);
    }
  };
}

// ─── Editor → Viewer commands ───

function setActiveModel(modelId, modelName) {
  _state.activeModelId = modelId;
  _state.activeModelName = modelName;
  emit('modelChanged', { modelId, modelName });
}

function setPreviewAnimation(url, name) {
  _state.previewAnimationUrl = url;
  _state.previewAnimationName = name;
  emit('animationChanged', { url, name });
}

function setPlayState(playing) {
  _state.isPlaying = playing;
  emit('playStateChanged', { playing });
}

function setAnimTime(time) {
  _state.animTime = time;
  emit('animTimeChanged', { time });
}

function setReactors(reactors) {
  _state.reactors = reactors;
  emit('reactorsUpdated', { reactors });
}

function fireReactor(reactorId, bone, damageType, fx) {
  _state.firingReactorId = reactorId;
  _state.firingBone = bone;
  _state.firingDamageType = damageType;
  emit('reactorFired', { reactorId, bone, damageType, fx });
}

function clearFiring() {
  _state.firingReactorId = null;
  _state.firingBone = null;
  _state.firingDamageType = null;
  emit('reactorCleared', {});
}

function previewFX(fx) {
  _state.previewFX = fx;
  emit('fxPreview', fx);
}

// ─── Viewer → Editor info ───

function registerSceneModels(models) {
  _state.sceneModels = models;
  emit('sceneModelsUpdated', { models });
}

function getState() {
  return { ..._state };
}

const ReactorBridge = {
  on,
  emit,
  getState,
  // Editor side
  setActiveModel,
  setPreviewAnimation,
  setPlayState,
  setAnimTime,
  setReactors,
  fireReactor,
  clearFiring,
  previewFX,
  // Viewer side
  registerSceneModels,
};

export default ReactorBridge;