import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import * as THREE from 'three';

// 3D Map Zones with detailed coordinates and styling
const mapZones = [
  {
    id: 'central_hub',
    name: 'Central Command',
    destination: 'Dashboard',
    position: { x: 0, y: 2, z: 0 },
    size: { width: 8, height: 3, depth: 8 },
    color: '#00d4ff',
    glowColor: '#0099cc',
    description: 'Main command center and overview',
    terrain: 'platform',
    buildings: [
      { type: 'tower', position: { x: 0, y: 3, z: 0 }, height: 6 }
    ]
  },
  {
    id: 'profile_district',
    name: 'Avatar District',
    destination: 'Profile',
    position: { x: -20, y: 1, z: -15 },
    size: { width: 12, height: 2, depth: 10 },
    color: '#4f46e5',
    glowColor: '#3730a3',
    description: 'Character customization and stats',
    terrain: 'urban',
    buildings: [
      { type: 'building', position: { x: -18, y: 2, z: -12 }, height: 4 },
      { type: 'building', position: { x: -22, y: 2, z: -18 }, height: 5 },
      { type: 'building', position: { x: -20, y: 2, z: -15 }, height: 3 }
    ]
  },
  {
    id: 'achievement_citadel',
    name: 'Trophy Citadel',
    destination: 'Achievements',
    position: { x: 20, y: 3, z: -15 },
    size: { width: 15, height: 4, depth: 12 },
    color: '#fbbf24',
    glowColor: '#f59e0b',
    description: 'Hall of achievements and rewards',
    terrain: 'fortress',
    buildings: [
      { type: 'citadel', position: { x: 20, y: 5, z: -15 }, height: 8 },
      { type: 'tower', position: { x: 15, y: 3, z: -10 }, height: 6 },
      { type: 'tower', position: { x: 25, y: 3, z: -20 }, height: 6 }
    ]
  },
  {
    id: 'marketplace_bazaar',
    name: 'Trading Bazaar',
    destination: 'Store',
    position: { x: -25, y: 1, z: 20 },
    size: { width: 18, height: 2, depth: 15 },
    color: '#10b981',
    glowColor: '#059669',
    description: 'Shop for games, items, and upgrades',
    terrain: 'market',
    buildings: [
      { type: 'market_stall', position: { x: -30, y: 1.5, z: 15 }, height: 2 },
      { type: 'market_stall', position: { x: -25, y: 1.5, z: 20 }, height: 2 },
      { type: 'market_stall', position: { x: -20, y: 1.5, z: 25 }, height: 2 },
      { type: 'warehouse', position: { x: -25, y: 2, z: 28 }, height: 4 }
    ]
  },
  {
    id: 'forge_foundry',
    name: 'The Forge',
    destination: 'Blacksmith',
    position: { x: 0, y: 1, z: 25 },
    size: { width: 12, height: 2, depth: 12 },
    color: '#dc2626',
    glowColor: '#991b1b',
    description: 'Craft and upgrade your equipment',
    terrain: 'industrial',
    buildings: [
      { type: 'forge', position: { x: 0, y: 3, z: 25 }, height: 5 },
      { type: 'chimney', position: { x: -3, y: 4, z: 22 }, height: 7 },
      { type: 'chimney', position: { x: 3, y: 4, z: 28 }, height: 6 }
    ]
  },
  {
    id: 'guild_stronghold',
    name: 'Guild Stronghold',
    destination: 'Clan',
    position: { x: 25, y: 2, z: 20 },
    size: { width: 16, height: 3, depth: 14 },
    color: '#7c3aed',
    glowColor: '#5b21b6',
    description: 'Clan headquarters and operations',
    terrain: 'fortress',
    buildings: [
      { type: 'stronghold', position: { x: 25, y: 4, z: 20 }, height: 7 },
      { type: 'watchtower', position: { x: 18, y: 3, z: 15 }, height: 5 },
      { type: 'watchtower', position: { x: 32, y: 3, z: 25 }, height: 5 },
      { type: 'wall', position: { x: 25, y: 1.5, z: 12 }, height: 2 }
    ]
  },
  {
    id: 'library_archives',
    name: 'Game Archives',
    destination: 'Library',
    position: { x: -15, y: 1, z: -25 },
    size: { width: 14, height: 2, depth: 12 },
    color: '#06b6d4',
    glowColor: '#0891b2',
    description: 'Your game collection and library',
    terrain: 'academic',
    buildings: [
      { type: 'library', position: { x: -15, y: 3, z: -25 }, height: 5 },
      { type: 'spire', position: { x: -12, y: 4, z: -22 }, height: 6 },
      { type: 'archive', position: { x: -18, y: 2, z: -28 }, height: 3 }
    ]
  }
];

