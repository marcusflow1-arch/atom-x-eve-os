import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';

// Custom shader for the AI Avatar to make it pulse/glow
const aiVertexShader = `
varying vec3 vNormal;
void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const aiFragmentShader = `
varying vec3 vNormal;
uniform float time;
uniform vec3 color;

void main() {
    float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
    float pulse = 0.8 + 0.2 * sin(time * 3.0);
    gl_FragColor = vec4(color * pulse, 1.0) * intensity + vec4(color, 0.3);
}
`;

export default function AI3DScene({ onInteract, onNearAI, viewMode = 'first' }) {
    const mountRef = useRef(null);
    const controlsRef = useRef(null);
    const aiAvatarRef = useRef(null);
    const playerMeshRef = useRef(null);
    const moveState = useRef({ forward: false, backward: false, left: false, right: false });
    const viewModeRef = useRef(viewMode);

    // Update ref when prop changes so we can use it in animation loop
    useEffect(() => {
        viewModeRef.current = viewMode;
    }, [viewMode]);

    useEffect(() => {
        if (!mountRef.current) return;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);
        scene.fog = new THREE.FogExp2(0x050510, 0.015); // Reduced fog for better visibility

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.7, 5); // Player height

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mountRef.current.appendChild(renderer.domElement);

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0x404050, 0.6);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        dirLight.shadow.camera.near = 0.5;
        dirLight.shadow.camera.far = 500;
        dirLight.shadow.camera.left = -100;
        dirLight.shadow.camera.right = 100;
        dirLight.shadow.camera.top = 100;
        dirLight.shadow.camera.bottom = -100;
        scene.add(dirLight);

        // Neon City Lights
        const addPointLight = (x, y, z, color, intensity = 1, dist = 20) => {
            const light = new THREE.PointLight(color, intensity, dist);
            light.position.set(x, y, z);
            scene.add(light);
        };
        addPointLight(0, 5, 0, 0x00ffff);
        addPointLight(10, 5, 10, 0xff00ff);
        addPointLight(-10, 5, -10, 0xffff00);

        // --- ENVIRONMENT ---
        // Ground
        const gridHelper = new THREE.GridHelper(200, 200, 0x00ffff, 0x111111);
        scene.add(gridHelper);

        const groundGeo = new THREE.PlaneGeometry(200, 200);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x020205, roughness: 0.8, metalness: 0.2 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Buildings (Procedural City)
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });

        for (let i = 0; i < 60; i++) {
            const x = (Math.random() - 0.5) * 140;
            const z = (Math.random() - 0.5) * 140;

            // Keep center area clear for AI and House
            if (Math.abs(x) < 25 && Math.abs(z) < 25) continue;

            const h = Math.random() * 15 + 5;
            const w = Math.random() * 5 + 3;
            const d = Math.random() * 5 + 3;

            const building = new THREE.Mesh(buildingGeo, buildingMat);
            building.position.set(x, h / 2, z);
            building.scale.set(w, h, d);
            building.castShadow = true;
            building.receiveShadow = true;
            scene.add(building);

            // Glowing window strips
            const stripGeo = new THREE.BoxGeometry(w + 0.1, 0.2, d + 0.1);
            const stripMat = new THREE.MeshBasicMaterial({ color: Math.random() > 0.5 ? 0x00ffff : 0xff00ff });
            for(let j=2; j<h; j+=3) {
                const strip = new THREE.Mesh(stripGeo, stripMat);
                strip.position.set(x, j, z);
                scene.add(strip);
            }
        }

        // --- 3D HOUSE IMPLEMENTATION ---
        const houseGroup = new THREE.Group();
        houseGroup.position.set(15, 0, 15);
        scene.add(houseGroup);

        const wallMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5 });
        const floorMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const roofMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });

        // Floor
        const floor = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 14), floorMat);
        floor.position.y = 0.1;
        floor.receiveShadow = true;
        houseGroup.add(floor);

        // Ceiling
        const ceiling = new THREE.Mesh(new THREE.BoxGeometry(14, 0.2, 14), roofMat);
        ceiling.position.y = 4;
        ceiling.castShadow = true;
        houseGroup.add(ceiling);

        // Walls (Thick)
        const createWall = (w, h, d, x, y, z) => {
            const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
            wall.position.set(x, y, z);
            wall.castShadow = true;
            wall.receiveShadow = true;
            houseGroup.add(wall);
            return wall;
        };

        // Outer Walls
        createWall(14, 4, 0.5, 0, 2, -6.75); // Back
        createWall(0.5, 4, 14, -6.75, 2, 0); // Left
        createWall(0.5, 4, 14, 6.75, 2, 0); // Right
        // Front Wall with Door Gap
        createWall(5, 4, 0.5, -4.5, 2, 6.75);
        createWall(5, 4, 0.5, 4.5, 2, 6.75);
        createWall(4, 1, 0.5, 0, 3.5, 6.75); // Door header

        // Interior Walls
        // Divider splitting front/back
        createWall(14, 4, 0.2, 0, 2, 0); 
        // Doorway in divider
        // (Simpler: Just two walls with gap in middle)
        houseGroup.remove(houseGroup.children[houseGroup.children.length-1]); // Remove full wall
        createWall(5, 4, 0.2, -4.5, 2, 0);
        createWall(5, 4, 0.2, 4.5, 2, 0);
        createWall(4, 1, 0.2, 0, 3.5, 0); // Header

        // Divider splitting back room (Bedroom vs Storage)
        createWall(0.2, 4, 6.75, 0, 2, -3.375);

        // --- ROOMS ---
        // 1. Bedroom (Back Left: x < 0, z < 0)
        const bed = new THREE.Mesh(new THREE.BoxGeometry(2.5, 1, 3.5), new THREE.MeshStandardMaterial({ color: 0x3366ff }));
        bed.position.set(-4, 0.6, -5);
        houseGroup.add(bed);
        
        const nightstand = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x444444 }));
        nightstand.position.set(-2, 0.5, -5);
        houseGroup.add(nightstand);

        // Bedroom Light
        const bedLight = new THREE.PointLight(0x5588ff, 2, 8);
        bedLight.position.set(-4, 3, -4);
        houseGroup.add(bedLight);

        // 2. Storage Room (Back Right: x > 0, z < 0)
        const shelfMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 4), shelfMat);
        shelf1.position.set(5, 1.5, -3.5);
        houseGroup.add(shelf1);

        const crateGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        const crateMat = new THREE.MeshStandardMaterial({ color: 0x886633 });
        const crate1 = new THREE.Mesh(crateGeo, crateMat); crate1.position.set(3, 0.4, -5); houseGroup.add(crate1);
        const crate2 = new THREE.Mesh(crateGeo, crateMat); crate2.position.set(3, 0.4, -3); houseGroup.add(crate2);
        const crate3 = new THREE.Mesh(crateGeo, crateMat); crate3.position.set(3, 1.2, -4); houseGroup.add(crate3);

        // Storage Light
        const storageLight = new THREE.PointLight(0xffaa00, 2, 8);
        storageLight.position.set(4, 3, -4);
        houseGroup.add(storageLight);

        // Main Room Light
        const mainLight = new THREE.PointLight(0xffffff, 1.5, 10);
        mainLight.position.set(0, 3, 3);
        houseGroup.add(mainLight);

        // --- PLAYER MESH (For 3rd Person) ---
        const playerGroup = new THREE.Group();
        // Body
        const bodyMesh = new THREE.Mesh(
            new THREE.CapsuleGeometry(0.4, 1, 4, 8),
            new THREE.MeshStandardMaterial({ color: 0x00ff88, roughness: 0.3 })
        );
        bodyMesh.position.y = 0.9;
        playerGroup.add(bodyMesh);
        
        // Head
        const headMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color: 0x111111 })
        );
        headMesh.position.y = 1.7;
        playerGroup.add(headMesh);

        // Visor
        const visor = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.1, 0.1),
            new THREE.MeshBasicMaterial({ color: 0x00ffff })
        );
        visor.position.set(0, 1.7, -0.26);
        playerGroup.add(visor);

        // Backpack/Jetpack
        const backpack = new THREE.Mesh(
            new THREE.BoxGeometry(0.5, 0.6, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x333333 })
        );
        backpack.position.set(0, 1.2, 0.25);
        playerGroup.add(backpack);

        scene.add(playerGroup);
        playerGroup.visible = false; // Start hidden
        playerMeshRef.current = playerGroup;


        // --- AI AVATAR ---
        const aiGroup = new THREE.Group();
        aiGroup.position.set(0, 2, -5);
        
        const sphereGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const sphereMat = new THREE.ShaderMaterial({
            uniforms: { 
                time: { value: 0 },
                color: { value: new THREE.Color(0x00ffff) }
            },
            vertexShader: aiVertexShader,
            fragmentShader: aiFragmentShader,
            transparent: true,
            side: THREE.DoubleSide
        });
        const aiSphere = new THREE.Mesh(sphereGeo, sphereMat);
        aiGroup.add(aiSphere);

        const ringGeo = new THREE.TorusGeometry(0.8, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.6 });
        const ring1 = new THREE.Mesh(ringGeo, ringMat); ring1.rotation.x = Math.PI / 2; aiGroup.add(ring1);
        const ring2 = new THREE.Mesh(ringGeo, ringMat); ring2.rotation.y = Math.PI / 2; aiGroup.add(ring2);

        scene.add(aiGroup);
        aiAvatarRef.current = aiGroup;

        // --- CONTROLS ---
        const controls = new PointerLockControls(camera, renderer.domElement);
        controlsRef.current = controls;

        const onClick = () => controls.lock();
        document.addEventListener('click', onClick);

        const onKeyDown = (e) => {
            switch (e.code) {
                case 'KeyW': moveState.current.forward = true; break;
                case 'KeyS': moveState.current.backward = true; break;
                case 'KeyA': moveState.current.left = true; break;
                case 'KeyD': moveState.current.right = true; break;
            }
        };
        const onKeyUp = (e) => {
            switch (e.code) {
                case 'KeyW': moveState.current.forward = false; break;
                case 'KeyS': moveState.current.backward = false; break;
                case 'KeyA': moveState.current.left = false; break;
                case 'KeyD': moveState.current.right = false; break;
            }
        };
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        // --- ANIMATION LOOP ---
        const clock = new THREE.Clock();
        const velocity = new THREE.Vector3();
        const direction = new THREE.Vector3();

        const animate = () => {
            requestAnimationFrame(animate);
            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();

            // AI Animation
            if (aiAvatarRef.current) {
                aiAvatarRef.current.position.y = 2 + Math.sin(elapsedTime) * 0.2;
                aiAvatarRef.current.children[0].material.uniforms.time.value = elapsedTime;
                aiAvatarRef.current.children[1].rotation.x += delta;
                aiAvatarRef.current.children[1].rotation.y += delta * 0.5;
                aiAvatarRef.current.children[2].rotation.x -= delta * 0.5;
                aiAvatarRef.current.children[2].rotation.y -= delta;
            }

            // Update Player Mesh and Camera
            const isThirdPerson = viewModeRef.current === 'third';
            if (playerMeshRef.current) {
                // In both modes, the player mesh follows the camera's logical position
                // BUT in FPS it's invisible. In TPS it's visible and offset in front.
                
                // Basic position sync (Camera is the "Head/Eyes")
                // We want the player model to be at the camera's X/Z, but grounded Y.
                const playerPos = camera.position.clone();
                playerPos.y = 0; // Ground level
                
                if (isThirdPerson) {
                    // In TPS, we render the character in front of the camera
                    // Move mesh forward from camera
                    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
                    forward.y = 0;
                    forward.normalize();
                    
                    // Offset character to be in front
                    const offsetDist = 2.5;
                    playerPos.add(forward.multiplyScalar(offsetDist));
                    
                    playerMeshRef.current.position.copy(playerPos);
                    playerMeshRef.current.visible = true;
                    
                    // Rotate character to face away from camera (or movement dir)
                    // Simple: face same dir as camera
                    const euler = new THREE.Euler(0, camera.rotation.y, 0, 'YXZ');
                    playerMeshRef.current.setRotationFromEuler(euler);
                    
                    // If moving, maybe rotate to movement dir? (Advanced, skipping for now)
                } else {
                    playerMeshRef.current.visible = false;
                }
            }

            // Player Movement Physics
            if (controls.isLocked) {
                velocity.x -= velocity.x * 10.0 * delta;
                velocity.z -= velocity.z * 10.0 * delta;

                direction.z = Number(moveState.current.forward) - Number(moveState.current.backward);
                direction.x = Number(moveState.current.right) - Number(moveState.current.left);
                direction.normalize();

                if (moveState.current.forward || moveState.current.backward) velocity.z -= direction.z * 100.0 * delta;
                if (moveState.current.left || moveState.current.right) velocity.x -= direction.x * 100.0 * delta;

                controls.moveRight(-velocity.x * delta);
                controls.moveForward(-velocity.z * delta);

                // Simple floor collision constraint
                if (camera.position.y < 1.7) camera.position.y = 1.7;
            }

            // AI Proximity Check
            const dist = camera.position.distanceTo(aiGroup.position);
            if (dist < 4) {
                onNearAI(true);
            } else {
                onNearAI(false);
            }

            renderer.render(scene, camera);
        };

        animate();

        // --- CLEANUP ---
        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('click', onClick);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            if (mountRef.current) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, [onNearAI]); // Re-run if onNearAI changes (but we rely on ref for viewMode)

    return <div ref={mountRef} className="absolute inset-0 z-0" />;
}