/* eslint-disable */
// Ghoul2 (_humanoid.gla) animation evaluator retargeted onto the explorer skeleton.
// Pure math, no three.js dependency. Axes of all internal maths = G2 (X left, Y back, Z up);
// outputs are converted to glTF axes (X left, Y up, Z front).
function qToMat(w,x,y,z,o){ // unit quaternion -> 3x3 row-major into o
  const xx=x*x,yy=y*y,zz=z*z,xy=x*y,xz=x*z,yz=y*z,wx=w*x,wy=w*y,wz=w*z;
  o[0]=1-2*(yy+zz);o[1]=2*(xy-wz);o[2]=2*(xz+wy);
  o[3]=2*(xy+wz);o[4]=1-2*(xx+zz);o[5]=2*(yz-wx);
  o[6]=2*(xz-wy);o[7]=2*(yz+wx);o[8]=1-2*(xx+yy); }
function mul(a,b,o){ // 3x3 row-major a*b
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)o[i*3+j]=a[i*3]*b[j]+a[i*3+1]*b[3+j]+a[i*3+2]*b[6+j]; }
function mulT(a,b,o){ // a^T * b
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)o[i*3+j]=a[i]*b[j]+a[3+i]*b[3+j]+a[6+i]*b[6+j]; }
function matToQuat(m,o){ // -> x,y,z,w
  const t=m[0]+m[4]+m[8]; let x,y,z,w;
  if(t>0){const s=Math.sqrt(t+1)*2;w=s/4;x=(m[7]-m[5])/s;y=(m[2]-m[6])/s;z=(m[3]-m[1])/s;}
  else if(m[0]>m[4]&&m[0]>m[8]){const s=Math.sqrt(1+m[0]-m[4]-m[8])*2;w=(m[7]-m[5])/s;x=s/4;y=(m[1]+m[3])/s;z=(m[2]+m[6])/s;}
  else if(m[4]>m[8]){const s=Math.sqrt(1+m[4]-m[0]-m[8])*2;w=(m[2]-m[6])/s;x=(m[1]+m[3])/s;y=s/4;z=(m[5]+m[7])/s;}
  else{const s=Math.sqrt(1+m[8]-m[0]-m[4])*2;w=(m[3]-m[1])/s;x=(m[2]+m[6])/s;y=(m[5]+m[7])/s;z=s/4;}
  const l=Math.hypot(x,y,z,w); o[0]=x/l;o[1]=y/l;o[2]=z/l;o[3]=w/l; }
