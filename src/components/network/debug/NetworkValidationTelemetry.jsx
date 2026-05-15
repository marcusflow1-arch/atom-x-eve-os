// Slice C — NetworkValidationTelemetry (NVT)
// Read-only runtime telemetry layer. Observes legacy + network remote pipelines
// and prints a deterministic per-second report to console. Touches NO gameplay,
// rendering, or networking state. Fully reversible — controlled by the
// `enableNetworkValidationTelemetry` feature flag.
//
// IMPORTANT — ID mismatch caveat:
//   Legacy WebRTC remotes are keyed by Base44 user_id (player_id).
//   Network remotes are keyed by server-assigned session id from `welcome`.
//   These do NOT match, so drift between legacy & network is computed by
//   nearest-neighbor position pairing (legacy ↔ closest network within 5 units).
//   Unmatched entities on either side are reported as "unpaired".

import { useEffect, useRef } from 'react';
import { realtimeNetwork } from '@/components/network/realtimeNetworkManager';
import {
  getNetworkFlag,
  subscribeNetworkFlags,
} from '@/components/network/networkFeatureFlags';

const SAMPLE_HZ = 10;                // sample 10x/sec
const SAMPLE_INTERVAL_MS = 1000 / SAMPLE_HZ;
const REPORT_INTERVAL_MS = 10_000;   // print report every 10s
const PAIR_MAX_DISTANCE = 5;         // units — beyond this, entities are not paired
const PRED_SPIKE_THRESHOLD = 0.5;    // units of prediction error counted as a "spike"
const TREND_WINDOW = 30;             // last N drift samples used to compute slope
const TREND_STABLE_EPSILON = 0.005;  // |slope| below this => "stable"

function dist3(a, b) {
  const dx = a.x - b.x, dy = a.y - b.y, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Linear regression slope on a series of y-values (x = index).
function slope(samples) {
  const n = samples.length;
  if (n < 2) return 0;
  let sx = 0, sy = 0, sxx = 0, sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += i; sy += samples[i];
    sxx += i * i; sxy += i * samples[i];
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return 0;
  return (n * sxy - sx * sy) / denom;
}

function pct(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * p));
  return sorted[idx];
}

function normalizeAnim(a) {
  if (!a) return 'idle';
  if (a === 'walk' || a === 'run') return 'run';
  if (a === 'fall') return 'jump';
  return a;
}

