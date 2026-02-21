import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { RotateCcw, Move, Save, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export default function AttachmentEditor() {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const controlsRef = useRef(null);
  const characterRef = useRef(null);
  const attachedMeshRef = useRef(null);
  const mixerRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const boneListRef = useRef([]);

  const [selectedCharacter, setSelectedCharacter] = useState('c1');
  const [selectedBone, setSelectedBone] = useState('mixamorigSpine2');
  const [boneList, setBoneList] = useState([]);
  const [attachmentUrl, setAttachmentUrl] = useState('https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/53379b78d_stylized_emerald_sword.glb');
  const [position, setPosition] = useState({ x: 0, y: 15, z: -10 });
  const [rotation, setRotation] = useState({ x: 180, y: 0, z: 135 });
  const [scale, setScale] = useState(50);
  const [isLoaded, setIsLoaded] = useState(false);

  const CHARACTER_URLS = {
    c1: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/3f915913a_ErikaArcher.fbx',
    ybot: 'https://base44.app/api/apps/6876751a602125f45f1861b9/files/public/6876751a602125f45f1861b9/608211a0f_YBot1.fbx',
  };

  const { data: adminAnimations = [] } = useQuery({
    queryKey: ['adminAnimations'],
    queryFn: () => base44.entities.AnimationFBX.list(),
    staleTime: Infinity,
  });

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.01, 100);
    camera.position.set(0, 1, 3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.8, 0);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
    const dir = new THREE.DirectionalLight(0xffffff, 2);
    dir.position.set(5, 10, 5);
    scene.add(dir);

    // Grid
    const grid = new THREE.GridHelper(10, 20, 0x444444, 0x333333);
    scene.add(grid);

    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      if (mixerRef.current) mixerRef.current.update(delta);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Load character
  const loadCharacter = async () => {
    const scene = sceneRef.current;
    if (!scene) return;

    // Remove old character
    if (characterRef.current) {
      scene.remove(characterRef.current);
      characterRef.current = null;
    }
    if (attachedMeshRef.current) {
      attachedMeshRef.current = null;
    }

    setIsLoaded(false);
    const url = CHARACTER_URLS[selectedCharacter];
    const loader = new FBXLoader();

    loader.load(url, async (fbx) => {
      fbx.scale.set(0.01, 0.01, 0.01);
      fbx.position.set(0, 0, 0);

      fbx.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Collect bones
      const bones = [];
      fbx.traverse(child => {
        if (child.isBone) bones.push(child.name);
      });
      setBoneList(bones);
      boneListRef.current = bones;

      characterRef.current = fbx;
      scene.add(fbx);

      // Load idle animation
      const mixer = new THREE.AnimationMixer(fbx);
      mixerRef.current = mixer;
      
      const idleAnim = adminAnimations.find(a => (a.name || '').toLowerCase().trim() === 'idle');
      if (idleAnim) {
        const animFbx = await new FBXLoader().loadAsync(idleAnim.file_url);
        if (animFbx.animations.length > 0) {
          const action = mixer.clipAction(animFbx.animations[0]);
          action.play();
        }
      }

      setIsLoaded(true);
    });
  };

  useEffect(() => {
    if (sceneRef.current && adminAnimations.length >= 0) {
      loadCharacter();
    }
  }, [selectedCharacter, adminAnimations]);

  // Attach object to bone
  const attachObject = () => {
    if (!characterRef.current || !attachmentUrl) return;

    // Remove old attached mesh
    if (attachedMeshRef.current) {
      const parent = attachedMeshRef.current.parent;
      if (parent) parent.remove(attachedMeshRef.current);
      attachedMeshRef.current = null;
    }

    // Find bone
    let bone = null;
    characterRef.current.traverse(child => {
      if (child.isBone && child.name === selectedBone) bone = child;
    });

    if (!bone) {
      alert('Bone not found: ' + selectedBone);
      return;
    }

    const lower = attachmentUrl.toLowerCase();
    if (lower.endsWith('.glb') || lower.endsWith('.gltf')) {
      new GLTFLoader().load(attachmentUrl, (gltf) => {
        const mesh = gltf.scene;
        applyTransform(mesh);
        bone.add(mesh);
        attachedMeshRef.current = mesh;
      });
    } else if (lower.endsWith('.fbx')) {
      new FBXLoader().load(attachmentUrl, (fbx) => {
        applyTransform(fbx);
        bone.add(fbx);
        attachedMeshRef.current = fbx;
      });
    }
  };

  const applyTransform = (mesh) => {
    mesh.scale.setScalar(scale);
    mesh.position.set(position.x, position.y, position.z);
    mesh.rotation.set(
      (rotation.x * Math.PI) / 180,
      (rotation.y * Math.PI) / 180,
      (rotation.z * Math.PI) / 180
    );
  };

  // Update transform live
  useEffect(() => {
    if (!attachedMeshRef.current) return;
    applyTransform(attachedMeshRef.current);
  }, [position, rotation, scale]);

  const NumberInput = ({ label, value, onChange, step = 1 }) => (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-400 w-6">{label}</span>
      <Input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="bg-slate-900 border-slate-700 h-8 text-xs w-24"
      />
    </div>
  );

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <Move className="w-6 h-6 text-cyan-500" />
        3D Attachment Editor
      </h2>
      <p className="text-slate-400 text-sm mb-6">
        Attach objects to character bones and adjust position, rotation, and scale in real-time.
      </p>

      <div className="flex gap-4" style={{ height: '600px' }}>
        {/* 3D Viewport */}
        <div ref={containerRef} className="flex-1 rounded-xl overflow-hidden border border-slate-700" />

        {/* Controls Panel */}
        <div className="w-80 flex-shrink-0 space-y-4 overflow-y-auto pr-2" style={{ scrollbarWidth: 'none' }}>
          {/* Character Select */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Character</h3>
            <div className="flex gap-2">
              {Object.keys(CHARACTER_URLS).map(key => (
                <Button
                  key={key}
                  size="sm"
                  variant={selectedCharacter === key ? 'default' : 'outline'}
                  onClick={() => setSelectedCharacter(key)}
                >
                  {key === 'c1' ? 'C1 (Erika)' : 'Y-Bot'}
                </Button>
              ))}
            </div>
          </div>

          {/* Bone Select */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Target Bone</h3>
            <select
              value={selectedBone}
              onChange={(e) => setSelectedBone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {boneList.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Attachment URL */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-white">Attachment URL</h3>
            <Input
              value={attachmentUrl}
              onChange={(e) => setAttachmentUrl(e.target.value)}
              className="bg-slate-900 border-slate-700 text-xs"
              placeholder="GLB/FBX URL"
            />
            <Button size="sm" onClick={attachObject} className="w-full bg-cyan-600 hover:bg-cyan-700">
              <Eye className="w-3 h-3 mr-2" /> Attach to Bone
            </Button>
          </div>

          {/* Position */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Position</h3>
            <NumberInput label="X" value={position.x} onChange={(v) => setPosition(p => ({ ...p, x: v }))} />
            <NumberInput label="Y" value={position.y} onChange={(v) => setPosition(p => ({ ...p, y: v }))} />
            <NumberInput label="Z" value={position.z} onChange={(v) => setPosition(p => ({ ...p, z: v }))} />
          </div>

          {/* Rotation */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Rotation (degrees)</h3>
            <NumberInput label="X" value={rotation.x} onChange={(v) => setRotation(r => ({ ...r, x: v }))} step={5} />
            <NumberInput label="Y" value={rotation.y} onChange={(v) => setRotation(r => ({ ...r, y: v }))} step={5} />
            <NumberInput label="Z" value={rotation.z} onChange={(v) => setRotation(r => ({ ...r, z: v }))} step={5} />
          </div>

          {/* Scale */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-semibold text-white">Scale</h3>
            <NumberInput label="S" value={scale} onChange={setScale} step={5} />
          </div>

          {/* Reset */}
          <Button variant="outline" size="sm" className="w-full" onClick={() => {
            setPosition({ x: 0, y: 15, z: -10 });
            setRotation({ x: 180, y: 0, z: 135 });
            setScale(50);
          }}>
            <RotateCcw className="w-3 h-3 mr-2" /> Reset Transform
          </Button>
        </div>
      </div>
    </div>
  );
}