export class G2Rig{
  constructor(rigJson, qBank, pelBank){
    const R=rigJson.rig; this.R=R; this.q=qBank; this.pel=pelBank; this.nB=R.nBones;
    this.g2Names=R.g2Bones; this.g2Id={}; R.g2Bones.forEach((n,i)=>this.g2Id[n]=i);
    this.parent=R.g2Parent; this.nF=R.nFrames;
    // topological order
    const seen=new Uint8Array(this.nB), ord=[]; const visit=b=>{ if(seen[b])return; if(this.parent[b]>=0)visit(this.parent[b]); seen[b]=1; ord.push(b); };
    for(let b=0;b<this.nB;b++)visit(b); this.order=ord;
    // torso branch = descendants of lower_lumbar
    const tr=this.g2Id['lower_lumbar']; this.torso=new Uint8Array(this.nB);
    for(let b=0;b<this.nB;b++){ let c=b; while(c>=0){ if(c===tr){this.torso[b]=1;break;} c=this.parent[c]; } }
    this.nest=R.nestOrder; this.nestPar=R.nest; this.rest=R.rest;
    this.qinv=this.nest.map(n=>R.qinv[n]?Float64Array.from(R.qinv[n].flat()):null);
    this.nestG2=this.nest.map(n=>this.g2Id[n]);
    this.K=new Float64Array(this.nB*9); this.C=new Float64Array(9); this.S={}; this.Sarr=this.nest.map(()=>new Float64Array(9));
    this.tmp=new Float64Array(9); this.tmp2=new Float64Array(9);
    this.pelBase=R.g2PelvisBase; this.scale=R.scale; this.rootId=this.g2Id['model_root']; this.pelId=this.g2Id['pelvis'];
    this.restPelvis=R.rest['pelvis']; this.restRoot=R.rest['model_root'];
    this.nestIdx={}; this.nest.forEach((n,i)=>this.nestIdx[n]=i);
    this.localQ=this.nest.map(()=>new Float64Array(4)); this.pelvisPos=new Float64Array(3);
    this.Rroot=new Float64Array(9);
    this.pelParentLocal=[0,0,0];
  }
  // frameLegs: frame for model_root/pelvis/legs ; frameTorso: for lower_lumbar subtree
  evaluate(frameLegs, frameTorso){
    const nB=this.nB,K=this.K,q=this.q,C=this.C;
    for(const b of this.order){
      const f=this.torso[b]?frameTorso:frameLegs; const o=(f*nB+b)*4;
      qToMat(q[o]/32767,q[o+1]/32767,q[o+2]/32767,q[o+3]/32767,C);
      const p=this.parent[b];
      if(p<0){ for(let i=0;i<9;i++)K[b*9+i]=C[i]; }
      else { const kp=K.subarray(p*9,p*9+9); mul(kp,C,this.tmp); for(let i=0;i<9;i++)K[b*9+i]=this.tmp[i]; }
    }
    // S per nest bone
    for(let i=0;i<this.nest.length;i++){
      const kb=K.subarray(this.nestG2[i]*9,this.nestG2[i]*9+9); const qi=this.qinv[i]; const S=this.Sarr[i];
      if(qi) mul(kb,qi,S); else for(let k=0;k<9;k++)S[k]=kb[k];
    }
    // pelvis displacement (G2 scaled units -> metres)
    const Kp=K.subarray(this.pelId*9,this.pelId*9+9), Kr=K.subarray(this.rootId*9,this.rootId*9+9);
    const fl=frameLegs; const ct=[this.pel[fl*3],this.pel[fl*3+1],this.pel[fl*3+2]];
    const gb=this.pelBase; const d=[0,0,0];
    for(let i=0;i<3;i++) d[i]=Kp[i*3]*gb[0]+Kp[i*3+1]*gb[1]+Kp[i*3+2]*gb[2] + Kr[i*3]*ct[0]+Kr[i*3+1]*ct[1]+Kr[i*3+2]*ct[2] - gb[i];
    const sc=this.scale, rp=this.restPelvis, rr=this.restRoot;
    // pelvis local translation relative to model_root, G2 axes -> glTF axes
    const lx=rp[0]+d[0]*sc-rr[0], ly=rp[1]+d[1]*sc-rr[1], lz=rp[2]+d[2]*sc-rr[2];
    this.pelvisPos[0]=lx; this.pelvisPos[1]=lz; this.pelvisPos[2]=-ly;
    // local rotations
    for(let i=0;i<this.nest.length;i++){
      const par=this.nestPar[this.nest[i]]; const Sb=this.Sarr[i];
      let m=this.tmp2;
      if(par in this.nestIdx){ mulT(this.Sarr[this.nestIdx[par]],Sb,m); } else { for(let k=0;k<9;k++)m[k]=Sb[k]; }
      const o=this.localQ[i]; matToQuat(m,o); // G2 axes x,y,z,w
      const x=o[0],y=o[1],z=o[2],w=o[3]; o[0]=x; o[1]=z; o[2]=-y; o[3]=w; // -> glTF axes
    }
  }
}
export function frameOf(anim, t, loop){ // t seconds since start -> frame index inside the sequence
  const n=anim.n; if(n<=1) return anim.first; const fps=Math.abs(anim.fps)||20; let k=t*fps;
  if(anim.fps<0){ k=(n-1)-k; }
  if(loop){ const L=anim.loop>=0?anim.loop:0; if(anim.fps<0){ /* reversed: ignore loop frame */ k=((k%n)+n)%n; } else { if(k>=n){ const span=n-L; k=L+((k-L)%span); } } }
  else k=Math.max(0,Math.min(n-1,k));
  return anim.first+Math.floor(k);
}
