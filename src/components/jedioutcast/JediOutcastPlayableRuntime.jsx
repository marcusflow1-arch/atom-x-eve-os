import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshBVH } from 'three-mesh-bvh';
import { ArrowLeft, Loader2, RotateCcw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { parseJediOutcastRbsp } from './rbsp';
import { JEDI_CAMERA_CONTRACT, jediViewportStyle } from './cameraContract';
import { JediCameraSystem } from './camera/JediCameraSystem';

const KEJIM_PATH = 'maps/kejim_post.bsp';

// Original single-player movement values from Raven source:
// g_speed=250, g_gravity=800, JUMP_VELOCITY=225,
// pm_accelerate=12, pm_airaccelerate=4, pm_friction=6, pm_stopspeed=100.
const MOVE_SPEED = 250;
const GRAVITY = 800;
const JUMP_VELOCITY = 225;
const GROUND_ACCEL = 12;
const AIR_ACCEL = 4;
const FRICTION = 6;
const STOP_SPEED = 100;

// Original player vertical bounds from code/game/bg_public.h.
// SP uses -24..40 and a 36-unit standing view height.
// The horizontal SP player radius is represented as a 15-unit capsule here.
const PLAYER_RADIUS = 15;
const CAPSULE_BOTTOM = -9;
const CAPSULE_TOP = 25;

function unwrap(value) {
  return value?.data ?? value;
}

function buildGeometry(parsed) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(parsed.geometry.positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(parsed.geometry.normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(parsed.geometry.uvs, 2));
  geometry.setIndex(parsed.geometry.indices);
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  geometry.boundsTree = new MeshBVH(geometry, { maxLeafTris: 12 });
  return geometry;
}

function KejimWorld({ geometry }) {
  return (
    <mesh geometry={geometry} frustumCulled={false}>
      <meshStandardMaterial
        color="#747f89"
        roughness={0.92}
        metalness={0.03}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function KejimPlayer({ geometry, parsed, onLockChange }) {
  const { camera, gl } = useThree();
  const spawn = useMemo(() => {
    if (!parsed.playerStart?.position) throw new Error('Original info_player_start is missing from Kejim Outpost.');
    return new THREE.Vector3(...parsed.playerStart.position);
  }, [parsed]);

  const origin = useRef(spawn.clone());
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(THREE.MathUtils.degToRad(-(parsed.playerStart?.yaw || 0) + 90));
  const pitch = useRef(0);
  const grounded = useRef(false);
  const keys = useRef(new Set());
  const jumpLatch = useRef(false);

  const tempBox = useMemo(() => new THREE.Box3(), []);
  const capsuleSegment = useMemo(() => new THREE.Line3(), []);
  const triPoint = useMemo(() => new THREE.Vector3(), []);
  const capsulePoint = useMemo(() => new THREE.Vector3(), []);
  const correction = useMemo(() => new THREE.Vector3(), []);
  const forward = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const wishDir = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const cameraSystem = useMemo(
    () => new JediCameraSystem({ camera, collisionGeometry: geometry }),
    [camera, geometry],
  );

  useEffect(() => {
    origin.current.copy(spawn);
    velocity.current.set(0, 0, 0);
    // Use the Raven-derived camera system from the first playable frame.
    cameraSystem.snapGameplay({
      playerPosition: spawn,
      yaw: yaw.current,
      pitch: pitch.current,
    });
  }, [cameraSystem, spawn]);

  useEffect(() => {
    const canvas = gl.domElement;

    const pointerChange = () => {
      const locked = document.pointerLockElement === canvas;
      onLockChange?.(locked);
      if (!locked) keys.current.clear();
    };
    const mouseMove = event => {
      if (document.pointerLockElement !== canvas) return;
      yaw.current -= event.movementX * JEDI_CAMERA_CONTRACT.mouseSensitivity;
      pitch.current -= event.movementY * JEDI_CAMERA_CONTRACT.mouseSensitivity;
      pitch.current = THREE.MathUtils.clamp(
        pitch.current,
        JEDI_CAMERA_CONTRACT.minPitch,
        JEDI_CAMERA_CONTRACT.maxPitch,
      );
    };
    const keyDown = event => {
      if (document.pointerLockElement !== canvas) return;
      keys.current.add(event.code);
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'Space'].includes(event.code)) event.preventDefault();
    };
    const keyUp = event => {
      keys.current.delete(event.code);
      if (event.code === 'Space') jumpLatch.current = false;
    };
    const click = () => {
      if (document.pointerLockElement !== canvas) canvas.requestPointerLock?.();
    };

    document.addEventListener('pointerlockchange', pointerChange);
    document.addEventListener('mousemove', mouseMove);
    window.addEventListener('keydown', keyDown, { passive: false });
    window.addEventListener('keyup', keyUp);
    canvas.addEventListener('click', click);

    return () => {
      document.removeEventListener('pointerlockchange', pointerChange);
      document.removeEventListener('mousemove', mouseMove);
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      canvas.removeEventListener('click', click);
    };
  }, [gl, onLockChange]);

  const collideCapsule = currentOrigin => {
    capsuleSegment.start.set(currentOrigin.x, currentOrigin.y + CAPSULE_BOTTOM, currentOrigin.z);
    capsuleSegment.end.set(currentOrigin.x, currentOrigin.y + CAPSULE_TOP, currentOrigin.z);

    tempBox.makeEmpty();
    tempBox.expandByPoint(capsuleSegment.start);
    tempBox.expandByPoint(capsuleSegment.end);
    tempBox.min.addScalar(-PLAYER_RADIUS);
    tempBox.max.addScalar(PLAYER_RADIUS);

    geometry.boundsTree.shapecast({
      intersectsBounds: box => box.intersectsBox(tempBox),
      intersectsTriangle: triangle => {
        const distance = triangle.closestPointToSegment(capsuleSegment, triPoint, capsulePoint);
        if (distance >= PLAYER_RADIUS) return false;

        const depth = PLAYER_RADIUS - distance;
        correction.subVectors(capsulePoint, triPoint);
        if (correction.lengthSq() < 1e-10) {
          triangle.getNormal(correction);
        } else {
          correction.normalize();
        }
        capsuleSegment.start.addScaledVector(correction, depth);
        capsuleSegment.end.addScaledVector(correction, depth);
        return false;
      },
    });

    return currentOrigin.set(
      capsuleSegment.start.x,
      capsuleSegment.start.y - CAPSULE_BOTTOM,
      capsuleSegment.start.z,
    );
  };

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const v = velocity.current;
    const pos = origin.current;

    forward.set(0, 0, -1).applyAxisAngle(up, yaw.current);
    right.set(1, 0, 0).applyAxisAngle(up, yaw.current);
    wishDir.set(0, 0, 0);

    if (keys.current.has('KeyW')) wishDir.add(forward);
    if (keys.current.has('KeyS')) wishDir.sub(forward);
    if (keys.current.has('KeyD')) wishDir.add(right);
    if (keys.current.has('KeyA')) wishDir.sub(right);
    wishDir.y = 0;

    if (grounded.current) {
      const horizontalSpeed = Math.hypot(v.x, v.z);
      if (horizontalSpeed > 0) {
        const control = Math.max(horizontalSpeed, STOP_SPEED);
        const drop = control * FRICTION * dt;
        const newSpeed = Math.max(0, horizontalSpeed - drop);
        const ratio = newSpeed / horizontalSpeed;
        v.x *= ratio;
        v.z *= ratio;
      }
    }

    if (wishDir.lengthSq() > 0) {
      wishDir.normalize();
      const currentSpeed = v.x * wishDir.x + v.z * wishDir.z;
      const addSpeed = MOVE_SPEED - currentSpeed;
      if (addSpeed > 0) {
        const accel = grounded.current ? GROUND_ACCEL : AIR_ACCEL;
        const accelSpeed = Math.min(addSpeed, accel * dt * MOVE_SPEED);
        v.x += accelSpeed * wishDir.x;
        v.z += accelSpeed * wishDir.z;
      }
    }

    if (grounded.current && keys.current.has('Space') && !jumpLatch.current) {
      v.y = JUMP_VELOCITY;
      grounded.current = false;
      jumpLatch.current = true;
    }

    v.y -= GRAVITY * dt;

    const before = pos.clone();
    pos.addScaledVector(v, dt);
    const attempted = pos.clone();
    collideCapsule(pos);

    correction.subVectors(pos, attempted);
    const wasFalling = v.y <= 0;
    const groundPush = correction.y > Math.max(0.01, Math.abs(v.y * dt) * 0.2);
    grounded.current = wasFalling && groundPush;

    if (correction.lengthSq() > 1e-8) {
      if (grounded.current) {
        v.y = 0;
      } else {
        const normal = correction.normalize();
        const intoSurface = v.dot(normal);
        if (intoSurface < 0) v.addScaledVector(normal, -intoSurface);
      }
    }

    // Preserve the original spawn as a deterministic recovery point if the
    // player leaves valid map space while this traversal layer is being built.
    if (!Number.isFinite(pos.x + pos.y + pos.z) || pos.y < spawn.y - 4096) {
      pos.copy(spawn);
      v.set(0, 0, 0);
    }

    // If collision completely rejected a frame, avoid accumulating downward
    // speed while standing on a surface.
    if (grounded.current && pos.distanceToSquared(before) < 1e-8) v.y = 0;

    // Raven-derived gameplay follow camera. It owns framing, damping, collision
    // pull-in and projection so the player controller no longer has camera math
    // scattered through the movement loop.
    cameraSystem.updateGameplay({
      playerPosition: pos,
      yaw: yaw.current,
      pitch: pitch.current,
      delta: dt,
    });
  });

  return null;
}

