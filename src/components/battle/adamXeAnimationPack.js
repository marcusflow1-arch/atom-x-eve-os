import * as THREE from 'three';

// Enhanced Adam XE combat/reaction tracks extracted from the user's new male
// and Artemis demo GLBs. The hosted avatars use the same named skeleton joints,
// so these exact authored tracks are injected onto the current meshes at runtime.
// Values are half-float + gzip packed to keep the web bundle compact.
const PACK_PARTS = [
