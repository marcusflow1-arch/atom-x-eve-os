import React, { Suspense, useEffect, useMemo, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ArrowLeft, Database, Loader2, RefreshCw, ShieldCheck, Triangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/components/auth/AuthContext';
import { parseJediOutcastRbsp } from './rbsp';

const KEJIM_PATH = 'maps/kejim_post.bsp';

function unwrap(value) {
  return value?.data ?? value;
}

function formatBytes(value = 0) {
  const n = Number(value) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}

function FitCamera({ geometry }) {
  const { camera } = useThree();
  useEffect(() => {
    if (!geometry) return;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
    const sphere = geometry.boundingSphere;
    if (!sphere) return;
    camera.near = Math.max(0.1, sphere.radius / 10000);
    camera.far = Math.max(10000, sphere.radius * 20);
    camera.position.set(
      sphere.center.x + sphere.radius * 0.85,
      sphere.center.y + sphere.radius * 0.55,
      sphere.center.z + sphere.radius * 0.85,
    );
    camera.lookAt(sphere.center);
    camera.updateProjectionMatrix();
  }, [camera, geometry]);
  return null;
}

function OriginalMapMesh({ parsed }) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const { positions, normals, uvs, indices } = parsed.geometry;
    g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices);
    g.computeBoundingSphere();
    return g;
  }, [parsed]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <>
      <FitCamera geometry={geometry} />
      <mesh geometry={geometry}>
        {/* Diagnostic material only. Geometry is original RBSP data; exact JK2 shader
            recreation is deliberately not faked and will replace this material later. */}
        <meshBasicMaterial color="#bac6d6" wireframe transparent opacity={0.72} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

function ReconstructionCanvas({ parsed }) {
  return (
    <Canvas
      gl={{ antialias: true, alpha: false }}
      camera={{ fov: 70, near: 0.1, far: 100000 }}
      style={{ width: '100%', height: '100%', background: '#05080d' }}
    >
      <color attach="background" args={['#05080d']} />
      <Suspense fallback={null}>
        <OriginalMapMesh parsed={parsed} />
      </Suspense>
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </Canvas>
  );
}