export default function NetworkValidationTelemetry() {
  const sampleTimerRef = useRef(null);
  const reportTimerRef = useRef(null);
  const enabledRef = useRef(false);
  const stateRef = useRef(null);

  function resetState() {
    stateRef.current = {
      startedAt: performance.now(),
      driftSamples: [],            // per-pair drift sampled at 10Hz
      predErrSamples: [],          // realtimeNetwork.predictionError sampled at 10Hz
      legacyCountSamples: [],
      networkCountSamples: [],
      mixerCountSamples: [],
      animMatched: 0,
      animMismatched: 0,
      pairCountSamples: [],
      unpairedLegacy: 0,
      unpairedNetwork: 0,
      // lifecycle counters (delta vs previous sample)
      lastLegacyIds: new Set(),
      lastNetworkIds: new Set(),
      legacySpawns: 0, legacyDespawns: 0,
      networkSpawns: 0, networkDespawns: 0,
      // perf
      lastSampleAt: performance.now(),
      sampleDtMs: [],
    };
  }

  function takeSample() {
    const s = stateRef.current;
    if (!s) return;
    const now = performance.now();
    s.sampleDtMs.push(now - s.lastSampleAt);
    if (s.sampleDtMs.length > 200) s.sampleDtMs.shift();
    s.lastSampleAt = now;

    // --- gather sources (read-only) ---
    const legacyMgr = window.__gw3dLegacyRemoteManager;
    const networkMgr = window.__networkRemotesManager;
    const legacyMap = legacyMgr?.getRemotes?.() || new Map();
    const networkEntities = networkMgr?.getEntities?.() || new Map();

    // --- counts ---
    s.legacyCountSamples.push(legacyMap.size);
    s.networkCountSamples.push(networkEntities.size);
    if (s.legacyCountSamples.length > 600) s.legacyCountSamples.shift();
    if (s.networkCountSamples.length > 600) s.networkCountSamples.shift();

    // --- lifecycle delta tracking ---
    const currentLegacyIds = new Set(legacyMap.keys());
    const currentNetworkIds = new Set(networkEntities.keys());
    for (const id of currentLegacyIds) if (!s.lastLegacyIds.has(id)) s.legacySpawns++;
    for (const id of s.lastLegacyIds) if (!currentLegacyIds.has(id)) s.legacyDespawns++;
    for (const id of currentNetworkIds) if (!s.lastNetworkIds.has(id)) s.networkSpawns++;
    for (const id of s.lastNetworkIds) if (!currentNetworkIds.has(id)) s.networkDespawns++;
    s.lastLegacyIds = currentLegacyIds;
    s.lastNetworkIds = currentNetworkIds;

    // --- mixer count (proxy for memory stability) ---
    let mixerCount = 0;
    legacyMap.forEach((r) => { if (r.mixer) mixerCount++; });
    networkEntities.forEach((e) => { if (e.mixer || (e.update && e.applyState)) mixerCount++; });
    s.mixerCountSamples.push(mixerCount);
    if (s.mixerCountSamples.length > 600) s.mixerCountSamples.shift();

    // --- prediction error ---
    const pe = realtimeNetwork.status().predictionError;
    if (typeof pe === 'number' && !Number.isNaN(pe)) {
      s.predErrSamples.push(pe);
      if (s.predErrSamples.length > 600) s.predErrSamples.shift();
    }

    // --- nearest-neighbor pairing for drift ---
    // Build network position list
    const networkList = [];
    networkEntities.forEach((e) => {
      const g = e.getGroup?.();
      if (g) networkList.push({ id: e.id, pos: { x: g.position.x, y: g.position.y, z: g.position.z }, anim: normalizeAnim(e.getStatus?.()?.anim) });
    });

    const claimed = new Set();
    let pairsThisSample = 0;
    let unpairedLegacyThisSample = 0;

    legacyMap.forEach((r) => {
      const lp = r.group.position;
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let i = 0; i < networkList.length; i++) {
        if (claimed.has(i)) continue;
        const d = dist3(lp, networkList[i].pos);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }
      if (bestIdx >= 0 && bestDist <= PAIR_MAX_DISTANCE) {
        claimed.add(bestIdx);
        pairsThisSample++;
        s.driftSamples.push(bestDist);
        if (s.driftSamples.length > 1200) s.driftSamples.shift();
        // animation match
        const legacyAnim = normalizeAnim(r.current);
        const netAnim = networkList[bestIdx].anim;
        if (legacyAnim === netAnim) s.animMatched++; else s.animMismatched++;
      } else {
        unpairedLegacyThisSample++;
      }
    });

    const unpairedNetworkThisSample = networkList.length - claimed.size;
    s.unpairedLegacy += unpairedLegacyThisSample;
    s.unpairedNetwork += unpairedNetworkThisSample;
    s.pairCountSamples.push(pairsThisSample);
    if (s.pairCountSamples.length > 600) s.pairCountSamples.shift();
  }

  function printReport() {
    const s = stateRef.current;
    if (!s) return;

    const elapsedSec = ((performance.now() - s.startedAt) / 1000).toFixed(1);

    // --- drift ---
    let avgDrift = 0, maxDrift = 0, p95Drift = 0, trendLabel = 'n/a';
    if (s.driftSamples.length > 0) {
      avgDrift = s.driftSamples.reduce((a, b) => a + b, 0) / s.driftSamples.length;
      maxDrift = Math.max(...s.driftSamples);
      p95Drift = pct(s.driftSamples, 0.95);
      const recent = s.driftSamples.slice(-TREND_WINDOW);
      const sl = slope(recent);
      if (Math.abs(sl) < TREND_STABLE_EPSILON) trendLabel = `stable (slope ${sl.toFixed(4)})`;
      else if (sl > 0) trendLabel = `INCREASING (slope ${sl.toFixed(4)})`;
      else trendLabel = `decreasing (slope ${sl.toFixed(4)})`;
    }

    // --- prediction error ---
    let avgPE = 0, maxPE = 0, spikeCount = 0, spikeRatePerMin = 0;
    if (s.predErrSamples.length > 0) {
      avgPE = s.predErrSamples.reduce((a, b) => a + b, 0) / s.predErrSamples.length;
      maxPE = Math.max(...s.predErrSamples);
      spikeCount = s.predErrSamples.filter((v) => v > PRED_SPIKE_THRESHOLD).length;
      const minutes = Math.max(0.001, (performance.now() - s.startedAt) / 60000);
      spikeRatePerMin = spikeCount / minutes;
    }

    // --- counts ---
    const lastLegacy = s.legacyCountSamples.at(-1) ?? 0;
    const lastNetwork = s.networkCountSamples.at(-1) ?? 0;
    const lastMixer = s.mixerCountSamples.at(-1) ?? 0;
    const mixerSlope = slope(s.mixerCountSamples.slice(-60));

    // --- animation ---
    const totalAnimSamples = s.animMatched + s.animMismatched;
    const animDivergencePct = totalAnimSamples > 0
      ? (s.animMismatched / totalAnimSamples) * 100
      : 0;

    // --- pairing ---
    const avgPairs = s.pairCountSamples.length > 0
      ? s.pairCountSamples.reduce((a, b) => a + b, 0) / s.pairCountSamples.length
      : 0;

    // --- sampling perf ---
    const avgSampleDt = s.sampleDtMs.length > 0
      ? s.sampleDtMs.reduce((a, b) => a + b, 0) / s.sampleDtMs.length
      : 0;

    // --- verdict ---
    const verdicts = [];
    if (s.driftSamples.length === 0) {
      verdicts.push('NO PAIRED REMOTES — drift cannot be evaluated');
    } else {
      verdicts.push(trendLabel.startsWith('stable') || trendLabel.startsWith('decreasing')
        ? 'DRIFT: stable ✅'
        : 'DRIFT: increasing ❌');
    }
    verdicts.push(Math.abs(mixerSlope) < 0.05
      ? 'MIXER COUNT: stable ✅'
      : `MIXER COUNT: growing (slope ${mixerSlope.toFixed(3)}) ❌`);
    verdicts.push(animDivergencePct < 5
      ? `ANIM SYNC: ${animDivergencePct.toFixed(1)}% mismatch ✅`
      : `ANIM SYNC: ${animDivergencePct.toFixed(1)}% mismatch ⚠️`);
    verdicts.push(spikeRatePerMin < 10
      ? `PRED SPIKES: ${spikeRatePerMin.toFixed(1)}/min ✅`
      : `PRED SPIKES: ${spikeRatePerMin.toFixed(1)}/min ⚠️`);

    // eslint-disable-next-line no-console
    console.groupCollapsed(
      `%c[NVT] Validation Report — t+${elapsedSec}s`,
      'color:#22c55e;font-weight:bold;'
    );
    // eslint-disable-next-line no-console
    console.log('Drift (legacy↔network, paired):',
      `avg=${avgDrift.toFixed(3)}u  max=${maxDrift.toFixed(3)}u  p95=${p95Drift.toFixed(3)}u  trend=${trendLabel}  samples=${s.driftSamples.length}`);
    // eslint-disable-next-line no-console
    console.log('Prediction Error (local):',
      `avg=${avgPE.toFixed(3)}u  max=${maxPE.toFixed(3)}u  spikes>${PRED_SPIKE_THRESHOLD}u=${spikeCount}  rate=${spikeRatePerMin.toFixed(1)}/min`);
    // eslint-disable-next-line no-console
    console.log('Entity Lifecycle:',
      `legacy=${lastLegacy} (spawns=${s.legacySpawns}, despawns=${s.legacyDespawns})  network=${lastNetwork} (spawns=${s.networkSpawns}, despawns=${s.networkDespawns})`);
    // eslint-disable-next-line no-console
    console.log('Pairing:',
      `avg pairs/sample=${avgPairs.toFixed(2)}  unpaired-legacy(cum)=${s.unpairedLegacy}  unpaired-network(cum)=${s.unpairedNetwork}`);
    // eslint-disable-next-line no-console
    console.log('Animation Divergence:',
      `mismatched=${s.animMismatched}  matched=${s.animMatched}  ${animDivergencePct.toFixed(2)}%`);
    // eslint-disable-next-line no-console
    console.log('Memory Proxy:',
      `mixer count=${lastMixer}  slope(last 6s)=${mixerSlope.toFixed(3)} mixers/sample`);
    // eslint-disable-next-line no-console
    console.log('Sampler Health:',
      `target=${SAMPLE_INTERVAL_MS}ms  actual avg=${avgSampleDt.toFixed(1)}ms  samples=${s.sampleDtMs.length}`);
    // eslint-disable-next-line no-console
    console.log('%cVerdict:%c\n  ' + verdicts.join('\n  '),
      'color:#22c55e;font-weight:bold;', 'color:inherit;');
    // eslint-disable-next-line no-console
    console.groupEnd();
  }

  function start() {
    if (enabledRef.current) return;
    enabledRef.current = true;
    resetState();
    sampleTimerRef.current = setInterval(takeSample, SAMPLE_INTERVAL_MS);
    reportTimerRef.current = setInterval(printReport, REPORT_INTERVAL_MS);
    // eslint-disable-next-line no-console
    console.log('%c[NVT] started — sampling at ' + SAMPLE_HZ + 'Hz, reporting every '
      + (REPORT_INTERVAL_MS / 1000) + 's', 'color:#22c55e;font-weight:bold;');
  }

  function stop() {
    if (!enabledRef.current) return;
    enabledRef.current = false;
    if (sampleTimerRef.current) { clearInterval(sampleTimerRef.current); sampleTimerRef.current = null; }
    if (reportTimerRef.current) { clearInterval(reportTimerRef.current); reportTimerRef.current = null; }
    // Print one final report before clearing state so the last window isn't lost.
    try { printReport(); } catch {}
    stateRef.current = null;
    // eslint-disable-next-line no-console
    console.log('%c[NVT] stopped', 'color:#ef4444;font-weight:bold;');
  }

  useEffect(() => {
    if (getNetworkFlag('enableNetworkValidationTelemetry')) start();
    const unsub = subscribeNetworkFlags((flags) => {
      const want = !!flags.enableNetworkValidationTelemetry;
      if (want && !enabledRef.current) start();
      else if (!want && enabledRef.current) stop();
    });
    return () => {
      try { unsub && unsub(); } catch {}
      stop();
    };
  }, []);

  return null;
}