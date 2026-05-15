/**
 * Proximity Voice System for the 3D game world.
 *
 * - Press ` (backtick) to toggle the local mic on/off
 * - Voice is streamed via WebRTC peer connections (signaled through VoiceSignal entity)
 * - Each remote peer's audio is routed through a GainNode whose volume is
 *   driven by the 3D distance between the two players' avatars (falloff)
 * - When a peer is talking, they broadcast a `talking` flag via DB presence
 *   so the UI can show a floating mic icon above their head
 */
import { base44 } from '@/api/base44Client';

const VOICE_CHANNEL = 'game_voice_main';
const MAX_HEAR_DISTANCE = 25;   // beyond this → muted
const FULL_VOLUME_DISTANCE = 4; // within this → full volume

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Creates a proximity voice manager.
 * @param {object} opts
 * @param {string} opts.userId
 * @param {() => {x:number,y:number,z:number}} opts.getLocalPos  - local player world pos
 * @param {(playerId: string) => {x:number,y:number,z:number}|null} opts.getRemotePos
 * @param {(playerId: string, talking: boolean) => void} opts.onRemoteTalking
 */
export function createProximityVoice({ userId, getLocalPos, getRemotePos, onRemoteTalking }) {
  let localStream = null;
  let micEnabled = false;
  let audioCtx = null;
  let unsubSignal = null;

  const peers = new Map(); // peerId → { pc, gainNode, audioEl, talking }

  const ensureAudioContext = () => {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    return audioCtx;
  };

  const sendSignal = (targetId, type, payload) => {
    base44.entities.VoiceSignal.create({
      channel_id: VOICE_CHANNEL,
      sender_id: userId,
      target_id: targetId,
      type,
      payload,
    }).catch(() => {});
  };

  const createPeer = (peerId) => {
    if (peers.has(peerId)) return peers.get(peerId);

    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const entry = { pc, gainNode: null, audioEl: null, talking: false };
    peers.set(peerId, entry);

    if (localStream) {
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
    }

    pc.onicecandidate = (e) => {
      if (e.candidate) sendSignal(peerId, 'ice-candidate', e.candidate.toJSON());
    };

    pc.ontrack = (e) => {
      const ctx = ensureAudioContext();
      const source = ctx.createMediaStreamSource(e.streams[0]);
      const gain = ctx.createGain();
      gain.gain.value = 0;
      source.connect(gain).connect(ctx.destination);
      entry.gainNode = gain;

      // Also attach a muted <audio> element — required in some browsers
      // for the remote stream to actually start flowing to Web Audio.
      const audio = document.createElement('audio');
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      audio.muted = true;
      document.body.appendChild(audio);
      audio.play().catch(() => {});
      entry.audioEl = audio;
    };

    pc.onconnectionstatechange = () => {
      if (['failed', 'closed', 'disconnected'].includes(pc.connectionState)) {
        removePeer(peerId);
      }
    };

    return entry;
  };

  const removePeer = (peerId) => {
    const entry = peers.get(peerId);
    if (!entry) return;
    try { entry.pc.close(); } catch {}
    if (entry.audioEl) {
      entry.audioEl.pause();
      entry.audioEl.srcObject = null;
      entry.audioEl.parentNode?.removeChild(entry.audioEl);
    }
    peers.delete(peerId);
    onRemoteTalking?.(peerId, false);
  };

  const callPeer = async (peerId) => {
    const { pc } = createPeer(peerId);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(peerId, 'offer', { sdp: offer.sdp, type: offer.type });
  };

  const handleSignal = async (signal) => {
    const peerId = signal.sender_id;
    if (signal.target_id !== userId || signal.channel_id !== VOICE_CHANNEL) return;

    if (signal.type === 'offer') {
      const { pc } = createPeer(peerId);
      await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(peerId, 'answer', { sdp: answer.sdp, type: answer.type });
    } else if (signal.type === 'answer') {
      const entry = peers.get(peerId);
      if (entry?.pc.remoteDescription === null || !entry?.pc.remoteDescription) {
        await entry?.pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
      }
    } else if (signal.type === 'ice-candidate') {
      const entry = peers.get(peerId) || createPeer(peerId);
      try { await entry.pc.addIceCandidate(new RTCIceCandidate(signal.payload)); } catch {}
    } else if (signal.type === 'talking-state') {
      const entry = peers.get(peerId);
      if (entry) {
        entry.talking = !!signal.payload?.talking;
        onRemoteTalking?.(peerId, entry.talking);
      }
    }
  };

  // Subscribe to incoming signals
  unsubSignal = base44.entities.VoiceSignal.subscribe((event) => {
    if (event.type === 'create' || event.type === 'update') handleSignal(event.data);
  });

  // Toggle mic on/off — first toggle requests permission
  const toggleMic = async () => {
    if (!localStream) {
      try {
        ensureAudioContext();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        localStream = stream;
      } catch (err) {
        console.error('Mic permission denied', err);
        window.dispatchEvent(new CustomEvent('proximityVoiceMicError'));
        return false;
      }
      // Add track to any pre-existing peers (none expected on first toggle, but safe)
      peers.forEach((entry) => {
        localStream.getTracks().forEach((t) => entry.pc.addTrack(t, localStream));
      });
    }
    micEnabled = !micEnabled;
    localStream.getAudioTracks().forEach((t) => { t.enabled = micEnabled; });

    // Broadcast talking-state to all peers via signaling so they can show our mic icon
    peers.forEach((_, peerId) => {
      sendSignal(peerId, 'talking-state', { talking: micEnabled });
    });
    return micEnabled;
  };

  const isMicOn = () => micEnabled;

  // Connect to a list of remote players (called by GameWorld3D when remotes appear/leave)
  const syncPeers = (remoteIds) => {
    const set = new Set(remoteIds);
    // Remove peers no longer present
    peers.forEach((_, pid) => { if (!set.has(pid)) removePeer(pid); });
    // Initiate calls for new peers (deterministic initiator: larger ID calls)
    set.forEach((pid) => {
      if (!peers.has(pid) && userId > pid) {
        callPeer(pid).catch(() => {});
      } else if (!peers.has(pid)) {
        // Pre-create the connection so incoming offers find an entry quickly
        createPeer(pid);
      }
    });
  };

  // Per-frame: update gain nodes based on 3D distance between local and remote
  const updateSpatialGains = () => {
    const lp = getLocalPos();
    if (!lp) return;
    peers.forEach((entry, peerId) => {
      if (!entry.gainNode) return;
      const rp = getRemotePos(peerId);
      if (!rp) { entry.gainNode.gain.value = 0; return; }
      const dx = rp.x - lp.x;
      const dy = (rp.y || 0) - (lp.y || 0);
      const dz = rp.z - lp.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      let vol;
      if (dist <= FULL_VOLUME_DISTANCE) vol = 1.0;
      else if (dist >= MAX_HEAR_DISTANCE) vol = 0;
      else vol = 1 - (dist - FULL_VOLUME_DISTANCE) / (MAX_HEAR_DISTANCE - FULL_VOLUME_DISTANCE);
      // Smooth toward target to avoid clicks
      const cur = entry.gainNode.gain.value;
      entry.gainNode.gain.value = cur + (vol - cur) * 0.25;
    });
  };

  const dispose = () => {
    if (unsubSignal) unsubSignal();
    peers.forEach((_, pid) => removePeer(pid));
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
      localStream = null;
    }
    if (audioCtx) { audioCtx.close().catch(() => {}); audioCtx = null; }
  };

  return { toggleMic, isMicOn, syncPeers, updateSpatialGains, dispose };
}