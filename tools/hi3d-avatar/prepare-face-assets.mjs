import fs from 'node:fs';
const {version}=JSON.parse(fs.readFileSync('node_modules/@mediapipe/tasks-vision/package.json','utf8'));
const source=fs.readFileSync('src/components/onboarding/selfieFit.js','utf8');
if(!source.includes('/vendor/face-landmarker/'+version))throw Error('Face runtime URL must match the pinned package version');
const destination='public/vendor/face-landmarker';
fs.rmSync(destination,{recursive:true,force:true});
fs.mkdirSync(destination+'/'+version,{recursive:true});
fs.cpSync('node_modules/@mediapipe/tasks-vision/wasm',destination+'/'+version,{recursive:true});
console.log('Local face scanner runtime prepared: '+version);
