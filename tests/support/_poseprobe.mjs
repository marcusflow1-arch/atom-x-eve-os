import { makeGame, addFoe, run } from './game2Sim.mjs';
const g = makeGame({ ja: true }); g.aiOff = true; const f = addFoe(g, [0, 0, 5]); f.status = 'executing'; f.yaw = 0; run(g, 2);
const names = process.argv.slice(2);
for (const n of names) {
  const A = f.actor.skel.anims[n]; if (!A) { console.log(n, 'missing'); continue; }
  f.playWhole(n, { blend: 0 }); const dur = A.n / Math.abs(A.fps), rows = [];
  for (let t = 0; t < dur; t += Math.max(0.1, dur / 10)) { run(g, Math.max(1, Math.round(Math.max(0.1, dur / 10) * 60))); const a = f.actor, H = a.bonePos('cranium'), L = a.bonePos('lhand'), R = a.bonePos('rhand'), C = a.bonePos('thoracic'), P = f.pos;
    const fwd = h => (h[2] - P[2]); // the foe faces +z (yaw 0)
    rows.push(`${t.toFixed(2)}: Rf${fwd(R).toFixed(2)} Lf${fwd(L).toFixed(2)} Ry${(R[1] - H[1]).toFixed(2)} Ly${(L[1] - H[1]).toFixed(2)} sep${Math.hypot(L[0] - R[0], L[1] - R[1], L[2] - R[2]).toFixed(2)} chestD${Math.hypot((L[0] + R[0]) / 2 - C[0], (L[1] + R[1]) / 2 - C[1], (L[2] + R[2]) / 2 - C[2]).toFixed(2)}`); }
  console.log(n, dur.toFixed(2) + 's\n  ' + rows.join('\n  '));
}
