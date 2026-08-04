// ─── Animation Debug Overlay ───────────────────────────────────────────
// The diagnostic view that makes these bugs visible instead of guessable.
// Draws, in the world:
//   • actor root forward   (cyan)   — what gameplay thinks forward is
//   • visual mesh forward  (yellow) — what the corrected mesh points at
//   • movement direction   (green)  — where the actor is actually travelling
//   • muzzle direction     (red)    — where a shot would leave the gun
//   • socket markers                — hand / weapon tip / muzzle / head
//
// If the cyan and yellow arrows disagree, the import yaw is wrong. If green
// and cyan disagree while walking, the movement basis is wrong. If red does
// not follow the weapon, the muzzle socket is wrong.

import * as THREE from 'three';
import { getActorForward } from './characterBasis';
import { getSocket, createSocketMarkers } from './CharacterSocketUtils';
import { getVisualModel } from './CharacterImportNormalizer';

const ARROW_LEN = 1.2;
const _v = new THREE.Vector3();
const _prevPos = new THREE.Vector3();
const _move = new THREE.Vector3();
const _q = new THREE.Quaternion();

function makeArrow(color) {
  const arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), new THREE.Vector3(), ARROW_LEN, color, 0.18, 0.1);
  arrow.line.material.depthTest = false;
  arrow.cone.material.depthTest = false;
  arrow.renderOrder = 998;
  return arrow;
}

export default class AnimationDebugOverlay {
  /**
   * @param scene      THREE.Scene to draw into
   * @param actorRoot  the normalized actor root
   * @param sockets    logical socket names to mark
   */
  constructor({ scene, actorRoot, sockets = ['RightHand', 'WeaponTip', 'Muzzle', 'Head'] } = {}) {
    this.scene = scene;
    this.actorRoot = actorRoot;
    this.visualModel = getVisualModel(actorRoot) || actorRoot;

    this.group = new THREE.Group();
    this.group.name = 'AnimationDebugOverlay';

    this.actorArrow = makeArrow(0x00e5ff);   // gameplay forward
    this.meshArrow = makeArrow(0xffd400);    // corrected mesh forward
    this.moveArrow = makeArrow(0x33ff66);    // actual travel direction
    this.muzzleArrow = makeArrow(0xff3355);  // shot direction
    this.group.add(this.actorArrow, this.meshArrow, this.moveArrow, this.muzzleArrow);

    this.markers = actorRoot ? createSocketMarkers(this.visualModel, sockets) : null;
    if (this.markers) this.group.add(this.markers.group);

    scene?.add(this.group);
    _prevPos.copy(actorRoot?.position || _v.set(0, 0, 0));

    // Text-side readout, polled by whatever HUD wants it.
    this.readout = { clip: '-', action: '-', queued: '-', speed: 0, facingDelta: 0 };
    this.visible = true;
  }

  setVisible(v) { this.visible = v; this.group.visible = v; }
  toggle() { this.setVisible(!this.visible); }

  /**
   * @param delta frame time
   * @param info  { clip, action, queued } from your animation/combo systems
   */
  update(delta, info = {}) {
    if (!this.visible || !this.actorRoot) return;

    const origin = this.actorRoot.getWorldPosition(_v).clone();
    origin.y += 1.0;

    // Gameplay forward (canonical basis).
    const actorFwd = getActorForward(this.actorRoot, new THREE.Vector3());
    this.actorArrow.position.copy(origin);
    this.actorArrow.setDirection(actorFwd);

    // Corrected mesh forward — should match the cyan arrow after normalization.
    this.visualModel.getWorldQuaternion(_q);
    const meshFwd = new THREE.Vector3(0, 0, -1).applyQuaternion(_q);
    meshFwd.y = 0;
    if (meshFwd.lengthSq() > 1e-6) meshFwd.normalize();
    this.meshArrow.position.copy(origin).y += 0.18;
    this.meshArrow.setDirection(meshFwd);

    // Travel direction — sideways walking shows up here as green ⟂ cyan.
    _move.subVectors(this.actorRoot.position, _prevPos);
    const speed = delta > 0 ? _move.length() / delta : 0;
    _move.y = 0;
    if (_move.lengthSq() > 1e-8) {
      this.moveArrow.visible = true;
      this.moveArrow.position.copy(origin).y -= 0.18;
      this.moveArrow.setDirection(_move.normalize());
    } else {
      this.moveArrow.visible = false;
    }
    _prevPos.copy(this.actorRoot.position);

    // Muzzle direction, straight off the socket transform.
    const muzzle = getSocket(this.visualModel, 'Muzzle');
    if (muzzle) {
      this.muzzleArrow.visible = true;
      this.muzzleArrow.position.copy(muzzle.getWorldPosition(new THREE.Vector3()));
      muzzle.getWorldQuaternion(_q);
      this.muzzleArrow.setDirection(new THREE.Vector3(0, 0, -1).applyQuaternion(_q));
    } else {
      this.muzzleArrow.visible = false;
    }

    this.markers?.update();

    const facingDelta = THREE.MathUtils.radToDeg(actorFwd.angleTo(meshFwd));
    this.readout = {
      clip: info.clip || '-',
      action: info.action || '-',
      queued: info.queued || '-',
      speed: +speed.toFixed(2),
      facingDelta: +facingDelta.toFixed(1),   // > ~1° means an import yaw mismatch
    };
  }

  getReadout() { return this.readout; }

  dispose() {
    this.markers?.dispose();
    for (const a of [this.actorArrow, this.meshArrow, this.moveArrow, this.muzzleArrow]) {
      a.line.geometry.dispose(); a.line.material.dispose();
      a.cone.geometry.dispose(); a.cone.material.dispose();
    }
    this.group.removeFromParent();
  }
}