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

export default function AI3DScene({ onInteract, onNearAI }) {
    const mountRef = useRef(null);
    const controlsRef = useRef(null);
    const aiAvatarRef = useRef(null);
    const moveState = useRef({ forward: false, backward: false, left: false, right: false });
    
    useEffect(() => {
        if (!mountRef.current) return;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x050510);
        scene.fog = new THREE.FogExp2(0x050510, 0.02);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.7, 5); // Player height

        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        mountRef.current.appendChild(renderer.domElement);

        // --- LIGHTING ---
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        scene.add(dirLight);

        // Neon City Lights
        const addPointLight = (x, y, z, color) => {
            const light = new THREE.PointLight(color, 1, 20);
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

        // Buildings
        const buildingGeo = new THREE.BoxGeometry(1, 1, 1);
        const buildingMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.1, metalness: 0.9 });
        const windowMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });

        for (let i = 0; i < 50; i++) {
            const h = Math.random() * 10 + 2;
            const w = Math.random() * 3 + 2;
            const d = Math.random() * 3 + 2;
            const x = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;

            // Keep center clear
            if (Math.abs(x) < 10 && Math.abs(z) < 10) continue;

            const building = new THREE.Mesh(buildingGeo, buildingMat);
            building.position.set(x, h / 2, z);
            building.scale.set(w, h, d);
            building.castShadow = true;
            building.receiveShadow = true;
            scene.add(building);

            // Neon Edges
            const edges = new THREE.EdgesGeometry(building.geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0044ff }));
            // Scale lines to match building manually or just add to building
            // Edges geometry matches the unit box, so we need to scale mesh or geometry. 
            // Easier to just add glowing strips as separate meshes or simple glowing windows.
        }

        // --- AI AVATAR ---
        const aiGroup = new THREE.Group();
        aiGroup.position.set(0, 2, -5);
        
        // Core sphere (Head/Body)
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

        // Orbiting rings
        const ringGeo = new THREE.TorusGeometry(0.8, 0.02, 16, 100);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.6 });
        
        const ring1 = new THREE.Mesh(ringGeo, ringMat);
        ring1.rotation.x = Math.PI / 2;
        aiGroup.add(ring1);

        const ring2 = new THREE.Mesh(ringGeo, ringMat);
        ring2.rotation.y = Math.PI / 2;
        aiGroup.add(ring2);

        scene.add(aiGroup);
        aiAvatarRef.current = aiGroup;

        // --- CONTROLS ---
        const controls = new PointerLockControls(camera, renderer.domElement);
        controlsRef.current = controls;

        const onClick = () => {
            controls.lock();
        };
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

            // Player Movement
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
    }, [onNearAI]);

    return <div ref={mountRef} className="absolute inset-0 z-0" />;
}