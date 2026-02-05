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
    this.instances = [];
    this.active = false;
    this.cleanupFns = [];
  }

  async start(objectsConfig, scriptsCatalog) {
    if (this.active) return;
    this.active = true;
    this.instances = [];
    this.cleanupFns = [];

    // console.log("Starting Script Runtime...", objectsConfig);

    for (const objConf of objectsConfig) {
      if (!objConf.scripts || objConf.scripts.length === 0) continue;
      
      const threeObj = this.objectsMapRef.current[objConf.id];
      if (!threeObj) {
          console.warn("ScriptRuntime: Object not found in scene:", objConf.id);
          continue;
      }

      for (const scriptRef of objConf.scripts) {
        const scriptDef = scriptsCatalog.find(s => s.id === scriptRef.script_id);
        if (!scriptDef || !scriptDef.script_code) continue;

        try {
          // Dynamic Import from Blob to bypass build steps and allow runtime execution
          const blob = new Blob([scriptDef.script_code], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          const module = await import(url);
          URL.revokeObjectURL(url);
          
          const ClassDef = module.default;
          if (!ClassDef) continue;

          const instance = new ClassDef();
          
          // Inject Entity / Component System Mock
          instance.entity = {
            getComponent: (name) => this._getComponent(name, objConf.id, threeObj)
          };

          if (instance.onStart) {
              instance.onStart();
          }
          
          this.instances.push({ instance, objectId: objConf.id });
        } catch (e) {
          console.error(`Failed to start script ${scriptDef.name}:`, e);
        }
      }
    }
  }

  stop() {
    this.active = false;
    this.instances.forEach(({ instance }) => {
      if (instance.onDestroy) instance.onDestroy();
    });
    this.instances = [];
    this.cleanupFns.forEach(fn => fn());
    this.cleanupFns = [];
  }

  update(delta) {
    if (!this.active) return;
    this.instances.forEach(({ instance }) => {
      if (instance.onUpdate) instance.onUpdate();
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