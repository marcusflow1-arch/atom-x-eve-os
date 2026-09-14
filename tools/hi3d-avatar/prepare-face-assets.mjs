import fs from 'node:fs';
fs.mkdirSync('public/vendor/face-landmarker',{recursive:true});
fs.cpSync('node_modules/@mediapipe/tasks-vision/wasm','public/vendor/face-landmarker',{recursive:true});
console.log('Local face scanner runtime prepared.');