// Environmental details
const environmentalFeatures = [
  // Roads connecting zones
  { type: 'road', start: { x: 0, z: 0 }, end: { x: -20, z: -15 }, width: 2 },
  { type: 'road', start: { x: 0, z: 0 }, end: { x: 20, z: -15 }, width: 2 },
  { type: 'road', start: { x: 0, z: 0 }, end: { x: -25, z: 20 }, width: 2 },
  { type: 'road', start: { x: 0, z: 0 }, end: { x: 0, z: 25 }, width: 2 },
  { type: 'road', start: { x: 0, z: 0 }, end: { x: 25, z: 20 }, width: 2 },
  { type: 'road', start: { x: 0, z: 0 }, end: { x: -15, z: -25 }, width: 2 },
  
  // Decorative elements
  { type: 'forest', position: { x: -40, z: -40 }, size: 15 },
  { type: 'forest', position: { x: 40, z: 40 }, size: 12 },
  { type: 'lake', position: { x: -35, z: 5 }, size: 8 },
  { type: 'mountain', position: { x: 35, z: -35 }, size: 10 },
  { type: 'crystal_field', position: { x: 5, z: -40 }, size: 8 }
];

// Custom First-Person Controls Class
class FirstPersonControls {
  constructor(camera, domElement) {
    this.camera = camera;
    this.domElement = domElement;
    this.isLocked = false;
    
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.canJump = false;

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();

    this.pitchObject = new THREE.Object3D();
    this.pitchObject.add(camera);

    this.yawObject = new THREE.Object3D();
    this.yawObject.position.y = 2;
    this.yawObject.add(this.pitchObject);

    this.PI_2 = Math.PI / 2;

    this.onMouseMove = this.onMouseMove.bind(this);
    this.onPointerlockChange = this.onPointerlockChange.bind(this);
    this.onPointerlockError = this.onPointerlockError.bind(this);

    document.addEventListener('pointerlockchange', this.onPointerlockChange, false);
    document.addEventListener('pointerlockerror', this.onPointerlockError, false);
  }

  onMouseMove(event) {
    if (this.isLocked === false) return;

    const movementX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const movementY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;

    this.yawObject.rotation.y -= movementX * 0.002;
    this.pitchObject.rotation.x -= movementY * 0.002;

    this.pitchObject.rotation.x = Math.max(-this.PI_2, Math.min(this.PI_2, this.pitchObject.rotation.x));
  }

  onPointerlockChange() {
    if (document.pointerLockElement === this.domElement) {
      this.dispatchEvent({ type: 'lock' });
      this.isLocked = true;
    } else {
      this.dispatchEvent({ type: 'unlock' });
      this.isLocked = false;
    }
  }

  onPointerlockError() {
    console.error('THREE.PointerLockControls: Unable to use Pointer Lock API');
  }

  connect() {
    document.addEventListener('mousemove', this.onMouseMove, false);
  }

  disconnect() {
    document.removeEventListener('mousemove', this.onMouseMove, false);
  }

  dispose() {
    this.disconnect();
    document.removeEventListener('pointerlockchange', this.onPointerlockChange, false);
    document.removeEventListener('pointerlockerror', this.onPointerlockError, false);
  }

  getObject() {
    return this.yawObject;
  }

