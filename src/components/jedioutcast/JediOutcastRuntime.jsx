import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import {
  buildKejimOutpost,
  createKyleProxy,
  createStormtrooperProxy,
  disposeObject3D,
  setNpcDeadPose,
} from './KejimOutpostRuntime';
import { JEDI_OUTCAST_RECONSTRUCTION, JKO_FORCE_POWERS } from './sourceManifest';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const nowMs = () => performance.now();

function makeTracer(scene, from, to, color = 0x66d9ff, life = 110) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.96 });
  const line = new THREE.Line(geometry, material);
  scene.add(line);
  window.setTimeout(() => {
    scene.remove(line);
    geometry.dispose();
    material.dispose();
  }, life);
}

function resolveDamage(player, amount) {
  let remaining = amount;
  if (player.armor > 0) {
    const absorbed = Math.min(player.armor, remaining);
    player.armor -= absorbed;
    remaining -= absorbed;
  }
  if (remaining > 0) player.health = Math.max(0, player.health - remaining);
}

function moveToward(group, target, speed, dt) {
  const delta = target.clone().sub(group.position);
  delta.y = 0;
  const distance = delta.length();
  if (distance < 0.04) return distance;
  delta.normalize();
  group.position.addScaledVector(delta, Math.min(distance, speed * dt));
  group.rotation.y = Math.atan2(delta.x, -delta.z);
  return distance;
}

function createAudioPing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 118;
    gain.gain.setValueAtTime(0.035, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
    osc.onended = () => ctx.close();
  } catch {
    // Audio feedback is optional.
  }
}

