import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];

/**
 * Dedicated 1:1 WebRTC transport for Luna friend calls.
 * Signaling reuses the existing VoiceSignal entity so voice/video calls share
 * the same realtime infrastructure already used by multiplayer voice.
 */
export default function useDirectWebRTCCall({
  active,
  roomId,
  mode = 'voice',
  user,
  peerId,
  muted = false,
  cameraOff = false,
}) {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionState, setConnectionState] = useState('idle');
  const [error, setError] = useState(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef([]);
  const processedSignalsRef = useRef(new Set());

  useEffect(() => {
    if (!active || !roomId || !user?.id || !peerId) return undefined;

    let cancelled = false;
    let unsubscribe = null;
    let initiateTimer = null;

    const sendSignal = (type, payload) => base44.entities.VoiceSignal.create({
      channel_id: roomId,
      sender_id: user.id,
      target_id: peerId,
      type,
      payload,
    });

    const createPeer = () => {
      if (pcRef.current) return pcRef.current;
      const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
      pcRef.current = pc;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) sendSignal('ice-candidate', event.candidate.toJSON()).catch(() => {});
      };

      pc.ontrack = (event) => {
        const stream = event.streams?.[0] || new MediaStream([event.track]);
        setRemoteStream(stream);
      };

      pc.onconnectionstatechange = () => {
        if (cancelled) return;
        setConnectionState(pc.connectionState || 'connecting');
      };

      return pc;
    };

    const flushCandidates = async (pc) => {
      if (!pc.remoteDescription || pendingCandidatesRef.current.length === 0) return;
      const queued = [...pendingCandidatesRef.current];
      pendingCandidatesRef.current = [];
      for (const candidate of queued) {
        try { await pc.addIceCandidate(candidate); } catch (candidateError) {
          console.warn('[LunaCall] ICE candidate rejected', candidateError);
        }
      }
    };

    const handleSignal = async (signal) => {
      if (!signal || signal.channel_id !== roomId || signal.target_id !== user.id) return;
      if (signal.id && processedSignalsRef.current.has(signal.id)) return;
      if (signal.id) processedSignalsRef.current.add(signal.id);

      const pc = createPeer();
      try {
        if (signal.type === 'offer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setLocalDescription({ type: 'rollback' });
          }
          if (pc.signalingState !== 'stable') return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await sendSignal('answer', { type: answer.type, sdp: answer.sdp });
          await flushCandidates(pc);
        } else if (signal.type === 'answer') {
          if (pc.signalingState !== 'have-local-offer') return;
          await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
          await flushCandidates(pc);
        } else if (signal.type === 'ice-candidate') {
          const candidate = new RTCIceCandidate(signal.payload);
          if (pc.remoteDescription) await pc.addIceCandidate(candidate);
          else pendingCandidatesRef.current.push(candidate);
        }
      } catch (signalError) {
        console.error('[LunaCall] Failed to process signal', signalError);
        if (!cancelled) setError(signalError);
      }
    };

    const initiate = async () => {
      const pc = createPeer();
      if (pc.signalingState !== 'stable') return;
      try {
        const offer = await pc.createOffer();
        if (pc.signalingState !== 'stable') return;
        await pc.setLocalDescription(offer);
        await sendSignal('offer', { type: offer.type, sdp: offer.sdp });
      } catch (offerError) {
        console.error('[LunaCall] Failed to create offer', offerError);
        if (!cancelled) setError(offerError);
      }
    };

    const start = async () => {
      setConnectionState('requesting-media');
      setError(null);
      processedSignalsRef.current = new Set();
      pendingCandidatesRef.current = [];

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: mode === 'video' ? { width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        localStreamRef.current = stream;
        stream.getAudioTracks().forEach((track) => { track.enabled = !muted; });
        stream.getVideoTracks().forEach((track) => { track.enabled = !cameraOff; });
        setLocalStream(stream);
        setConnectionState('connecting');

        unsubscribe = base44.entities.VoiceSignal.subscribe((event) => {
          if (event?.type === 'create' || event?.type === 'update') handleSignal(event.data);
        });

        // Catch a signaling packet that landed during media-permission prompts.
        try {
          const existing = await base44.entities.VoiceSignal.filter({
            channel_id: roomId,
            target_id: user.id,
          });
          for (const signal of existing || []) await handleSignal(signal);
        } catch (historyError) {
          console.warn('[LunaCall] Could not preload signaling history', historyError);
        }

        createPeer();
        // Deterministic initiator avoids two offers racing each other.
        if (String(user.id) > String(peerId)) {
          initiateTimer = window.setTimeout(initiate, 220);
        }
      } catch (mediaError) {
        console.error('[LunaCall] Media permission/device error', mediaError);
        if (!cancelled) {
          setError(mediaError);
          setConnectionState('media-error');
        }
      }
    };

    start();

    return () => {
      cancelled = true;
      if (initiateTimer) window.clearTimeout(initiateTimer);
      if (unsubscribe) unsubscribe();
      if (pcRef.current) {
        try { pcRef.current.close(); } catch {}
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
        localStreamRef.current = null;
      }
      setLocalStream(null);
      setRemoteStream(null);
      pendingCandidatesRef.current = [];
    };
  }, [active, roomId, mode, user?.id, peerId]);

  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !muted; });
  }, [muted]);

  useEffect(() => {
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = !cameraOff; });
  }, [cameraOff]);

  return { localStream, remoteStream, connectionState, error };
}
