import * as THREE from 'three';

/**
 * Handles runtime execution of attached scripts (behaviors) for the Scene Editor.
 */
export class ScriptRuntime {
  constructor(sceneRef, sceneObjectsMapRef, mixersRef, controlsRef) {
    this.sceneRef = sceneRef;
    this.objectsMapRef = sceneObjectsMapRef;
    this.mixersRef = mixersRef;
    this.controlsRef = controlsRef; // OrbitControls
    this.updates = []; // Functional updates
    this.active = false;
    this.cleanupFns = [];
  }

  start(objectsConfig, scriptsCatalog) {
    if (this.active) return;
    this.active = true;
    this.updates = [];
    this.cleanupFns = [];

    const THREE = window.THREE || import('three'); // Fallback if needed, though usually window.THREE isn't set in modules. We assume THREE is passed or available globally if we were in a script tag, but here we inject.
    // Actually, we need to pass the THREE instance imported in SceneEditor. 
    // Since we don't have it here easily without passing it in constructor, let's assume standard named imports work if the script uses "THREE.Vector3".
    // Better: Pass THREE in the Function constructor args.

    const scene = this.sceneRef.current;
    const camera = this.controlsRef.current?.object;
    const controls = this.controlsRef.current;
    
    // Use the imported THREE instance
    const THREE_LIB = THREE;
    
    for (const objConf of objectsConfig) {
      if (!objConf.scripts || objConf.scripts.length === 0) continue;
      
      const threeObj = this.objectsMapRef.current[objConf.id];
      if (!threeObj) continue;

      // Prepare Actions Map
      const actions = {};
      const mixerEntry = this.mixersRef.current[objConf.id];
      const mixer = mixerEntry?.mixer;
      
      if (mixer && threeObj.animations) {
          threeObj.animations.forEach(clip => {
              const action = mixer.clipAction(clip);
              actions[clip.name] = action;
              // Map common names
              const lower = clip.name.toLowerCase();
              if (lower.includes('idle')) actions.idle = action;
              if (lower.includes('walk')) actions.walk = action;
              if (lower.includes('run')) actions.run = action;
              if (lower.includes('jump')) actions.jump = action;
          });
      }

      for (const scriptRef of objConf.scripts) {
        const scriptDef = scriptsCatalog.find(s => s.id === scriptRef.script_id);
        if (!scriptDef || !scriptDef.script_code) continue;

        try {
            const registerUpdate = (fn) => {
                if (typeof fn === 'function') this.updates.push(fn);
            };

            // Execute functional script
            const fn = new Function(
                'THREE', 'scene', 'camera', 'renderer', 'model', 'mixer', 'actions', 'controls', 'clock', 'store', 'registerUpdate', 'params',
                scriptDef.script_code
            );

            // Mock Store (for now, or pass real one if available)
            const store = { 
                getState: () => ({}), 
                setState: () => {}, 
                subscribe: () => () => {} 
            };

            // Renderer is accessible via controls.domElement -> canvas -> gl context? No.
            // We can approximate renderer or pass null if not strictly needed for basic movement.
            // SceneEditor *has* the renderer ref, we should pass it.
            // For now, pass null or mock if missing.
            const renderer = null; 

            fn(
                THREE_LIB,
                scene,
                camera,
                renderer,
                threeObj,
                mixer,
                actions,
                controls,
                new THREE.Clock(), // New clock for script? Or global? Script usually uses delta from update.
                store,
                registerUpdate,
                scriptRef.params || {}
            );

        } catch (e) {
          console.error(`Failed to start script ${scriptDef.name}:`, e);
        }
      }
    }
  }

  stop() {
    this.active = false;
    this.updates = [];
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  update(delta) {
    if (!this.active) return;
    this.updates.forEach(fn => {
        try { fn(delta); } catch (e) { console.error("Script Update Error:", e); }
    });
  }

  // --- COMPONENT SYSTEM MOCK ---

  _getComponent(name, objectId, threeObj) {
    // 1. ANIMATOR
    if (name === 'Animator') {
      return {
        setBaseAction: (clipName) => {
           // No-op or logic if needed
        },
        mix: (clipName, fadeDuration = 0.2, weight = 1) => {
           const entry = this.mixersRef.current[objectId];
           if (!entry || !entry.mixer) return;
           
           const mixer = entry.mixer;
           const clip = threeObj.animations.find(c => c.name === clipName || c.name.toLowerCase() === clipName.toLowerCase());
           
           if (!clip) {
               // console.warn(`Animation clip not found: ${clipName}`);
               return;
           }

           const action = mixer.clipAction(clip);
           action.enabled = true;
           action.setEffectiveTimeScale(1);
           action.setEffectiveWeight(weight);
           
           // Simple fade logic: 
           // In a real system we manage current action state, here we just play
           action.reset().fadeIn(fadeDuration).play();
           
           // If there was a previous action, we should fade it out
           // But for now, we rely on the mixer to handle blending if multiple are playing
        },
        onFinish: (callback) => {
           const entry = this.mixersRef.current[objectId];
           if(entry && entry.mixer) {
               const listener = (e) => {
                   // e.action.getClip().name
                   callback(e.action.getClip().name);
               };
               entry.mixer.addEventListener('finished', listener);
               this.cleanupFns.push(() => entry.mixer.removeEventListener('finished', listener));
           }
        }
      };
    }

    // 2. CHARACTER CONTROLLER
    if (name === 'CharacterController') {
      return {
        speed: 0,
        setMovementDirection: ({ x, z }) => {
           if (x === 0 && z === 0) return;
           
           // Move object
           const moveSpeed = (this.instances.find(i => i.objectId === objectId)?.instance?.controller?.speed || 2) * 0.03; // Delta approx
           
           // Apply Camera Rotation to Input
           const camera = this.controlsRef.current.object;
           
           // Get camera forward vector (flattened to Y plane)
           const forward = new THREE.Vector3();
           camera.getWorldDirection(forward);
           forward.y = 0;
           forward.normalize();
           
           const right = new THREE.Vector3();
           right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
           
           // Calculate move vector relative to camera
           const moveVec = new THREE.Vector3();
           moveVec.addScaledVector(right, x);
           moveVec.addScaledVector(forward, -z); // -z because W is forward (negative Z in Three.js usually, but logic depends on input mapping)
           moveVec.normalize();
           
           threeObj.position.addScaledVector(moveVec, moveSpeed);
           
           // Rotate character to face movement
           if (moveVec.lengthSq() > 0.001) {
             const targetRotation = Math.atan2(moveVec.x, moveVec.z);
             // Smooth rotation could go here
             threeObj.rotation.y = targetRotation;
           }
        },
        jump: () => {
             // Jump logic (simple Y offset tween could go here)
             threeObj.position.y += 0.5;
             setTimeout(() => threeObj.position.y -= 0.5, 500);
        },
        setDefaultInput: (enabled) => {},
        isGrounded: () => true 
      };
    }

    return null;
  }
}