  getDirection() {
    const direction = new THREE.Vector3(0, 0, -1);
    const rotation = new THREE.Euler(0, 0, 0, 'YXZ');

    return function(v) {
      rotation.set(this.pitchObject.rotation.x, this.yawObject.rotation.y, 0);
      v.copy(direction).applyEuler(rotation);
      return v;
    };
  }

  lock() {
    this.domElement.requestPointerLock();
  }

  unlock() {
    document.exitPointerLock();
  }

  // Event dispatcher methods
  addEventListener(type, listener) {
    if (this._listeners === undefined) this._listeners = {};
    const listeners = this._listeners;
    if (listeners[type] === undefined) {
      listeners[type] = [];
    }
    if (listeners[type].indexOf(listener) === -1) {
      listeners[type].push(listener);
    }
  }

  dispatchEvent(event) {
    if (this._listeners === undefined) return;
    const listeners = this._listeners;
    const listenerArray = listeners[event.type];
    if (listenerArray !== undefined) {
      event.target = this;
      const array = listenerArray.slice(0);
      for (let i = 0, l = array.length; i < l; i++) {
        array[i].call(this, event);
      }
    }
  }
}

export default function AIConsole() {
  const mountRef = useRef(null);
  const navigate = useNavigate();
  const [selectedZone, setSelectedZone] = useState(null);
  const [cameraMode, setCameraMode] = useState('orbit'); // orbit, explore
  const [viewMode, setViewMode] = useState('overview'); // overview, close, first-person
  const [isPointerLocked, setIsPointerLocked] = useState(false);
  
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const zonesRef = useRef([]);
  const controlsRef = useRef(null);
  const playerVelocity = useRef(new THREE.Vector3());
  const onObject = useRef(false);
  const collidableObjects = useRef([]);
  const keysPressed = useRef({});

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup with enhanced atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x001122);
    scene.fog = new THREE.Fog(0x001122, 50, 200);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 80, 80); // Start position for orbit mode
    cameraRef.current = camera;
    
    // First-person controls
    const controls = new FirstPersonControls(camera, document.body);
    controlsRef.current = controls;
    scene.add(controls.getObject());

    controls.addEventListener('lock', () => setIsPointerLocked(true));
    controls.addEventListener('unlock', () => setIsPointerLocked(false));
    controls.connect();

    // Renderer with enhanced settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: "high-performance"
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Enhanced lighting system
    const ambientLight = new THREE.AmbientLight(0x404080, 0.4);
    scene.add(ambientLight);

    // Main directional light (moon/sun)
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.5);
    mainLight.position.set(50, 100, 50);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 4096;
    mainLight.shadow.mapSize.height = 4096;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 500;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    scene.add(mainLight);

    // Atmospheric lights
    const atmosphericLights = [
      { color: 0x00aaff, position: { x: -50, y: 30, z: -50 }, intensity: 0.8 },
      { color: 0xff6600, position: { x: 50, y: 30, z: 50 }, intensity: 0.8 },
      { color: 0x9944ff, position: { x: 0, y: 50, z: 0 }, intensity: 1.2 }
    ];

    atmosphericLights.forEach(light => {
      const pointLight = new THREE.PointLight(light.color, light.intensity, 100);
      pointLight.position.set(light.position.x, light.position.y, light.position.z);
      scene.add(pointLight);
    });

    // Terrain base
    const terrainGeometry = new THREE.PlaneGeometry(200, 200, 64, 64);
    const terrainMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x2a4a5a,
      transparent: true,
      opacity: 0.8
    });
    const terrain = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrain.rotation.x = -Math.PI / 2;
    terrain.receiveShadow = true;
    scene.add(terrain);
    collidableObjects.current.push(terrain); // Add terrain to collidable objects

    // Advanced grid system
    const gridHelper = new THREE.GridHelper(200, 100, 0x00ffff, 0x004466);
    gridHelper.material.opacity = 0.3;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Function to create buildings
    const createBuilding = (building, zoneColor) => {
      const buildingGroup = new THREE.Group();
      
      switch (building.type) {
        case 'tower':
          const towerGeometry = new THREE.CylinderGeometry(1, 1.5, building.height, 8);
          const towerMaterial = new THREE.MeshPhongMaterial({ 
            color: zoneColor,
            emissive: zoneColor,
            emissiveIntensity: 0.2
          });
          const tower = new THREE.Mesh(towerGeometry, towerMaterial);
          tower.position.set(building.position.x, building.position.y, building.position.z);
          tower.castShadow = true;
          buildingGroup.add(tower);
          
          // Add glowing top
          const capGeometry = new THREE.ConeGeometry(0.8, 1, 6);
          const capMaterial = new THREE.MeshBasicMaterial({ 
            color: zoneColor,
            transparent: true,
            opacity: 0.8
          });
          const cap = new THREE.Mesh(capGeometry, capMaterial);
          cap.position.set(building.position.x, building.position.y + building.height/2 + 0.5, building.position.z);
          buildingGroup.add(cap);
          break;

        case 'building':
        case 'stronghold':
        case 'citadel':
        case 'forge':
        case 'library':
          const buildingGeometry = new THREE.BoxGeometry(3, building.height, 3);
          const buildingMaterial = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color(zoneColor).multiplyScalar(0.8),
            emissive: zoneColor,
            emissiveIntensity: 0.1
          });
          const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
          buildingMesh.position.set(building.position.x, building.position.y, building.position.z);
          buildingMesh.castShadow = true;
          buildingGroup.add(buildingMesh);
          break;

        case 'market_stall':
          const stallGeometry = new THREE.BoxGeometry(2, building.height, 2);
          const stallMaterial = new THREE.MeshPhongMaterial({ 
            color: zoneColor,
            transparent: true,
            opacity: 0.7
          });
          const stall = new THREE.Mesh(stallGeometry, stallMaterial);
          stall.position.set(building.position.x, building.position.y, building.position.z);
          buildingGroup.add(stall);
          break;

        case 'chimney':
        case 'spire':
        case 'watchtower':
          const spireGeometry = new THREE.CylinderGeometry(0.5, 0.8, building.height, 6);
          const spireMaterial = new THREE.MeshPhongMaterial({ 
            color: zoneColor,
            emissive: zoneColor,
            emissiveIntensity: 0.3
          });
          const spire = new THREE.Mesh(spireGeometry, spireMaterial);
          spire.position.set(building.position.x, building.position.y, building.position.z);
          spire.castShadow = true;
          buildingGroup.add(spire);
          break;
        default:
          console.warn(`Unknown building type: ${building.type}`);
      }
      
      return buildingGroup;
    };

    // Create zones with buildings and add to collidables
    mapZones.forEach(zone => {
      const zoneGroup = new THREE.Group();
      
      // Zone platform
      const platformGeometry = new THREE.BoxGeometry(zone.size.width, zone.size.height, zone.size.depth);
      const platformMaterial = new THREE.MeshPhongMaterial({ 
        color: new THREE.Color(zone.color).multiplyScalar(0.6),
        emissive: zone.color,
        emissiveIntensity: 0.2,
        transparent: true,
        opacity: 0.8
      });
      const platform = new THREE.Mesh(platformGeometry, platformMaterial);
      platform.position.set(zone.position.x, zone.position.y, zone.position.z);
      platform.castShadow = true;
      platform.receiveShadow = true;
      platform.userData = { zone: zone };
      zoneGroup.add(platform);
      collidableObjects.current.push(platform); // Add platform to collidable objects
      
      // Zone glow effect
      const glowGeometry = new THREE.BoxGeometry(
        zone.size.width + 2, 
        zone.size.height + 0.5, 
        zone.size.depth + 2
      );
      const glowMaterial = new THREE.MeshBasicMaterial({ 
        color: zone.glowColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.BackSide
      });
      const glow = new THREE.Mesh(glowGeometry, glowMaterial);
      glow.position.set(zone.position.x, zone.position.y, zone.position.z);
      zoneGroup.add(glow);
      
      // Add buildings
      zone.buildings.forEach(building => {
        const buildingMeshGroup = createBuilding(building, zone.color);
        buildingMeshGroup.children.forEach(child => collidableObjects.current.push(child)); // Add building meshes to collidable objects
        zoneGroup.add(buildingMeshGroup);
      });
      
      // Zone lighting
      const zoneLight = new THREE.PointLight(zone.color, 2, 25);
      zoneLight.position.set(zone.position.x, zone.position.y + 10, zone.position.z);
      zoneLight.castShadow = true;
      zoneGroup.add(zoneLight);
      
      zonesRef.current.push(platform);
      scene.add(zoneGroup);
    });

    // Add environmental features
    environmentalFeatures.forEach(feature => {
      switch (feature.type) {
        case 'road':
          const roadLength = Math.sqrt(
            Math.pow(feature.end.x - feature.start.x, 2) + 
            Math.pow(feature.end.z - feature.start.z, 2)
          );
          const roadGeometry = new THREE.PlaneGeometry(feature.width, roadLength);
          const roadMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.8
          });
          const road = new THREE.Mesh(roadGeometry, roadMaterial);
          road.rotation.x = -Math.PI / 2;
          road.position.set(
            (feature.start.x + feature.end.x) / 2,
            0.1,
            (feature.start.z + feature.end.z) / 2
          );
          const angle = Math.atan2(feature.end.z - feature.start.z, feature.end.x - feature.start.x);
          road.rotation.y = angle - Math.PI / 2;
          scene.add(road);
          break;

        case 'forest':
          for (let i = 0; i < 20; i++) {
            const treeGeometry = new THREE.ConeGeometry(1, 4 + Math.random() * 3, 8);
            const treeMaterial = new THREE.MeshPhongMaterial({ color: 0x228B22 });
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(
              feature.position.x + (Math.random() - 0.5) * feature.size,
              2,
              feature.position.z + (Math.random() - 0.5) * feature.size
            );
            tree.castShadow = true;
            scene.add(tree);
          }
          break;

        case 'lake':
          const lakeGeometry = new THREE.CircleGeometry(feature.size, 32);
          const lakeMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x0077be,
            transparent: true,
            opacity: 0.7,
            reflectivity: 0.8
          });
          const lake = new THREE.Mesh(lakeGeometry, lakeMaterial);
          lake.rotation.x = -Math.PI / 2;
          lake.position.set(feature.position.x, 0.1, feature.position.z);
          scene.add(lake);
          break;

        case 'mountain':
          const mountainGeometry = new THREE.ConeGeometry(feature.size, feature.size * 1.5, 8);
          const mountainMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
          const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
          mountain.position.set(feature.position.x, feature.size * 0.75, feature.position.z);
          mountain.castShadow = true;
          scene.add(mountain);
          break;

        case 'crystal_field':
          for (let i = 0; i < 15; i++) {
            const crystalGeometry = new THREE.OctahedronGeometry(0.5 + Math.random());
            const crystalMaterial = new THREE.MeshPhongMaterial({ 
              color: 0x00ffff,
              emissive: 0x004444,
              transparent: true,
              opacity: 0.8
            });
            const crystal = new THREE.Mesh(crystalGeometry, crystalMaterial);
            crystal.position.set(
              feature.position.x + (Math.random() - 0.5) * feature.size,
              1 + Math.random() * 2,
              feature.position.z + (Math.random() - 0.5) * feature.size
            );
            crystal.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            scene.add(crystal);
          }
          break;
      }
    });

    // Mouse and Keyboard event handlers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseClick = (event) => {
        if (cameraMode === 'orbit') {
            const rect = renderer.domElement.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(zonesRef.current);
            if (intersects.length > 0) {
                const clickedZone = intersects[0].object.userData.zone;
                if (clickedZone) {
                    intersects[0].object.material.emissiveIntensity = 1.0;
                    setTimeout(() => {
                        navigate(createPageUrl(clickedZone.destination));
                    }, 200);
                }
            }
        } else if (cameraMode === 'explore') {
            controls.lock();
        }
    };
    
    const onMouseMove = (event) => {
      // Only process hover effects if in orbit mode and pointer is not locked
      if (cameraMode === 'orbit' && !controls.isLocked) {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(zonesRef.current);

        // Reset all zone materials
        zonesRef.current.forEach(zone => {
          zone.material.emissiveIntensity = 0.2;
        });

        if (intersects.length > 0) {
          const hoveredZone = intersects[0].object.userData.zone;
          intersects[0].object.material.emissiveIntensity = 0.5;
          setSelectedZone(hoveredZone);
          document.body.style.cursor = 'pointer';
        } else {
          setSelectedZone(null);
          document.body.style.cursor = 'default';
        }
      } else {
        // If not in orbit mode, ensure no zone is selected and cursor is default
        if (selectedZone !== null) {
          setSelectedZone(null);
        }
        if (document.body.style.cursor !== 'default') {
          document.body.style.cursor = 'default';
        }
      }
    };
    
    const onKeyDown = (event) => {
        keysPressed.current[event.code] = true;
    };
    const onKeyUp = (event) => {
        keysPressed.current[event.code] = false;
    };
    
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    renderer.domElement.addEventListener('click', onMouseClick);
    renderer.domElement.addEventListener('mousemove', onMouseMove);

    // Animation loop
    const clock = new THREE.Clock();
    let animationId;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = Date.now() * 0.001; // For animations not dependent on delta

      // Camera movement based on mode
      if (cameraMode === 'orbit') {
        if (viewMode === 'overview') {
          camera.position.x = Math.cos(time * 0.1) * 100;
          camera.position.z = Math.sin(time * 0.1) * 100;
          camera.position.y = 60 + Math.sin(time * 0.05) * 20;
          camera.lookAt(0, 0, 0);
        }
      } else if (cameraMode === 'explore' && controls.isLocked) {
        // Player movement and physics
        const moveSpeed = 15.0; // Units per second
        const jumpStrength = 15.0; // Units per second
        const gravity = 9.8 * 7.0; // Gravity acceleration (scaled)
        const dampingFactor = 10.0; // For friction

        playerVelocity.current.x -= playerVelocity.current.x * dampingFactor * delta;
        playerVelocity.current.z -= playerVelocity.current.z * dampingFactor * delta;
        playerVelocity.current.y -= gravity * delta; // Apply gravity

        const direction = new THREE.Vector3();
        if (keysPressed.current['KeyW']) direction.z = -1;
        if (keysPressed.current['KeyS']) direction.z = 1;
        if (keysPressed.current['KeyA']) direction.x = -1;
        if (keysPressed.current['KeyD']) direction.x = 1;

        direction.normalize(); // Normalize for consistent speed when moving diagonally
        
        if (keysPressed.current['KeyW'] || keysPressed.current['KeyS']) {
          playerVelocity.current.z += direction.z * moveSpeed * delta;
        }
        if (keysPressed.current['KeyA'] || keysPressed.current['KeyD']) {
          playerVelocity.current.x += direction.x * moveSpeed * delta;
        }

        // Apply movement to the controls object
        const controlsObject = controls.getObject();
        const forward = new THREE.Vector3();
        controlsObject.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        // Move player
        if (keysPressed.current['KeyW']) {
          controlsObject.position.addScaledVector(forward, moveSpeed * delta);
        }
        if (keysPressed.current['KeyS']) {
          controlsObject.position.addScaledVector(forward, -moveSpeed * delta);
        }
        if (keysPressed.current['KeyA']) {
          controlsObject.position.addScaledVector(right, -moveSpeed * delta);
        }
        if (keysPressed.current['KeyD']) {
          controlsObject.position.addScaledVector(right, moveSpeed * delta);
        }

        // Simple Ground Collision Detection and Jumping
        const groundRaycaster = new THREE.Raycaster(controlsObject.position, new THREE.Vector3(0, -1, 0), 0, 1.5);
        const groundIntersects = groundRaycaster.intersectObjects(collidableObjects.current);
        onObject.current = groundIntersects.length > 0;

        if (onObject.current) {
            playerVelocity.current.y = Math.max(0, playerVelocity.current.y); // Stop falling if on ground
            if (keysPressed.current['Space']) {
                playerVelocity.current.y = jumpStrength; // Jump
            }
        }
        
        controlsObject.position.y += playerVelocity.current.y * delta;
        
        // Prevent falling through the terrain base
        if (controlsObject.position.y < 2) {
            playerVelocity.current.y = 0;
            controlsObject.position.y = 2;
            onObject.current = true;
        }
      }

      // Animate zone glows (still uses 'time' for consistent cyclic animation)
      zonesRef.current.forEach((zone, index) => {
        if (zone.material && zone.material.emissiveIntensity !== undefined) {
          const baseIntensity = cameraMode === 'orbit' && selectedZone && selectedZone.id === zone.userData.zone.id ? 0.5 : 0.2; // Keep highlight on hover in orbit mode
          zone.material.emissiveIntensity = baseIntensity + Math.sin(time * 2 + index) * 0.1;
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (mountRef.current) {
        camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('click', onMouseClick);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      controls.dispose();
    };
  }, []); // Run once on mount

  // Effect to switch camera mode and adjust camera properties
  useEffect(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    if (cameraMode === 'orbit') {
        controlsRef.current.unlock();
        cameraRef.current.position.set(0, 80, 80);
        cameraRef.current.lookAt(0, 0, 0);
        playerVelocity.current.set(0, 0, 0); // Reset velocity when exiting explore
        onObject.current = false; // Reset ground state
    } else { // cameraMode === 'explore'
        // Position camera for first-person perspective, approx 1.7 units above ground (character height)
        cameraRef.current.position.set(0, 1.7, 0); 
        cameraRef.current.rotation.set(0, 0, 0); // Reset rotation to default
    }
  }, [cameraMode]);

  return (
    <div className="h-full w-full bg-black text-white relative overflow-hidden">
      <style>{`
        .hud-panel {
          background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(20, 30, 50, 0.8));
          backdrop-filter: blur(15px);
          border: 2px solid rgba(0, 191, 255, 0.6);
          border-radius: 12px;
          box-shadow: 
            0 0 30px rgba(0, 191, 255, 0.3),
            inset 0 0 20px rgba(0, 191, 255, 0.1);
        }

        .glow-text {
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor,
            0 0 30px currentColor;
        }

        .control-button {
          background: linear-gradient(145deg, rgba(0, 191, 255, 0.2), rgba(0, 100, 200, 0.2));
          border: 1px solid rgba(0, 191, 255, 0.5);
          transition: all 0.3s ease;
        }

        .control-button:hover {
          background: linear-gradient(145deg, rgba(0, 191, 255, 0.4), rgba(0, 100, 200, 0.4));
          box-shadow: 0 0 20px rgba(0, 191, 255, 0.5);
        }

        .zone-indicator {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 8px;
          box-shadow: 0 0 10px currentColor;
        }
      `}</style>

      {/* 3D Scene Container */}
      <div ref={mountRef} className="w-full h-full" />

      {cameraMode === 'explore' && !isPointerLocked && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center pointer-events-none z-20">
            <div className="text-white text-3xl font-bold animate-pulse">Click to Explore</div>
            <div className="text-slate-300 mt-4 text-center">
                Use <kbd className="p-1 px-2 bg-slate-700/80 rounded mx-1">W</kbd> <kbd className="p-1 px-2 bg-slate-700/80 rounded mx-1">A</kbd> <kbd className="p-1 px-2 bg-slate-700/80 rounded mx-1">S</kbd> <kbd className="p-1 px-2 bg-slate-700/80 rounded mx-1">D</kbd> to move, <kbd className="p-1 px-2 bg-slate-700/80 rounded mx-1">Space</kbd> to jump, <kbd className="p-1 px-2 bg-slate-700/80 rounded mx-1">ESC</kbd> to exit.
            </div>
        </div>
      )}

      {/* 3D Map HUD */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Top Navigation */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-auto">
          <div className="hud-panel p-4">
            <h1 className="text-2xl font-bold glow-text text-cyan-300 mb-2">
              3D WORLD MAP
            </h1>
            <div className="text-sm text-slate-300">
              <div>EXPLORER MODE: <span className="text-cyan-400 font-bold">ACTIVE</span></div>
              <div>ZONES DISCOVERED: <span className="text-yellow-400">{mapZones.length}/7</span></div>
            </div>
          </div>

          <div className="hud-panel p-4">
            <div className="text-sm text-slate-300 space-y-1">
              <div>VIEW: <span className="text-cyan-400 font-bold">{viewMode.toUpperCase()}</span></div>
              <div>CAMERA: <span className="text-green-400">{cameraMode.toUpperCase()}</span></div>
            </div>
          </div>
        </div>

        {/* Zone Information Panel */}
        {selectedZone && cameraMode === 'orbit' && ( // Only show in orbit mode
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
            <div className="hud-panel p-6 text-center max-w-md">
              <div className="flex items-center justify-center mb-2">
                <div 
                  className="zone-indicator"
                  style={{ backgroundColor: selectedZone.color }}
                ></div>
                <h3 className="text-2xl font-bold text-white glow-text">
                  {selectedZone.name.toUpperCase()}
                </h3>
              </div>
              <p className="text-slate-300 mb-4">{selectedZone.description}</p>
              <div className="text-cyan-400 text-sm animate-pulse">
                &lt; CLICK TO ENTER ZONE &gt;
              </div>
            </div>
          </div>
        )}

        {/* Zone Directory */}
        <div className="absolute bottom-4 left-4 pointer-events-auto">
          <div className="hud-panel p-4 max-w-xs">
            <h3 className="text-yellow-400 font-bold mb-3 glow-text">
              🗺️ ZONE DIRECTORY
            </h3>
            <div className="space-y-2 text-sm max-h-40 overflow-y-auto">
              {mapZones.map((zone, index) => (
                <div key={zone.id} className="flex items-center gap-2 text-slate-300">
                  <div 
                    className="zone-indicator"
                    style={{ backgroundColor: zone.color }}
                  ></div>
                  <div className="flex-1">
                    <div className="font-medium">{zone.name}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Camera Controls */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 pointer-events-auto">
          <div className="hud-panel p-3">
            <div className="text-xs text-slate-400 mb-2">CAMERA CONTROLS</div>
            <div className="space-y-2">
              <button 
                onClick={() => setCameraMode('orbit')}
                className={`control-button px-3 py-1 rounded text-xs w-full ${cameraMode === 'orbit' ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                ORBIT
              </button>
              <button 
                onClick={() => setCameraMode('explore')}
                className={`control-button px-3 py-1 rounded text-xs w-full ${cameraMode === 'explore' ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                EXPLORE
              </button>
            </div>
            <div className="text-xs text-slate-400 mt-3 mb-2">VIEW MODE</div>
            <div className="space-y-2">
              <button 
                onClick={() => setViewMode('overview')}
                className={`control-button px-3 py-1 rounded text-xs w-full ${viewMode === 'overview' ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                OVERVIEW
              </button>
              <button 
                onClick={() => setViewMode('close')}
                className={`control-button px-3 py-1 rounded text-xs w-full ${viewMode === 'close' ? 'text-cyan-400' : 'text-slate-300'}`}
              >
                DETAILED
              </button>
            </div>
          </div>
        </div>

        {/* Mini Map */}
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <div className="hud-panel p-3">
            <div className="text-xs text-slate-400 mb-2">MINI MAP</div>
            <div className="w-32 h-32 bg-slate-900/50 border border-cyan-400/30 rounded relative">
              {mapZones.map((zone, index) => {
                const x = ((zone.position.x + 50) / 100) * 128;
                const z = ((zone.position.z + 50) / 100) * 128;
                return (
                  <div
                    key={zone.id}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: zone.color,
                      left: `${Math.max(0, Math.min(x - 4, 124))}px`,
                      top: `${Math.max(0, Math.min(z - 4, 124))}px`,
                      boxShadow: `0 0 4px ${zone.color}`
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}