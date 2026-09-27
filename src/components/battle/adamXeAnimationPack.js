import * as THREE from 'three';

// Enhanced Adam XE animation tracks extracted from the user's new male and
// Artemis demo GLBs. The hosted avatars use the exact same named skeleton
// joints, so these tracks are injected onto the current meshes at runtime.
// Values are half-float + gzip packed to keep this source bundle compact.
const PACK_PARTS = [
