import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

export function useWebRTCVoice(roomId, user, isMuted, isDeafened, participantIds = []) {
    const localStreamRef = useRef(null);
    const peersRef = useRef({});
    const audioRefs = useRef({});

    useEffect(() => {
        if (!roomId || !user) return;

        let isMounted = true;
        let unsubscribe = null;

        const initWebRTC = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
                if (!isMounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }
                
                localStreamRef.current = stream;
                stream.getAudioTracks().forEach(t => t.enabled = !isMuted);

                unsubscribe = base44.entities.VoiceSignal.subscribe((event) => {
                    if (event.type === 'create' || event.type === 'update') {
                        const signal = event.data;
                        // For faster signaling, you might skip checking channel_id if it's uniquely targeted
                        if (signal.channel_id === roomId && signal.target_id === user.id) {
                            handleSignal(signal);
                        }
                    }
                });

                // Initiate connection to existing participants
                participantIds.forEach(pid => {
                    if (pid !== user.id && !peersRef.current[pid]) {
                        initiateCall(pid);
                    }
                });

            } catch (err) {
                console.error("Failed to init WebRTC voice", err);
            }
        };

        initWebRTC();

        return () => {
            isMounted = false;
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
            });
            audioRefs.current = {};
        };

        function createPeerConnection(peerId) {
            if (peersRef.current[peerId]) return peersRef.current[peerId];

            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });
            peersRef.current[peerId] = pc;

            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    pc.addTrack(track, localStreamRef.current);
                });
            }

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    base44.entities.VoiceSignal.create({
                        channel_id: roomId,
                        sender_id: user.id,
                        target_id: peerId,
                        type: 'ice-candidate',
                        payload: event.candidate.toJSON()
                    }).catch(() => {});
                }
            };

            pc.ontrack = (event) => {
                if (!audioRefs.current[peerId]) {
                    const audio = new Audio();
                    audio.autoplay = true;
                    audioRefs.current[peerId] = audio;
                }
                audioRefs.current[peerId].srcObject = event.streams[0];
                audioRefs.current[peerId].muted = isDeafened;
            };

            pc.onconnectionstatechange = () => {
                if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                    if (audioRefs.current[peerId]) {
                        audioRefs.current[peerId].srcObject = null;
                        delete audioRefs.current[peerId];
                    }
                    delete peersRef.current[peerId];
                }
            };

            return pc;
        }

        async function initiateCall(peerId) {
            try {
                const pc = createPeerConnection(peerId);
                const offer = await pc.createOffer();
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

        async function handleSignal(signal) {
            const peerId = signal.sender_id;
            try {
                if (signal.type === 'offer') {
                    const pc = createPeerConnection(peerId);
                    await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    await base44.entities.VoiceSignal.create({
                        channel_id: roomId,
                        sender_id: user.id,
                        target_id: peerId,
                        type: 'answer',
                        payload: { sdp: answer.sdp, type: answer.type }
                    });
                } else if (signal.type === 'answer') {
                    const pc = peersRef.current[peerId];
                    if (pc) {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal.payload));
                    }
                } else if (signal.type === 'ice-candidate') {
                    const pc = peersRef.current[peerId];
                    if (pc) {
                        await pc.addIceCandidate(new RTCIceCandidate(signal.payload));
                    }
                }
            } catch (err) {
                console.error("Error handling signal", err);
            }
        }
    }, [roomId, user?.id]);

    // Handle mute toggling without re-initializing WebRTC
    useEffect(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = !isMuted);
        }
    }, [isMuted]);

    // Handle deafen toggling
    useEffect(() => {
        Object.values(audioRefs.current).forEach(audio => {
            audio.muted = isDeafened;
        });
    }, [isDeafened]);

    // Handle newly joined participants
    useEffect(() => {
        if (!roomId || !user) return;
        participantIds.forEach(pid => {
            if (pid !== user.id && !peersRef.current[pid]) {
                // someone new joined, wait for them to send an offer, or initiate call if we want
                // Actually, wait: we shouldn't both initiate. The one who joins should initiate.
                // Let's rely on the initWebRTC initiating call to EXISTING participants.
                // So newly joined participant will initiate call to US.
                // We don't strictly need to do anything here except maybe ensure they are registered.
            }
        });
    }, [participantIds, roomId, user?.id]);
}