function PlayableCanvas({ parsed, onLockChange }) {
  const geometry = useMemo(() => buildGeometry(parsed), [parsed]);

  useEffect(() => () => {
    geometry.boundsTree = null;
    geometry.dispose();
  }, [geometry]);

  return (
    <div style={jediViewportStyle()} className="relative overflow-hidden bg-black">
      <Canvas
        gl={{ antialias: true, alpha: false }}
        dpr={1}
        camera={{
          fov: JEDI_CAMERA_CONTRACT.fov,
          near: JEDI_CAMERA_CONTRACT.near,
          far: JEDI_CAMERA_CONTRACT.far,
        }}
        style={{ width: '100%', height: '100%', background: '#080b10' }}
      >
        <color attach="background" args={['#080b10']} />
        <ambientLight intensity={1.35} />
        <directionalLight position={[1200, 2200, 900]} intensity={1.7} />
        <KejimWorld geometry={geometry} />
        <KejimPlayer geometry={geometry} parsed={parsed} onLockChange={onLockChange} />
      </Canvas>
    </div>
  );
}

export default function JediOutcastPlayableRuntime({ onBack }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState('');
  const [parsed, setParsed] = useState(null);
  const [locked, setLocked] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setPhase('loading');
      setError('');
      setParsed(null);

      try {
        if (user?.role !== 'admin') {
          throw new Error('Jedi Outcast development playback is currently restricted to the app admin.');
        }

        const imported = unwrap(await base44.functions.invoke('jediOutcastSource', {
          action: 'importPath',
          path: KEJIM_PATH,
          category: 'map',
        }));
        if (!imported?.success || !imported?.asset?.storage_url) {
          throw new Error(imported?.error || 'The original Kejim Outpost BSP could not be resolved.');
        }

        const response = await fetch(imported.asset.storage_url);
        if (!response.ok) throw new Error(`Kejim Outpost returned HTTP ${response.status}.`);
        const bytes = await response.arrayBuffer();
        const next = parseJediOutcastRbsp(bytes);

        if (!next.playerStart) {
          throw new Error('The authentic Kejim BSP did not expose its original info_player_start.');
        }

        if (!cancelled) {
          setParsed(next);
          setPhase('ready');
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || String(err));
          setPhase('error');
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [revision, user?.role]);

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-black text-white select-none">
      {parsed && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <PlayableCanvas parsed={parsed} onLockChange={setLocked} />
        </div>
      )}

      {phase === 'loading' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-white/70" />
            <div className="mt-4 text-sm tracking-[0.18em] uppercase text-white/50">Loading Kejim Outpost</div>
          </div>
        </div>
      )}

      {phase === 'error' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black p-6">
          <div className="max-w-lg rounded-xl border border-red-400/25 bg-red-950/30 p-5">
            <div className="font-semibold">Kejim Outpost could not start</div>
            <p className="mt-2 text-sm text-red-100/75">{error}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setRevision(v => v + 1)} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4" /> Retry
              </button>
              <button onClick={onBack} className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-sm">
                Return to Luna
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'ready' && !locked && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 pointer-events-none">
          <div className="rounded-xl border border-white/15 bg-black/70 backdrop-blur-md px-6 py-5 text-center">
            <div className="text-lg font-semibold">Kejim Outpost</div>
            <div className="mt-2 text-sm text-white/60">Click the game to capture the mouse</div>
            <div className="mt-3 text-xs text-white/45">WASD move · Space jump · Mouse look · Esc release mouse</div>
          </div>
        </div>
      )}

      {phase === 'ready' && (
        <>
          <button
            type="button"
            onClick={onBack}
            className="absolute z-40 left-3 top-3 h-9 px-3 rounded-lg border border-white/10 bg-black/55 hover:bg-black/75 backdrop-blur flex items-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Luna
          </button>
          <div className="absolute z-10 left-1/2 top-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70 pointer-events-none" />
        </>
      )}
    </section>
  );
}
