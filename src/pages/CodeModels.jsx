import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, ChevronLeft, ChevronRight, Loader2, Play, RotateCcw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { base44 } from '@/api/base44Client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

function getExt(url = '', fileType = '') {
  if (fileType) return fileType.toLowerCase();
  return (url.split('?')[0].split('.').pop() || '').toLowerCase();
}

function CodeModelViewer({ model, selectedAnimation, onAnimationsDetected }) {
  const hostRef = useRef(null);
  const mixerRef = useRef(null);
  const actionsRef = useRef(new Map());
  const activeActionRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !model?.file_url) return;

    setLoading(true);
    setError('');
    actionsRef.current = new Map();
    activeActionRef.current = null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x080b13);
    const camera = new THREE.PerspectiveCamera(38, Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight), 0.1, 1000);
    camera.position.set(0, 1.6, 5.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x152038, 1.8));
    const key = new THREE.DirectionalLight(0xffffff, 2.0);
    key.position.set(4, 7, 5);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0x6da3ff, 1.2);
    rim.position.set(-4, 4, -5);
    scene.add(rim);

    const grid = new THREE.GridHelper(8, 28, 0x33415f, 0x172033);
    grid.position.y = -1.35;
    scene.add(grid);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.1, 0);

    const manager = new THREE.LoadingManager();
    if (model.bundle_manifest && typeof model.bundle_manifest === 'object') {
      manager.setURLModifier((url) => {
        try {
          const u = new URL(url, window.location.href);
          const path = decodeURIComponent(u.pathname).replace(/^\//, '');
          const file = path.split('/').pop();
          return model.bundle_manifest[path] || model.bundle_manifest[file] || model.bundle_manifest[url] || url;
        } catch {
          return model.bundle_manifest[url] || url;
        }
      });
    }

    const ext = getExt(model.file_url, model.file_type);
    const loader = ext === 'fbx' ? new FBXLoader(manager) : new GLTFLoader(manager);

    const finish = (asset) => {
      const object = asset?.scene || asset;
      if (!object?.isObject3D) throw new Error('Unsupported 3D asset');
      const box = new THREE.Box3().setFromObject(object);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.75 / maxDim;
      object.scale.multiplyScalar(scale);
      object.position.sub(center.multiplyScalar(scale));
      scene.add(object);

      const clips = (asset?.animations || object?.animations || []).filter(Boolean);
      if (clips.length) {
        const mixer = new THREE.AnimationMixer(object);
        mixerRef.current = mixer;
        const mapped = clips.map((clip) => {
          const action = mixer.clipAction(clip);
          action.loop = THREE.LoopRepeat;
          actionsRef.current.set(clip.name || `Animation ${actionsRef.current.size + 1}`, action);
          return { name: clip.name || `Animation ${actionsRef.current.size + 1}`, duration: clip.duration };
        });
        onAnimationsDetected(mapped);
      } else {
        onAnimationsDetected([]);
      }
      setLoading(false);
    };

    loader.load(model.file_url, finish, undefined, (err) => {
      console.error(err);
      setError('Unable to load this 3D model. Verify that its file URL is reachable and that the format is GLB, GLTF, or FBX.');
      setLoading(false);
      onAnimationsDetected([]);
    });

    let frame;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      mixerRef.current?.update(dt);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resize = () => {
      camera.aspect = Math.max(1, host.clientWidth) / Math.max(1, host.clientHeight);
      camera.updateProjectionMatrix();
      renderer.setSize(host.clientWidth, host.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', resize);
      controls.dispose();
      mixerRef.current?.stopAllAction();
      mixerRef.current = null;
      renderer.dispose();
      renderer.domElement.remove();
      actionsRef.current.clear();
    };
  }, [model?.id, model?.file_url, model?.file_type]);

  useEffect(() => {
    if (!selectedAnimation) return;
    const actions = actionsRef.current;
    const next = actions.get(selectedAnimation);
    if (!next) return;
    activeActionRef.current?.fadeOut(0.2);
    next.reset().fadeIn(0.2).play();
    activeActionRef.current = next;
  }, [selectedAnimation]);

  return (
    <div className="relative h-full min-h-[640px] overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
      <div ref={hostRef} className="absolute inset-0" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-sm text-slate-300"><Loader2 className="h-5 w-5 animate-spin" /> Loading model...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-x-6 top-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
      )}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-4 py-2 text-[11px] text-slate-400 backdrop-blur-xl">
        Drag to orbit · right-drag to pan · wheel to zoom
      </div>
    </div>
  );
}