export default function JediOutcastRuntime() {
  const mountRef = useRef(null);
  const hitMarkerRef = useRef(null);
  const [hud, setHud] = useState({
    health: 100,
    armor: 100,
    force: 100,
    weapon: 'Bryar Blaster',
    objective: 'Enter Kejim Outpost',
    enemies: 0,
    kills: 0,
    shots: 0,
    hits: 0,
    state: 'ready',
    pointerLocked: false,
  });

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let disposed = false;
    let animationFrame = 0;
    let resizeObserver;
    const keys = new Set();
    const raycaster = new THREE.Raycaster();
    const clock = new THREE.Clock();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050a10);
    scene.fog = new THREE.FogExp2(0x050a10, 0.025);

    const camera = new THREE.PerspectiveCamera(66, 1, 0.05, 180);
    camera.position.set(0, 2.6, 16.5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);

    const hemi = new THREE.HemisphereLight(0xa8c9de, 0x10151a, 1.3);
    scene.add(hemi);
    const keyLight = new THREE.DirectionalLight(0xcce9ff, 2.1);
    keyLight.position.set(-3, 8, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    scene.add(keyLight);

    const level = buildKejimOutpost(scene);
    const player = {
      group: createKyleProxy(scene, level.playerSpawn),
      velocityY: 0,
      grounded: true,
      yaw: Math.PI,
      pitch: -0.05,
      health: 100,
      armor: 100,
      force: 100,
      weapon: 'blaster',
      speedUntil: 0,
      nextAttackAt: 0,
      kills: 0,
      shots: 0,
      hits: 0,
      lastNoise: null,
      dead: false,
    };
    player.group.rotation.y = player.yaw;

    const npcs = level.patrols.map((patrol, index) => (
      createStormtrooperProxy(scene, patrol[0].clone(), patrol, index)
    ));

    const npcHitMeshes = npcs.flatMap((npc) => npc.hitMeshes);
    const temporaryObjects = [];

    const resize = () => {
      const width = Math.max(1, mount.clientWidth);
      const height = Math.max(1, mount.clientHeight);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };
    resize();
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);

    const hasLineOfSight = (from, to) => {
      const origin = from.clone();
      origin.y += 1.45;
      const target = to.clone();
      target.y += 1.3;
      const direction = target.sub(origin);
      const distance = direction.length();
      if (distance <= 0.001) return true;
      direction.normalize();
      raycaster.set(origin, direction);
      raycaster.far = distance - 0.15;
      const hits = raycaster.intersectObjects(level.losMeshes, false);
      return hits.length === 0;
    };

    const emitNoise = (position, radius, kind) => {
      player.lastNoise = { position: position.clone(), radius, kind, at: nowMs() };
    };

    const flashHitMarker = () => {
      const node = hitMarkerRef.current;
      if (!node) return;
      node.classList.remove('active');
      // force animation restart
      void node.offsetWidth;
      node.classList.add('active');
    };

    const damageNpc = (npc, damage, reason = 'blaster') => {
      if (!npc || npc.state === 'dead') return;
      npc.health = Math.max(0, npc.health - damage);
      npc.alertedBy = reason;
      npc.state = npc.health <= 0 ? 'dead' : (npc.health < 35 ? 'wounded' : 'combat');
      npc.lastSeen = player.group.position.clone();
      npc.lastSeenAt = nowMs();
      if (npc.state === 'dead') {
        setNpcDeadPose(npc);
        player.kills += 1;
      }
      player.hits += 1;
      flashHitMarker();
    };

    const attackBlaster = () => {
      const now = nowMs();
      if (now < player.nextAttackAt || player.dead) return;
      player.nextAttackAt = now + 185;
      player.shots += 1;
      emitNoise(player.group.position, 22, 'blaster');

      raycaster.setFromCamera(new THREE.Vector2(0, 0), camera);
      raycaster.far = 80;
      const hits = raycaster.intersectObjects(npcHitMeshes, false);
      const from = player.group.position.clone().add(new THREE.Vector3(0.35, 1.45, 0));
      let to = raycaster.ray.origin.clone().addScaledVector(raycaster.ray.direction, 55);
      if (hits.length) {
        to = hits[0].point.clone();
        const npc = npcs.find((candidate) => candidate.id === hits[0].object.userData.jkoNpcId);
        damageNpc(npc, 34, 'blaster');
      }
      makeTracer(scene, from, to, 0x76d8ff, 95);
      createAudioPing();
    };

    const attackSaber = () => {
      const now = nowMs();
      if (now < player.nextAttackAt || player.dead) return;
      player.nextAttackAt = now + 540;
      emitNoise(player.group.position, 8, 'saber');
      const forward = new THREE.Vector3(Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      let hit = false;
      for (const npc of npcs) {
        if (npc.state === 'dead') continue;
        const delta = npc.group.position.clone().sub(player.group.position);
        const distance = delta.length();
        delta.y = 0;
        if (distance <= 2.8 && delta.normalize().dot(forward) > 0.05) {
          damageNpc(npc, 68, 'saber');
          hit = true;
        }
      }
      const origin = player.group.position.clone().add(new THREE.Vector3(0.3, 1.65, 0));
      const tip = origin.clone().addScaledVector(forward, 2.2);
      makeTracer(scene, origin, tip, hit ? 0x55ddff : 0x42b5ff, 140);
    };

    const useForceCone = (type) => {
      const config = JKO_FORCE_POWERS[type];
      if (!config || player.force < config.cost || player.dead) return;
      player.force -= config.cost;
      const forward = new THREE.Vector3(Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      emitNoise(player.group.position, 18, type);
      for (const npc of npcs) {
        if (npc.state === 'dead') continue;
        const delta = npc.group.position.clone().sub(player.group.position);
        const distance = delta.length();
        if (distance > config.radius || distance < 0.01) continue;
        const dir = delta.clone().setY(0).normalize();
        if (dir.dot(forward) < 0.28) continue;
        if (!hasLineOfSight(player.group.position, npc.group.position)) continue;
        const impulse = type === 'push' ? dir : dir.multiplyScalar(-1);
        npc.knockVelocity.addScaledVector(impulse, 7.8);
        npc.state = 'combat';
        npc.lastSeen = player.group.position.clone();
        npc.lastSeenAt = nowMs();
        damageNpc(npc, 8, type);
      }
      const origin = player.group.position.clone().add(new THREE.Vector3(0, 1.55, 0));
      const end = origin.clone().addScaledVector(forward, config.radius);
      makeTracer(scene, origin, end, type === 'push' ? 0xb6e7ff : 0x7dafff, 135);
    };

    const useHeal = () => {
      const cfg = JKO_FORCE_POWERS.heal;
      if (player.force < cfg.cost || player.health >= 100 || player.dead) return;
      player.force -= cfg.cost;
      player.health = Math.min(100, player.health + cfg.amount);
    };

    const useSpeed = () => {
      const cfg = JKO_FORCE_POWERS.speed;
      if (player.force < cfg.cost || player.dead) return;
      player.force -= cfg.cost;
      player.speedUntil = nowMs() + cfg.duration;
    };

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      if (document.pointerLockElement !== renderer.domElement) {
        renderer.domElement.requestPointerLock?.();
        return;
      }
      if (player.weapon === 'saber') attackSaber();
      else attackBlaster();
    };

    const onPointerMove = (event) => {
      if (document.pointerLockElement !== renderer.domElement || player.dead) return;
      player.yaw -= event.movementX * 0.00225;
      player.pitch = clamp(player.pitch - event.movementY * 0.0017, -0.65, 0.48);
    };

    const onKeyDown = (event) => {
      keys.add(event.code);
      if (event.repeat) return;
      if (event.code === 'Digit1') player.weapon = 'saber';
      if (event.code === 'Digit2') player.weapon = 'blaster';
      if (event.code === 'KeyF') useForceCone('push');
      if (event.code === 'KeyG') useForceCone('pull');
      if (event.code === 'KeyH') useHeal();
      if (event.code === 'KeyE') useSpeed();
      if (event.code === 'Space' && player.grounded && !player.dead) {
        player.velocityY = 5.8;
        player.grounded = false;
      }
    };
    const onKeyUp = (event) => keys.delete(event.code);

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    const tmpForward = new THREE.Vector3();
    const tmpRight = new THREE.Vector3();
    const desired = new THREE.Vector3();

    const updatePlayer = (dt, time) => {
      if (player.dead) return;

      tmpForward.set(Math.sin(player.yaw), 0, -Math.cos(player.yaw)).normalize();
      tmpRight.set(Math.cos(player.yaw), 0, Math.sin(player.yaw)).normalize();
      desired.set(0, 0, 0);

      if (keys.has('KeyW')) desired.add(tmpForward);
      if (keys.has('KeyS')) desired.sub(tmpForward);
      if (keys.has('KeyD')) desired.add(tmpRight);
      if (keys.has('KeyA')) desired.sub(tmpRight);

      const forceSpeed = time < player.speedUntil;
      const sprinting = keys.has('ShiftLeft') || keys.has('ShiftRight');
      const speed = forceSpeed ? 10.5 : sprinting ? 6.4 : 4.25;

      if (desired.lengthSq() > 0) {
        desired.normalize().multiplyScalar(speed * dt);
        const next = player.group.position.clone().add(desired);
        next.x = clamp(next.x, -6.45, 6.45);
        next.z = clamp(next.z, -53.5, 17.0);
        // Corridor narrows through the security section.
        if (next.z < -2 && next.z > -32.5) next.x = clamp(next.x, -3.55, 3.55);
        player.group.position.x = next.x;
        player.group.position.z = next.z;
      }

      player.velocityY -= 13.5 * dt;
      player.group.position.y += player.velocityY * dt;
      if (player.group.position.y <= 0) {
        player.group.position.y = 0;
        player.velocityY = 0;
        player.grounded = true;
      }

      player.group.rotation.y = player.yaw;
      player.force = Math.min(100, player.force + 10.5 * dt);
    };

    const enemyShoot = (npc, time) => {
      if (time < npc.nextShotAt || player.dead) return;
      npc.nextShotAt = time + 820 + Math.random() * 650;

      const origin = npc.group.position.clone().add(new THREE.Vector3(0.22, 1.5, 0));
      const playerTarget = player.group.position.clone().add(new THREE.Vector3(0, 1.25, 0));
      const range = origin.distanceTo(playerTarget);
      const aimError = 0.11 + Math.min(0.42, range * 0.008);
      playerTarget.x += (Math.random() - 0.5) * aimError * range;
      playerTarget.y += (Math.random() - 0.5) * aimError * range * 0.45;
      playerTarget.z += (Math.random() - 0.5) * aimError * range;

      const hitChance = clamp(0.78 - range * 0.018, 0.24, 0.72);
      const hitsPlayer = Math.random() < hitChance;
      const end = hitsPlayer
        ? player.group.position.clone().add(new THREE.Vector3(0, 1.2, 0))
        : playerTarget;
      makeTracer(scene, origin, end, 0xff5b47, 120);
      if (hitsPlayer) {
        resolveDamage(player, 8 + Math.floor(Math.random() * 5));
        if (player.health <= 0) player.dead = true;
      }
    };

    const updateNpc = (npc, dt, time) => {
      if (npc.state === 'dead') return;

      if (npc.knockVelocity.lengthSq() > 0.01) {
        npc.group.position.addScaledVector(npc.knockVelocity, dt);
        npc.knockVelocity.multiplyScalar(Math.max(0, 1 - dt * 4.8));
        npc.group.position.x = clamp(npc.group.position.x, -6.3, 6.3);
        npc.group.position.z = clamp(npc.group.position.z, -53.2, 16.2);
      }

      const toPlayer = player.group.position.clone().sub(npc.group.position);
      const distance = toPlayer.length();
      const planar = toPlayer.clone().setY(0);
      const direction = planar.lengthSq() > 0.0001 ? planar.normalize() : new THREE.Vector3(0,0,-1);
      const forward = new THREE.Vector3(Math.sin(npc.group.rotation.y), 0, -Math.cos(npc.group.rotation.y));
      const inFov = forward.dot(direction) > 0.18;
      const visible = !player.dead && distance < 20 && inFov && hasLineOfSight(npc.group.position, player.group.position);

      const noise = player.lastNoise;
      const heardNoise = noise && time - noise.at < 1600 && npc.group.position.distanceTo(noise.position) <= noise.radius;

      if (visible) {
        npc.lastSeen = player.group.position.clone();
        npc.lastSeenAt = time;
        npc.state = npc.health < 35 ? 'wounded' : 'combat';
      } else if (heardNoise && npc.state !== 'combat') {
        npc.lastSeen = noise.position.clone();
        npc.investigateUntil = time + 5200;
        npc.state = 'investigate';
        npc.alertedBy = noise.kind;
      } else if (npc.state === 'combat' && time - npc.lastSeenAt > 1450) {
        npc.searchUntil = time + 6500;
        npc.state = 'search';
      }

      if (npc.state === 'patrol' || npc.state === 'idle') {
        const target = npc.patrol[npc.patrolIndex];
        const dist = moveToward(npc.group, target, 1.15, dt);
        if (dist < 0.3) npc.patrolIndex = (npc.patrolIndex + 1) % npc.patrol.length;
        return;
      }

      if (npc.state === 'investigate') {
        if (!npc.lastSeen || time > npc.investigateUntil) {
          npc.state = 'search';
          npc.searchUntil = time + 4800;
          return;
        }
        const dist = moveToward(npc.group, npc.lastSeen, 1.55, dt);
        if (dist < 0.55) {
          npc.state = 'search';
          npc.searchUntil = time + 4800;
        }
        return;
      }

      if (npc.state === 'search') {
        if (time > npc.searchUntil) {
          npc.state = 'patrol';
          npc.lastSeen = null;
          return;
        }
        if (npc.lastSeen) {
          const dist = moveToward(npc.group, npc.lastSeen, 1.15, dt);
          if (dist < 0.9) npc.group.rotation.y += dt * 0.85;
        }
        return;
      }

      if (npc.state === 'combat' || npc.state === 'wounded') {
        npc.group.rotation.y = Math.atan2(direction.x, -direction.z);
        const hasShot = hasLineOfSight(npc.group.position, player.group.position);
        if (distance > 8.5) moveToward(npc.group, player.group.position, npc.state === 'wounded' ? 0.7 : 1.2, dt);
        else if (distance < 4.2) {
          const retreat = npc.group.position.clone().sub(direction.clone().multiplyScalar(2.5));
          moveToward(npc.group, retreat, 0.9, dt);
        }
        if (hasShot && distance < 18) enemyShoot(npc, time);
      }
    };

    const updateCamera = () => {
      const target = player.group.position.clone().add(new THREE.Vector3(0, 1.55, 0));
      const forward = new THREE.Vector3(Math.sin(player.yaw), 0, -Math.cos(player.yaw));
      const right = new THREE.Vector3(Math.cos(player.yaw), 0, Math.sin(player.yaw));
      const horizontalBack = 4.25 * Math.cos(player.pitch);
      const camPos = target.clone()
        .addScaledVector(forward, -horizontalBack)
        .addScaledVector(right, 0.45)
        .add(new THREE.Vector3(0, 1.05 + Math.sin(-player.pitch) * 3.4, 0));
      camera.position.lerp(camPos, 0.22);
      const lookPoint = target.clone().addScaledVector(forward, 5.2);
      lookPoint.y += Math.sin(player.pitch) * 4.2;
      camera.lookAt(lookPoint);
    };

    let lastHudAt = 0;
    const updateHud = (time) => {
      if (time - lastHudAt < 110) return;
      lastHudAt = time;
      const living = npcs.filter((npc) => npc.state !== 'dead').length;
      let objective = 'Enter Kejim Outpost';
      if (player.group.position.z < 2) objective = 'Cross the security corridor';
      if (player.group.position.z < -30) objective = 'Reach the main control room';
      if (living === 0) objective = 'Kejim Outpost sector secure';

      setHud({
        health: Math.round(player.health),
        armor: Math.round(player.armor),
        force: Math.round(player.force),
        weapon: player.weapon === 'saber' ? 'Lightsaber' : 'Bryar Blaster',
        objective,
        enemies: living,
        kills: player.kills,
        shots: player.shots,
        hits: player.hits,
        state: player.dead ? 'down' : (document.pointerLockElement === renderer.domElement ? 'engaged' : 'ready'),
        pointerLocked: document.pointerLockElement === renderer.domElement,
      });
    };

    const animate = () => {
      if (disposed) return;
      animationFrame = requestAnimationFrame(animate);
      const dt = Math.min(clock.getDelta(), 0.05);
      const time = nowMs();
      updatePlayer(dt, time);
      npcs.forEach((npc) => updateNpc(npc, dt, time));
      updateCamera();
      updateHud(time);
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (document.pointerLockElement === renderer.domElement) document.exitPointerLock?.();
      temporaryObjects.forEach((object) => scene.remove(object));
      disposeObject3D(scene);
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  const accuracy = hud.shots > 0 ? Math.round((hud.hits / hud.shots) * 100) : 0;

  return (
    <div className="jko-stage" ref={mountRef}>
      <div className="jko-hud">
        <div className="jko-status">
          {JEDI_OUTCAST_RECONSTRUCTION.firstLevel.label} · {hud.state}
          {!hud.pointerLocked && ' · click the world to capture mouse'}
        </div>

        <div className="jko-hud-panel">
          <div className="jko-hud-title">Mission Objective</div>
          <div className="jko-objective">{hud.objective}</div>
          <div className="jko-bars">
            <div className="jko-bar-row"><span>Health</span><div className="jko-bar jko-bar-health"><span style={{ width: `${hud.health}%` }} /></div><b>{hud.health}</b></div>
            <div className="jko-bar-row"><span>Armor</span><div className="jko-bar jko-bar-armor"><span style={{ width: `${hud.armor}%` }} /></div><b>{hud.armor}</b></div>
            <div className="jko-bar-row"><span>Force</span><div className="jko-bar jko-bar-force"><span style={{ width: `${hud.force}%` }} /></div><b>{hud.force}</b></div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[8px] uppercase tracking-[.12em] text-white/35">
            <span>{hud.weapon}</span>
            <span>{hud.kills} Kills · {accuracy}% Accuracy</span>
          </div>
        </div>

        <div className="jko-powers">
          <strong>Combat / Force</strong>
          <div className="jko-power-line"><span>Lightsaber</span><kbd>1</kbd></div>
          <div className="jko-power-line"><span>Bryar Blaster</span><kbd>2</kbd></div>
          <div className="jko-power-line"><span>Force Push</span><kbd>F</kbd></div>
          <div className="jko-power-line"><span>Force Pull</span><kbd>G</kbd></div>
          <div className="jko-power-line"><span>Force Heal</span><kbd>H</kbd></div>
          <div className="jko-power-line"><span>Force Speed</span><kbd>E</kbd></div>
          <div className="jko-power-line"><span>Enemies Active</span><kbd>{hud.enemies}</kbd></div>
        </div>

        <div className="jko-crosshair" />
        <div ref={hitMarkerRef} className="jko-hitmarker" />
        <div className="jko-help">
          WASD move · Shift sprint · Space jump · mouse aim · left click attack · 1 saber · 2 blaster · F push · G pull · H heal · E speed
        </div>
      </div>
    </div>
  );
}