export default function ReconstructionRuntime({ onBack }) {
  const { user } = useAuth();
  const [phase, setPhase] = useState('checking');
  const [error, setError] = useState('');
  const [manifest, setManifest] = useState(null);
  const [mapAsset, setMapAsset] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      setPhase('checking');
      setError('');
      setParsed(null);

      try {
        if (user?.role !== 'admin') {
          throw new Error('The reconstruction preview is currently admin-only while original retail assets are being rebuilt into editable Base44 content.');
        }

        const status = unwrap(await base44.functions.invoke('jediOutcastSource', { action: 'status' }));
        if (!status?.success) throw new Error(status?.error || 'Could not read the Jedi Outcast reconstruction manifest.');
        if (cancelled) return;
        setManifest(status);

        setPhase('importing-map');
        const imported = unwrap(await base44.functions.invoke('jediOutcastSource', {
          action: 'importPath',
          path: KEJIM_PATH,
          category: 'map',
        }));
        if (!imported?.success || !imported?.asset?.storage_url) {
          throw new Error(imported?.error || 'Kejim Outpost could not be imported from the canonical retail PK3s.');
        }
        if (cancelled) return;
        setMapAsset(imported.asset);

        setPhase('loading-map');
        const response = await fetch(imported.asset.storage_url);
        if (!response.ok) throw new Error(`Base44 map cache returned HTTP ${response.status}.`);
        const bytes = await response.arrayBuffer();
        if (cancelled) return;

        setPhase('parsing-map');
        const next = parseJediOutcastRbsp(bytes);
        if (cancelled) return;
        setParsed(next);
        setPhase('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err?.message || String(err));
        setPhase('error');
      }
    }

    boot();
    return () => { cancelled = true; };
  }, [revision, user?.role]);

  const statusLabel = {
    checking: 'Reading Base44 reconstruction manifest',
    'importing-map': 'Extracting original Kejim Outpost from your retail PK3',
    'loading-map': 'Loading Base44-cached original map',
    'parsing-map': 'Parsing Raven RBSP geometry',
    ready: 'Original Kejim geometry loaded',
    error: 'Reconstruction stopped',
  }[phase] || phase;

  return (
    <section className="relative h-screen w-screen overflow-hidden bg-[#05080d] text-white">
      <div className="absolute inset-0">
        {parsed ? (
          <ReconstructionCanvas parsed={parsed} />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(27,42,62,.32),transparent_58%)]">
            <div className="text-center">
              {phase !== 'error' && <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-cyan-300" />}
              <div className="text-sm uppercase tracking-[0.22em] text-white/45">Jedi Outcast Reconstruction</div>
              <div className="mt-2 text-lg text-white/85">{statusLabel}</div>
            </div>
          </div>
        )}
      </div>

      <header className="absolute top-0 left-0 right-0 z-20 h-14 px-4 flex items-center gap-3 bg-black/55 backdrop-blur-xl border-b border-white/10">
        <button onClick={onBack} className="h-9 px-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center gap-2 text-sm">
          <ArrowLeft className="w-4 h-4" /> Luna
        </button>
        <div className="h-6 w-px bg-white/10" />
        <div className="min-w-0">
          <div className="font-semibold tracking-wide truncate">Star Wars Jedi Knight II: Jedi Outcast — Reconstruction</div>
          <div className="text-[11px] text-white/45 truncate">{statusLabel}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="hidden md:flex items-center gap-1.5 text-xs text-emerald-300/80">
            <ShieldCheck className="w-3.5 h-3.5" /> Canonical source locked
          </span>
          <button
            type="button"
            onClick={() => setRevision(v => v + 1)}
            className="h-9 w-9 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 flex items-center justify-center"
            title="Reload reconstruction"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      <aside className="absolute z-20 left-4 top-[72px] w-[330px] max-h-[calc(100vh-92px)] overflow-auto rounded-xl border border-white/10 bg-black/58 backdrop-blur-xl shadow-2xl">
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Database className="w-4 h-4 text-cyan-300" /> Base44 Reconstruction State
          </div>
          <p className="mt-2 text-xs leading-5 text-white/50">
            This preview no longer asks for files from your PC. Original content is resolved from the Drive/PK3 sources registered in Base44, cached into Base44 storage, then decoded by the editable web runtime.
          </p>
        </div>

        {error ? (
          <div className="p-4">
            <div className="rounded-lg border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div>
            <p className="mt-3 text-xs text-white/45">No substitute map or model is generated when an original source file cannot be resolved.</p>
          </div>
        ) : (
          <div className="p-4 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/[0.04] p-3">
                <div className="text-white/40">Source roots</div>
                <div className="mt-1 text-lg font-semibold">{manifest?.counts?.roots ?? '—'}</div>
              </div>
              <div className="rounded-lg bg-white/[0.04] p-3">
                <div className="text-white/40">Definitions</div>
                <div className="mt-1 text-lg font-semibold">{manifest?.counts?.definitions ?? '—'}</div>
              </div>
            </div>

            {mapAsset && (
              <div>
                <div className="text-white/40 mb-1">Canonical map</div>
                <code className="block break-all text-cyan-200/80">{mapAsset.path}</code>
                <div className="mt-1 text-white/40">{formatBytes(mapAsset.byte_size)} · {mapAsset.pk3_name || 'retail source'}</div>
              </div>
            )}

            {parsed && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 font-semibold text-white/80"><Triangle className="w-3.5 h-3.5" /> Parsed RBSP</div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-white/55">
                  <span>Surfaces</span><span className="text-right text-white/80">{parsed.stats.surfaces.toLocaleString()}</span>
                  <span>Source vertices</span><span className="text-right text-white/80">{parsed.stats.vertices.toLocaleString()}</span>
                  <span>Triangles</span><span className="text-right text-white/80">{Math.round(parsed.stats.renderTriangles).toLocaleString()}</span>
                  <span>Patches</span><span className="text-right text-white/80">{parsed.stats.patches.toLocaleString()}</span>
                  <span>Shaders referenced</span><span className="text-right text-white/80">{parsed.stats.shaders.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-white/40 leading-5">
                  Wireframe is intentionally a reconstruction diagnostic. It uses the original BSP draw surfaces; exact Raven shader/lightmap material recreation is not being faked.
                </div>
              </div>
            )}
          </div>
        )}
      </aside>
    </section>
  );
}