export default function CodeModels() {
  const { data: models = [], isLoading } = useQuery({
    queryKey: ['codeModels'],
    queryFn: async () => {
      const rows = await base44.entities.Model3D.list('-created_date', 200);
      const generated = base44.entities.TripoModel?.list ? await base44.entities.TripoModel.list('-created_date', 200).catch(() => []) : [];
      const local = rows
        .filter((m) => (m.tags || []).some((tag) => ['code-model', 'atom-xe-created', 'ai-generated'].includes(String(tag).toLowerCase())) || String(m.category || '').toLowerCase() === 'code-model')
        .map((m) => ({ ...m, source: 'Model3D', displayName: m.name }));
      const remote = generated
        .filter((m) => m.status === 'success' && m.model_url)
        .map((m) => ({ id: `tripo-${m.id}`, name: m.name, displayName: m.name, file_url: m.model_url, file_type: 'glb', description: m.prompt, source: 'TripoModel' }));
      return [...local, ...remote];
    },
  });

  const [selectedId, setSelectedId] = useState(null);
  const [animations, setAnimations] = useState([]);
  const [selectedAnimation, setSelectedAnimation] = useState('');

  const selectedModel = useMemo(() => models.find((m) => m.id === selectedId) || models[0] || null, [models, selectedId]);

  useEffect(() => {
    if (models.length && !selectedId) setSelectedId(models[0].id);
  }, [models, selectedId]);

  useEffect(() => {
    setAnimations([]);
    setSelectedAnimation('');
  }, [selectedModel?.id]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Admin · 3D Creation Studio</div>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Code Models</h1>
            <p className="mt-1 text-sm text-slate-400">Models created or generated by Atom XE, with live animation playback.</p>
          </div>
          {selectedModel && <Badge variant="outline" className="border-white/10 text-slate-300">{selectedModel.source}</Badge>}
        </div>

        <div className="grid min-h-[720px] grid-cols-[15%_70%_15%] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] shadow-2xl">
          <aside className="min-h-[720px] border-r border-white/10 bg-black/10 p-3">
            <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Models</div>
            <div className="space-y-2 overflow-y-auto pr-1">
              {isLoading && <div className="px-2 py-4 text-xs text-slate-500">Loading...</div>}
              {!isLoading && !models.length && <div className="px-2 py-4 text-xs leading-5 text-slate-500">No code models yet. Add <span className="text-slate-300">code-model</span> to a Model3D tag/category, or generate a successful Tripo model.</div>}
              {models.map((model) => (
                <button key={model.id} onClick={() => setSelectedId(model.id)} className={`w-full rounded-2xl border p-2 text-left transition ${selectedModel?.id === model.id ? 'border-white/20 bg-white/10' : 'border-transparent bg-transparent hover:bg-white/[0.04]'}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-900"><Box className="h-4 w-4 text-slate-400" /></div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-slate-200">{model.displayName || model.name}</div>
                      <div className="truncate text-[10px] text-slate-500">{model.file_type || 'model'}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 bg-slate-950/30 p-4 md:p-5">
            {selectedModel ? (
              <div className="flex h-full min-h-[680px] flex-col">
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <div className="text-lg font-bold">{selectedModel.displayName || selectedModel.name}</div>
                    <div className="text-xs text-slate-500">{selectedModel.description || 'Interactive 3D code model preview'}</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-white/10 bg-white/[0.03] text-slate-300" onClick={() => { setSelectedAnimation(''); activeActionRef; }}>
                    <RotateCcw className="mr-2 h-3.5 w-3.5" /> Reset View
                  </Button>
                </div>
                <div className="min-h-0 flex-1"><CodeModelViewer model={selectedModel} selectedAnimation={selectedAnimation} onAnimationsDetected={setAnimations} /></div>
              </div>
            ) : (
              <div className="flex h-full min-h-[680px] items-center justify-center text-sm text-slate-500">Select a model from the left.</div>
            )}
          </main>

          <aside className="min-h-[720px] border-l border-white/10 bg-black/10 p-3">
            <div className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">Animations</div>
            <div className="space-y-2 overflow-y-auto pr-1">
              {!selectedModel && <div className="px-2 py-4 text-xs text-slate-500">Select a model first.</div>}
              {selectedModel && !animations.length && <div className="px-2 py-4 text-xs leading-5 text-slate-500">This model does not expose embedded animation clips.</div>}
              {animations.map((animation) => (
                <button key={animation.name} onClick={() => setSelectedAnimation(animation.name)} className={`w-full rounded-2xl border px-2.5 py-2 text-left text-xs transition ${selectedAnimation === animation.name ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-100' : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'}`}>
                  <div className="flex items-center gap-2"><Play className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{animation.name}</span></div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
