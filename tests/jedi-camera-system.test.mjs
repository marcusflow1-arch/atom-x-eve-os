import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { JediCameraSystem, JEDI_CAMERA_STATE } from '../src/components/jedioutcast/camera/JediCameraSystem.js';

function close(actual, expected, epsilon = 1e-4) {
  assert.ok(Math.abs(actual - expected) <= epsilon, actual + ' ~= ' + expected);
}

test('gameplay follow starts outside the player at the Retribution distance', () => {
  const camera = new THREE.PerspectiveCamera();
  const system = new JediCameraSystem({ camera, now: () => 0 });
  system.snapGameplay({
    playerPosition: new THREE.Vector3(0, 0, 0),
    yaw: 0,
    pitch: 0,
  });

  close(camera.fov, 80);
  close(camera.aspect, 4 / 3);
  close(camera.position.x, 0);
  close(camera.position.y, 46);
  close(camera.position.z, 100);
});

test('cinematic move, pan and zoom interpolate instead of snapping', () => {
  const camera = new THREE.PerspectiveCamera();
  const system = new JediCameraSystem({ camera, now: () => 0 });
  system.enable(0);
  system.setPosition([0, 0, 0]);
  system.setAngles([0, 0, 0]);
  system.move([100, 0, 0], 1000, 0);
  system.pan([0, 90, 0], [0, 0, 0], 1000, 0);
  system.zoom(60, 1000, 0);

  system.update(500, 1 / 60);
  close(camera.position.x, 50);
  close(camera.fov, 75);
  assert.ok(system.infoState & JEDI_CAMERA_STATE.MOVING);
  assert.ok(system.infoState & JEDI_CAMERA_STATE.PANNING);
  assert.ok(system.infoState & JEDI_CAMERA_STATE.ZOOMING);

  system.update(1100, 1 / 60);
  close(camera.position.x, 100);
  close(camera.fov, 60);
  assert.equal(system.infoState & JEDI_CAMERA_STATE.MOVING, 0);
  assert.equal(system.infoState & JEDI_CAMERA_STATE.PANNING, 0);
  assert.equal(system.infoState & JEDI_CAMERA_STATE.ZOOMING, 0);
});

test('camera shake respects Raven maximum intensity and decays', () => {
  const camera = new THREE.PerspectiveCamera();
  const random = () => 1;
  const system = new JediCameraSystem({ camera, now: () => 0, random });
  system.shake(999, 1000, 0);
  assert.equal(system.shakeIntensity, 16);
  system.snapGameplay({ playerPosition: [0, 0, 0], yaw: 0, pitch: 0 });
  const first = camera.position.clone();
  system.updateGameplay({ playerPosition: [0, 0, 0], yaw: 0, pitch: 0, delta: 1 / 60 });
  assert.ok(camera.position.distanceTo(first) > 0);
});
