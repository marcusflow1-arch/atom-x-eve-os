import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useWebRTCVoice(roomId, user, isMuted, isDeafened, participantIds = [], options = {}) {
    const dataEnabled = options.data !== false;
    const participantsRef = useRef(participantIds); participantsRef.current = participantIds;
    const mutedRef = useRef(isMuted); mutedRef.current = isMuted;
    const deafenedRef = useRef(isDeafened); deafenedRef.current = isDeafened;
    const localStreamRef = useRef(null);
    const peersRef = useRef({});
    const dataChannelsRef = useRef({});
    const audioRefs = useRef({});
    const initiateCallRef = useRef(null);
    const pendingCandidates = useRef({});
    const processedSignals = useRef(new Set()); // de-dupe signal subscribe events

    // Expose a method to broadcast data to all peers
    useEffect(() => {
        if (!dataEnabled) return;
        window.webrtcBroadcast = (data) => {
            const msg = JSON.stringify(data);
            Object.values(dataChannelsRef.current).forEach(dc => {
                if (dc.readyState === 'open') {
                    dc.send(msg);
                }
            });
        };
        return () => {
            delete window.webrtcBroadcast;
        };
    }, [dataEnabled]);

    useEffect(() => {
        if (!roomId || !user) return;

        let isMounted = true;
        let unsubscribe = null;
        const startedAt = Date.now() - 15000;
        processedSignals.current = new Set();
        let queue = Promise.resolve();
        const receive = signal => {
          if (!isMounted || signal.channel_id !== roomId || signal.target_id !== user.id || Date.parse(signal.created_date || 0) < startedAt) return;
          if (!participantsRef.current.includes(signal.sender_id)) return;
          if (processedSignals.current.has(signal.id)) return;
          processedSignals.current.add(signal.id);
          queue = queue.then(() => isMounted && handleSignal(signal)).catch(console.error);
        };
        const loadInitialSignals = async () => {
          try {
            const rows = await base44.entities.VoiceSignal.filter({channel_id:roomId,target_id:user.id},'-created_date',30);
            if (!isMounted) return;
            rows.reverse().forEach(receive);
            for(const id of participantsRef.current) if(id !== user.id && user.id > id && !peersRef.current[id]) initiateCall(id);
          } catch(error) { console.warn('[Voice] initial signaling load',error); }
        };

        const initWebRTC = async () => {
            try {
                unsubscribe = base44.entities.VoiceSignal.subscribe((event) => {
                    if (event.type === 'create' || event.type === 'update') {
                        const signal = event.data;
                        receive(signal);
                    }
                });

                // Initiate connection to existing participants — only the peer
                // with the larger user.id initiates, to avoid duplicate offers
                // (a.k.a. "glare") that put RTCPeerConnection into a bad state.
                participantIds.forEach(pid => {
                    if (pid !== user.id && !peersRef.current[pid] && user.id > pid) {
                        initiateCall(pid);
                    }
                });

            } catch (err) {
                console.error("Failed to init WebRTC", err);
            }
        };

        initWebRTC();
        loadInitialSignals();

        return () => {
            isMounted = false;
            initiateCallRef.current = null;
            dataChannelsRef.current = {};
            if (unsubscribe) unsubscribe();
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            Object.values(peersRef.current).forEach(pc => pc.close());
            peersRef.current = {};
            Object.values(audioRefs.current).forEach(audio => {
                audio.pause();
                audio.srcObject = null;
                if (audio.parentNode) {
                    audio.parentNode.removeChild(audio);
                }
            });
            audioRefs.current = {};
            pendingCandidates.current = {};
        };

        function setupDataChannel(channel, peerId) {
            dataChannelsRef.current[peerId] = channel;
            channel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'movement') {
                        window.dispatchEvent(new CustomEvent('webrtcMovementUpdate', {
                            detail: { ...data.payload, player_id: peerId }
                        }));
                    } else if (data.type === 'action') {
                        // Real-time skill/ability/combat action from a peer
                        window.dispatchEvent(new CustomEvent('webrtcRemoteAction', {
                            detail: { ...data.payload, player_id: peerId }
                        }));
                    } else if (data.type === 'companion') {
                        // Real-time mount/companion sync (per-player). Forces
                        // player_id from the peer connection so each remote
                        // companion is keyed to the correct rider.
                        window.dispatchEvent(new CustomEvent('remoteCompanionUpdate', {
                            detail: { ...data.payload, player_id: peerId }
                        }));
                    } else if (data.type === 'enemy_snapshot') {
                        // Host-authoritative enemy world state (positions / HP).
                        window.dispatchEvent(new CustomEvent('webrtcEnemySnapshot', {
                            detail: data.payload
                        }));
                    } else if (data.type === 'boss_snapshot') {
                        // Host-authoritative boss world state.
                        window.dispatchEvent(new CustomEvent('webrtcBossSnapshot', {
                            detail: data.payload
                        }));
                    } else if (data.type === 'dm') {
                        // Real-time direct message. Only surface it if addressed
                        // to the current user — broadcast goes to all peers but
                        // only the intended receiver should react.
                        if (data.payload?.receiver_id === user.id) {
                            window.dispatchEvent(new CustomEvent('directMessageReceived', {
                                detail: { ...data.payload, sender_id: peerId }
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse data channel message", e);
                }
            };
            channel.onclose = () => {
                if (dataChannelsRef.current[peerId] === channel) delete dataChannelsRef.current[peerId];
            };
        }

        function createPeerConnection(peerId) {
            if (peersRef.current[peerId]) return peersRef.current[peerId];

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peersRef.current[peerId] = pc;

            // Create Data Channel for this peer
            const dataChannel = dataEnabled && user.id > peerId && pc.createDataChannel('gameData', {
                ordered: false, // UDP-like, fast
                maxRetransmits: 0
            });
            if (dataChannel) setupDataChannel(dataChannel, peerId);

            pc.ondatachannel = (event) => {
                setupDataChannel(event.channel, peerId);
            };

            const transceiver = pc.addTransceiver('audio', {direction:'sendrecv'});
            const track = localStreamRef.current?.getAudioTracks()[0];
            if (track) transceiver.sender.replaceTrack(track);

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    base44.entities.VoiceSignal.create({
                        channel_id: roomId,
                        sender_id: user.id,
                        target_id: peerId,
                        type: 'ice',
                        payload: event.candidate.toJSON()
                    }).catch(() => {});
                }
            };

            pc.ontrack = (event) => {
                if (!audioRefs.current[peerId]) {
                    const audio = document.createElement('audio');
                    audio.autoplay = true;
                    document.body.appendChild(audio);
                    audioRefs.current[peerId] = audio;
                }
                audioRefs.current[peerId].srcObject = event.streams[0] || new MediaStream([event.track]);
                audioRefs.current[peerId].muted = deafenedRef.current;
                
                // Ensure play is called to bypass some browser autoplay policies
                audioRefs.current[peerId].play().catch(() => window.dispatchEvent(new CustomEvent('voicePlaybackBlocked')));
            };

            pc.onconnectionstatechange = () => {
                if (['failed', 'closed'].includes(pc.connectionState)) {
                    pc.onconnectionstatechange = null;
                    if (audioRefs.current[peerId]) {
                        audioRefs.current[peerId].pause();
                        audioRefs.current[peerId].srcObject = null;
                        if (audioRefs.current[peerId].parentNode) {
                            audioRefs.current[peerId].parentNode.removeChild(audioRefs.current[peerId]);
                        }
                        delete audioRefs.current[peerId];
                    }
                    if (peersRef.current[peerId] === pc) delete peersRef.current[peerId];
                    delete dataChannelsRef.current[peerId];
                    delete pendingCandidates.current[peerId];
                    pc.close();
                }
            };

            return pc;
        }

        async function initiateCall(peerId) {
            try {
                if (!isMounted || !participantsRef.current.includes(peerId)) return;
                const pc = createPeerConnection(peerId);
                // Only initiate if we're in a clean state — prevents duplicate offers
                // that put the connection into "have-local-offer" and break later answers.
                if (pc.signalingState !== 'stable') {
                    console.warn('[WebRTC] Skipping initiateCall — state:', pc.signalingState);
                    return;
                }
                const offer = await pc.createOffer();
                if (!isMounted || pc.signalingState !== 'stable' || peersRef.current[peerId] !== pc) return; // re-check after async createOffer
                await pc.setLocalDescription(offer);

                await base44.entities.VoiceSignal.create({
                    channel_id: roomId,
                    sender_id: user.id,
                    target_id: peerId,
                    type: 'offer',
                    payload: { sdp: offer.sdp, type: offer.type }
                });
            } catch (err) {
                console.error("Error initiating call", err);
            }
        }

        initiateCallRef.current = initiateCall;

        async function handleSignal(signal) {
            const peerId = signal.sender_id;
            try {
                if (signal.type === 'offer') {
                    const pc = createPeerConnection(peerId);
                    // Only accept an offer when the connection can receive one.
                    // Valid states: 'stable' (fresh) or 'have-local-offer' (glare → rollback).
                    if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
                        console.warn('[WebRTC] Skipping offer — bad signalingState:', pc.signalingState);
                        return;
                    }
                    // Glare handling: if we already sent an offer, rollback before accepting theirs.
                    if (pc.signalingState === 'have-local-offer') {
                        await pc.setLocalDescription({ type: 'rollback' });
                    }
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                    const answer = await pc.createAnswer();
                    // After createAnswer, state should be 'have-remote-offer'. Guard against races.
                    if (pc.signalingState !== 'have-remote-offer') {
                        console.warn('[WebRTC] Skipping setLocalDescription(answer) — state:', pc.signalingState);
                        return;
                    }
                    await pc.setLocalDescription(answer);

                    await base44.entities.VoiceSignal.create({
                        channel_id: roomId,
                        sender_id: user.id,
                        target_id: peerId,
                        type: 'answer',
                        payload: { sdp: answer.sdp, type: answer.type }
                    });

                    if (pendingCandidates.current[peerId]) {
                        for (const c of pendingCandidates.current[peerId]) {
                            await pc.addIceCandidate(c);
                        }
                        pendingCandidates.current[peerId] = [];
                    }
                } else if (signal.type === 'answer') {
                    const pc = peersRef.current[peerId];
                    // Only apply answer if we're waiting for one. Avoids "Called in wrong state: stable".
                    if (pc && pc.signalingState === 'have-local-offer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                        if (pendingCandidates.current[peerId]) {
                            for (const c of pendingCandidates.current[peerId]) {
                                await pc.addIceCandidate(c);
                            }
                            pendingCandidates.current[peerId] = [];
                        }
                    } else if (pc) {
                        console.warn('[WebRTC] Skipping answer — state:', pc.signalingState);
                    }
                } else if ((signal.type === 'ice' || signal.type === 'ice-candidate')) {
                    let pc = peersRef.current[peerId];
                    if (!pc) {
                        pc = createPeerConnection(peerId);
                    }
                    if (pc.remoteDescription) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
                    } else {
                        if (!pendingCandidates.current[peerId]) pendingCandidates.current[peerId] = [];
                        pendingCandidates.current[peerId].push(new RTCIceCandidate(signal.payload));
                    }
                }
            } catch (err) {
                console.error("Error handling signal", err);
            }
        }
    }, [roomId, user?.id, dataEnabled]);

    // Acquire microphone only after the user enables it; data/presence never waits for permission.
    useEffect(() => {
        let cancelled = false;
        const enable = async () => {
          try {
            if (!roomId || isMuted) {
              localStreamRef.current?.getAudioTracks().forEach(t => {t.enabled=false;});
              return;
            }
            if (!localStreamRef.current) {
              const stream = await navigator.mediaDevices.getUserMedia({audio:true,video:false});
              if(cancelled){stream.getTracks().forEach(t=>t.stop());return;}
              localStreamRef.current=stream;
              await Promise.all(Object.values(peersRef.current).map(pc=>pc.getTransceivers().find(t=>t.receiver.track.kind==='audio')?.sender.replaceTrack(stream.getAudioTracks()[0])));
            }
            localStreamRef.current?.getAudioTracks().forEach(t=>{t.enabled=!mutedRef.current;});
            window.dispatchEvent(new CustomEvent('dashboardVoiceReady',{detail:{roomId}}));
          }catch(error){
            if(!cancelled)window.dispatchEvent(new CustomEvent('webrtcPermissionDenied',{detail:{message:error.message}}));
          }
        };
        enable();
        const resume = () => Object.values(audioRefs.current).forEach(a=>a.play().catch(()=>{}));
        window.addEventListener('pointerdown',resume);
        return()=>{cancelled=true;window.removeEventListener('pointerdown',resume);};
    }, [isMuted,roomId,user?.id]);

    // Handle deafen toggling
    useEffect(() => {
        Object.values(audioRefs.current).forEach(audio => {
            audio.muted = isDeafened;
        });
    }, [isDeafened]);

    // Handle newly joined participants
    useEffect(() => {
        if (!roomId || !user) return;
        Object.keys(peersRef.current).filter(id=>!participantIds.includes(id)).forEach(id=>{
          const pc=peersRef.current[id]; delete peersRef.current[id]; pc.close();
        });
        participantIds.forEach(pid => {
            if (pid !== user.id && !peersRef.current[pid]) {
                // To avoid race conditions, only one side initiates the call.
                // We can arbitrarily choose the one with the larger ID to initiate.
                if (user.id > pid && initiateCallRef.current) {
                    initiateCallRef.current(pid);
                }
            }
        });
    }, [participantIds, roomId, user?.id]);
}