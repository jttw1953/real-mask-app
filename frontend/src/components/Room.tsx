// Room.tsx - Complete with Improved Face Overlay Coverage

import { useEffect, useState, useRef } from "react";
import { io, Socket } from 'socket.io-client';
import { FaceMesh, type Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';
import PageBackground from "./PageBackground";
import { Mic, MicOff, Video, VideoOff, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Overlay } from '../types/overlayType';
import { DEFAULT_OVERLAY } from '../types/overlayType';
import OverlaySelector from './OverlaySelector';

const URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

export const Room = ({
    name,
    localAudioTrack,
    localVideoTrack,
    meetingId,
    userOverlays,
}: {
    name: string,
    localAudioTrack: MediaStreamTrack,
    localVideoTrack: MediaStreamTrack,
    meetingId: string,
    userOverlays: Overlay[],
}) => {
    const [lobby, setLobby] = useState(true);
    const [socket, setSocket] = useState<null | Socket>(null);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);
    const [connected, setConnected] = useState(false);
    const [remoteLandmarks, setRemoteLandmarks] = useState<any>(null);
    const [_faceMeshReady, setFaceMeshReady] = useState(false);
    const [localOverlayEnabled, setLocalOverlayEnabled] = useState(true);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [showOverlayMenu, setShowOverlayMenu] = useState(false);

    // Overlay management state
    const [availableOverlays, setAvailableOverlays] = useState<Overlay[]>([DEFAULT_OVERLAY]);
    const [selectedOverlayUrl, setSelectedOverlayUrl] = useState<string>(DEFAULT_OVERLAY.url);
    const [showOverlaySelector, setShowOverlaySelector] = useState(false);
    
    // Opacity state
    const [localOverlayOpacity, setLocalOverlayOpacity] = useState<number>(0.7);
    const [remoteOverlayOpacity, setRemoteOverlayOpacity] = useState<number>(0.7);
    
    // Remote user's overlay state
    const [remoteOverlayUrl, setRemoteOverlayUrl] = useState<string>(DEFAULT_OVERLAY.url);

    // Video element refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localCanvasRef = useRef<HTMLCanvasElement>(null);
    const remoteCanvasRef = useRef<HTMLCanvasElement>(null);
    
    // WebRTC refs
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    
    // MediaPipe refs
    const faceMeshRef = useRef<FaceMesh | null>(null);
    const cameraRef = useRef<Camera | null>(null);
    const overlayImageRef = useRef<HTMLImageElement | null>(null);
    const remoteOverlayImageRef = useRef<HTMLImageElement | null>(null);
    const localOverlayEnabledRef = useRef<boolean>(true);
    const videoEnabledRef = useRef<boolean>(true);
    const selectedOverlayUrlRef = useRef<string>(DEFAULT_OVERLAY.url);
    const localOverlayOpacityRef = useRef<number>(0.7);
    const remoteOverlayOpacityRef = useRef<number>(0.7);

    const navigate = useNavigate();

    // Load available overlays based on userOverlays prop
    useEffect(() => {
        console.log('📦 User overlays count:', userOverlays.length);
        
        if (userOverlays.length > 0) {
            const combined = [DEFAULT_OVERLAY, ...userOverlays];
            setAvailableOverlays(combined);
            console.log('✅ Total available overlays:', combined.length);
        } else {
            console.log('👤 Using default overlay only');
            setAvailableOverlays([DEFAULT_OVERLAY]);
        }
    }, [userOverlays]);

    // Keep refs in sync with state for socket emissions
    useEffect(() => {
        selectedOverlayUrlRef.current = selectedOverlayUrl;
    }, [selectedOverlayUrl]);

    useEffect(() => {
        localOverlayOpacityRef.current = localOverlayOpacity;
    }, [localOverlayOpacity]);

    useEffect(() => {
        remoteOverlayOpacityRef.current = remoteOverlayOpacity;
    }, [remoteOverlayOpacity]);

    // Socket connection and event handlers
    useEffect(() => {
        const socket = io(URL, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        socket.on('connect', () => {
            console.log('✅ Connected to server');
            console.log('🔗 Joining meeting:', meetingId);
            socket.emit("join-meeting", { meetingId, name });
        });

        socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
        });

        socket.on('connect_error', (error: Error) => {
            console.error('❌ Connection error:', error);
        });
        
        socket.on('waiting', () => {
            console.log('⏳ Waiting for partner...');
            setLobby(true);
        });

        socket.on('error', ({ message }: { message: string }) => {
            console.error('❌ Server error:', message);
            setError(message);
        });
        
        socket.on('partner-connected', ({ meetingId: connectedMeetingId }) => {
            console.log('✅ Partner connected to meeting:', connectedMeetingId);
            setLobby(false);
            setConnected(true);
        });

        socket.on('user-disconnected', () => {
            console.log('👋 Other user disconnected');
            alert('The other participant has left the meeting');
            setLobby(true);
            setConnected(false);
            
            if (pcRef.current) {
                pcRef.current.close();
                pcRef.current = null;
            }
        });

        // Receive overlay data with opacity
        socket.on('overlay-data', ({ landmarks, overlayUrl, opacity }: { 
            landmarks: any, 
            overlayUrl: string | null, 
            opacity: number | null 
        }) => {
            console.log('📥 Received overlay-data:', { 
                hasLandmarks: !!landmarks, 
                overlayUrl, 
                opacity,
                opacityType: typeof opacity,
                fullData: { landmarks: !!landmarks, overlayUrl, opacity }
            });
            
            if (landmarks === null) {
                // Remote user disabled overlay
                if (remoteCanvasRef.current) {
                    const ctx = remoteCanvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, remoteCanvasRef.current.width, remoteCanvasRef.current.height);
                    }
                }
                setRemoteLandmarks(null);
            } else {
                // Remote user has overlay enabled
                
                // Update remote overlay URL if it changed
                if (overlayUrl && overlayUrl !== remoteOverlayUrl) {
                    console.log('🎭 Remote user switched overlay to:', overlayUrl);
                    setRemoteOverlayUrl(overlayUrl);
                }

                // Update remote opacity ref immediately for instant drawing
                if (opacity !== null) {
                    console.log('🎨 Updating remote opacity to:', opacity);
                    remoteOverlayOpacityRef.current = opacity;
                    setRemoteOverlayOpacity(opacity);
                }
                
                // Draw immediately with the new opacity
                if (remoteCanvasRef.current && remoteOverlayImageRef.current) {
                    drawFaceOverlay(
                        remoteCanvasRef.current,
                        landmarks,
                        remoteOverlayImageRef.current,
                        opacity !== null ? opacity : remoteOverlayOpacityRef.current
                    );
                }
                
                // Update landmarks to trigger effect (but we've already drawn)
                setRemoteLandmarks(landmarks);
            }
        });

        setSocket(socket);
        
        return () => {
            console.log('🔌 Disconnecting socket');
            if (pcRef.current) {
                pcRef.current.close();
            }
            socket.disconnect();
        };
    }, [meetingId, name]);

    // Load local overlay image
    useEffect(() => {
        console.log('🔄 Loading local overlay:', selectedOverlayUrl);
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = selectedOverlayUrl;
        
        img.onload = () => {
            overlayImageRef.current = img;
            console.log('✅ Local overlay image loaded:', selectedOverlayUrl);
        };
        
        img.onerror = (e) => {
            console.error('❌ Failed to load local overlay image:', selectedOverlayUrl);
            console.error('Error details:', e);
            if (selectedOverlayUrl !== DEFAULT_OVERLAY.url) {
                console.log('⚠️ Falling back to default overlay');
                setSelectedOverlayUrl(DEFAULT_OVERLAY.url);
            }
        };
    }, [selectedOverlayUrl]);

    // Load remote overlay image
    useEffect(() => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = remoteOverlayUrl;
        img.onload = () => {
            remoteOverlayImageRef.current = img;
            console.log('✅ Remote overlay image loaded:', remoteOverlayUrl);
        };
        img.onerror = () => {
            console.error('❌ Failed to load remote overlay image:', remoteOverlayUrl);
        };
    }, [remoteOverlayUrl]);

    useEffect(() => {
        localOverlayEnabledRef.current = localOverlayEnabled;
    }, [localOverlayEnabled]);

    useEffect(() => {
        videoEnabledRef.current = videoEnabled;
    }, [videoEnabled]);

    useEffect(() => {
        if (lobby || !localVideoRef.current || !localVideoTrack) {
            return;
        }

        const stream = new MediaStream([localVideoTrack, localAudioTrack]);
        localStreamRef.current = stream;
        localVideoRef.current.srcObject = stream;
        
        console.log('🎬 Local video setup complete');
    }, [localVideoTrack, localAudioTrack, lobby]);

    // MediaPipe Face Mesh initialization
    useEffect(() => {
        if (lobby || !localVideoRef.current) {
            return;
        }

        console.log('🎭 Initializing MediaPipe Face Mesh...');

        const faceMesh = new FaceMesh({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
            }
        });

        faceMesh.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results: Results) => {
            if (!videoEnabledRef.current) {
                if (localCanvasRef.current) {
                    const ctx = localCanvasRef.current.getContext('2d');
                    if (ctx) {
                        ctx.clearRect(0, 0, localCanvasRef.current.width, localCanvasRef.current.height);
                    }
                }
                return;
            }
            
            if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
                const landmarks = results.multiFaceLandmarks[0];
                
                if (localOverlayEnabledRef.current && videoEnabledRef.current) {
                    if (socket) {
                        const opacityToSend = localOverlayOpacityRef.current;
                        
                        // Send overlay data with opacity
                        socket.emit('overlay-data', {
                            meetingId,
                            landmarks: landmarks,
                            overlayUrl: selectedOverlayUrlRef.current,
                            opacity: opacityToSend
                        });
                    }

                    drawFaceOverlay(
                        localCanvasRef.current, 
                        landmarks, 
                        overlayImageRef.current,
                        localOverlayOpacityRef.current
                    );
                } else if (!localOverlayEnabledRef.current || !videoEnabledRef.current) {
                    if (socket) {
                        socket.emit('overlay-data', {
                            meetingId,
                            landmarks: null,
                            overlayUrl: null,
                            opacity: null
                        });
                    }
                    
                    if (localCanvasRef.current) {
                        const ctx = localCanvasRef.current.getContext('2d');
                        if (ctx) {
                            ctx.clearRect(0, 0, localCanvasRef.current.width, localCanvasRef.current.height);
                        }
                    }
                }
            }
        });

        faceMeshRef.current = faceMesh;

        if (localVideoRef.current) {
            const camera = new Camera(localVideoRef.current, {
                onFrame: async () => {
                    if (localVideoRef.current && faceMeshRef.current && videoEnabledRef.current) {
                        await faceMeshRef.current.send({ image: localVideoRef.current });
                    }
                },
                width: 640,
                height: 480
            });

            camera.start();
            cameraRef.current = camera;
            setFaceMeshReady(true);
            console.log('✅ MediaPipe Face Mesh initialized');
        }

        return () => {
            console.log('🧹 Cleaning up MediaPipe');
            if (cameraRef.current) {
                cameraRef.current.stop();
            }
        };
    }, [lobby, socket, meetingId]);

    // Draw remote overlay with remote opacity
    useEffect(() => {
        if (remoteLandmarks && remoteCanvasRef.current) {
            console.log('🎨 Drawing remote overlay with opacity:', remoteOverlayOpacity);
            drawFaceOverlay(
                remoteCanvasRef.current, 
                remoteLandmarks, 
                remoteOverlayImageRef.current,
                remoteOverlayOpacity
            );
        } else if (!remoteLandmarks && remoteCanvasRef.current) {
            const ctx = remoteCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, remoteCanvasRef.current.width, remoteCanvasRef.current.height);
            }
        }
    }, [remoteLandmarks, remoteOverlayUrl, remoteOverlayOpacity]);

    useEffect(() => {
        if (!localOverlayEnabled && localCanvasRef.current) {
            const ctx = localCanvasRef.current.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, localCanvasRef.current.width, localCanvasRef.current.height);
            }
            
            if (socket) {
                socket.emit('overlay-data', {
                    meetingId,
                    landmarks: null,
                    overlayUrl: null,
                    opacity: null
                });
            }
        }
    }, [localOverlayEnabled, socket, meetingId]);

    useEffect(() => {
        if (!videoEnabled) {
            if (localCanvasRef.current) {
                const ctx = localCanvasRef.current.getContext('2d');
                if (ctx) {
                    ctx.clearRect(0, 0, localCanvasRef.current.width, localCanvasRef.current.height);
                }
            }
            
            if (socket) {
                socket.emit('overlay-data', {
                    meetingId,
                    landmarks: null,
                    overlayUrl: null,
                    opacity: null
                });
            }
        }
    }, [videoEnabled, socket, meetingId]);

    // WebRTC setup and signaling handlers
    useEffect(() => {
        if (!connected || !socket) {
            return;
        }

        console.log('🔧 Setting up WebRTC connection...');

        const pc = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { 
                    urls: 'turn:openrelay.metered.ca:80',
                    username: 'openrelayproject',
                    credential: 'openrelayproject',
                },
                { 
                    urls: 'turn:openrelay.metered.ca:443',
                    username: 'openrelayproject',
                    credential: 'openrelayproject',
                },
            ],
            iceCandidatePoolSize: 10,
        });
        pcRef.current = pc;

        pc.ontrack = (event) => {
            console.log('📥 Received remote track:', event.track.kind);
            
            if (remoteVideoRef.current) {
                const remoteStream = event.streams[0];
                remoteVideoRef.current.srcObject = remoteStream;
                console.log('✅ Remote stream set to video element');
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 Sending ICE candidate');
                socket.emit('ice-candidate', {
                    roomId: meetingId,
                    candidate: event.candidate,
                    type: 'sender'
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('🔄 Connection state:', pc.connectionState);
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        const handleSendOffer = async ({ roomId }: { roomId: string }) => {
            console.log('📤 Creating offer for room:', roomId);
            
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    console.log('➕ Adding track to peer connection:', track.kind);
                    pc.addTrack(track, localStreamRef.current!);
                });
            }
            
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                console.log('📨 Sending offer to server');
                socket.emit('offer', {
                    roomId,
                    sdp: offer.sdp
                });
            } catch (err) {
                console.error('❌ Error creating offer:', err);
            }
        };

        const handleOffer = async ({ sdp, roomId }: { sdp: string, roomId: string }) => {
            console.log('📥 Received offer from server');
            
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => {
                    console.log('➕ Adding track to peer connection:', track.kind);
                    pc.addTrack(track, localStreamRef.current!);
                });
            }
            
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp }));
                
                console.log('📤 Creating answer');
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                
                console.log('📨 Sending answer to server');
                socket.emit('answer', {
                    roomId,
                    sdp: answer.sdp
                });
            } catch (err) {
                console.error('❌ Error handling offer:', err);
            }
        };

        const handleAnswer = async ({ sdp }: { sdp: string }) => {
            console.log('📥 Received answer from server');
            
            try {
                await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp }));
                console.log('✅ Remote description set');
            } catch (err) {
                console.error('❌ Error setting remote description:', err);
            }
        };

        const handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
            console.log('🧊 Received ICE candidate from server');
            
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
                console.log('✅ ICE candidate added');
            } catch (err) {
                console.error('❌ Error adding ICE candidate:', err);
            }
        };

        socket.on('send-offer', handleSendOffer);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('add-ice-candidate', handleIceCandidate);

        return () => {
            console.log('🧹 Cleaning up WebRTC connection');
            
            socket.off('send-offer', handleSendOffer);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('add-ice-candidate', handleIceCandidate);
            
            if (pc) {
                pc.close();
            }
        };
    }, [connected, socket, meetingId]);

    // IMPROVED: Draw face overlay that follows actual face contour
    const drawFaceOverlay = (
        canvas: HTMLCanvasElement | null, 
        landmarks: any,
        overlayImage: HTMLImageElement | null,
        opacity: number
    ) => {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!overlayImage) return;

        // Create a path that follows the face contour
        ctx.save();
        
        // Set opacity
        ctx.globalAlpha = opacity;
        
        // Begin creating face-shaped clipping path
        ctx.beginPath();
        
        // Face contour landmarks (from left ear, around jawline, to right ear)
        // These landmarks trace the actual outline of the face
        const faceOvalIndices = [
            10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
            397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
            172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109
        ];
        
        // Start the path at the first point
        const firstPoint = landmarks[faceOvalIndices[0]];
        ctx.moveTo(firstPoint.x * canvas.width, firstPoint.y * canvas.height);
        
        // Draw lines to each subsequent point to create face outline
        for (let i = 1; i < faceOvalIndices.length; i++) {
            const point = landmarks[faceOvalIndices[i]];
            ctx.lineTo(point.x * canvas.width, point.y * canvas.height);
        }
        
        // Close the path
        ctx.closePath();
        
        // Use this path as a clipping region
        ctx.clip();
        
        // Now calculate bounds for the overlay within this clipped region
        const foreheadTop = landmarks[10];
        const chinBottom = landmarks[152];
        const leftCheek = landmarks[234];
        const rightCheek = landmarks[454];
        
        const faceWidth = Math.abs((rightCheek.x - leftCheek.x) * canvas.width);
        const faceHeight = Math.abs((chinBottom.y - foreheadTop.y) * canvas.height);
        
        const centerX = ((leftCheek.x + rightCheek.x) / 2) * canvas.width;
        const centerY = ((foreheadTop.y + chinBottom.y) / 2) * canvas.height;
        
        // Size the overlay to cover the clipped face area
        const overlayWidth = faceWidth * 1.5;
        const overlayHeight = faceHeight * 1.6;
        
        const verticalOffset = faceHeight * 0.05;
        
        // Draw the overlay image (will only show within the face-shaped clip)
        ctx.drawImage(
            overlayImage,
            centerX - overlayWidth / 2,
            centerY - overlayHeight / 2 - verticalOffset,
            overlayWidth,
            overlayHeight
        );
        
        // Restore context to remove clipping
        ctx.restore();
    };

    const copyMeetingLink = () => {
        const meetingUrl = window.location.href;
        navigator.clipboard.writeText(meetingUrl)
            .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            })
            .catch((err) => {
                console.error('Failed to copy:', err);
            });
    };

    const toggleAudio = () => {
        if (localAudioTrack) {
            localAudioTrack.enabled = !audioEnabled;
            setAudioEnabled(!audioEnabled);
            console.log('🎤 Audio:', !audioEnabled ? 'ON' : 'OFF');
        }
    };
    
    const toggleVideo = () => {
        if (localVideoTrack) {
            localVideoTrack.enabled = !videoEnabled;
            setVideoEnabled(!videoEnabled);
            console.log('🎹 Video:', !videoEnabled ? 'ON' : 'OFF');
        }
    };

    const handleOverlaySelect = (overlay: Overlay) => {
        console.log('🎭 Switching to overlay:', overlay.title);
        setSelectedOverlayUrl(overlay.url);
        setShowOverlaySelector(false);
    };

    const handleOpacityChange = (newOpacity: number) => {
        setLocalOverlayOpacity(newOpacity);
        console.log('🎨 Opacity changed to:', newOpacity);
    };

    if (error) {
        return (
            <PageBackground>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
                        <p className="text-red-600">{error}</p>
                    </div>
                </div>
            </PageBackground>
        );
    }

    if (lobby) {
        return (
            <PageBackground>
                <div className="h-screen flex items-center justify-center overflow-hidden">
                    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 max-w-md w-full">
                        <h2 className="text-2xl font-semibold text-white mb-4">Waiting for other participant...</h2>
                        <div className="space-y-3 text-slate-300">
                            <p><span className="font-medium">Your name:</span> {name}</p>
                            <p><span className="font-medium">Meeting ID:</span> {meetingId}</p>
                            <p className="text-sm text-slate-400">Share this link with the person you want to meet</p>
                        </div>
                        <button 
                            onClick={copyMeetingLink}
                            className={`mt-6 w-full py-3 rounded-lg font-medium transition-colors ${
                                copied 
                                    ? 'bg-green-600 hover:bg-green-700' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                            } text-white`}
                        >
                            {copied ? '✓ Copied!' : 'Copy Meeting Link'}
                        </button>
                    </div>
                </div>
            </PageBackground>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-black">
            <div className="flex-1 relative overflow-hidden">
                <div className="w-full h-full relative">
                    <video 
                        ref={remoteVideoRef}
                        autoPlay
                        playsInline
                        className="w-full h-full object-contain"
                    />
                    <canvas
                        ref={remoteCanvasRef}
                        width={640}
                        height={480}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ width: 'auto', height: '100%', maxWidth: '100%' }}
                    />
                    
                    <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded">
                        <p className="text-white text-sm font-medium">Guest User</p>
                    </div>
                </div>

                <div className="absolute bottom-16 right-4 z-10">
                    <div className="relative w-56 h-40 bg-black rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl">
                        <video 
                            ref={localVideoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas
                            ref={localCanvasRef}
                            width={640}
                            height={480}
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                        />
                        {!videoEnabled && (
                            <div className="absolute top-0 left-0 w-full h-full bg-gray-900 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-1">
                                        <User size={24} className="text-gray-400" />
                                    </div>
                                    <p className="text-white text-xs">{name}</p>
                                </div>
                            </div>
                        )}
                        <div className="absolute bottom-1 left-1 bg-black/70 px-2 py-0.5 rounded">
                            <p className="text-white text-[10px] font-medium">You</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border-t border-gray-800 px-4 py-2 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center min-w-[150px]">
                        <p className="text-white text-xs font-medium">ID: {meetingId.slice(0, 8)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleAudio}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${
                                audioEnabled 
                                    ? 'bg-gray-700 hover:bg-gray-600' 
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {audioEnabled ? (
                                <Mic size={16} className="text-white" />
                            ) : (
                                <MicOff size={16} className="text-white" />
                            )}
                            <span className="text-white text-[9px] mt-0.5">
                                {audioEnabled ? 'Mute' : 'Unmute'}
                            </span>
                        </button>

                        <button
                            onClick={toggleVideo}
                            className={`flex flex-col items-center justify-center w-12 h-12 rounded-lg transition-all ${
                                videoEnabled 
                                    ? 'bg-gray-700 hover:bg-gray-600' 
                                    : 'bg-red-600 hover:bg-red-700'
                            }`}
                        >
                            {videoEnabled ? (
                                <Video size={16} className="text-white" />
                            ) : (
                                <VideoOff size={16} className="text-white" />
                            )}
                            <span className="text-white text-[9px] mt-0.5">
                                {videoEnabled ? 'Stop' : 'Start'}
                            </span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setShowOverlayMenu(!showOverlayMenu)}
                                className="flex flex-col items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                            >
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                <span className="text-white text-[9px] mt-0.5">Overlay</span>
                            </button>

                            {showOverlayMenu && (
                                <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl py-2 min-w-[200px]">
                                    <button
                                        onClick={() => {
                                            setLocalOverlayEnabled(!localOverlayEnabled);
                                            setShowOverlayMenu(false);
                                        }}
                                        className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 transition-colors flex items-center justify-between"
                                    >
                                        <span className="text-xs">
                                            {localOverlayEnabled ? 'Disable' : 'Enable'}
                                        </span>
                                        {localOverlayEnabled && (
                                            <span className="text-green-400 text-xs">✓</span>
                                        )}
                                    </button>
                                    
                                    {localOverlayEnabled && (
                                        <div className="px-3 py-2 border-t border-gray-700">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-xs text-white">Opacity</span>
                                                <span className="text-xs text-gray-400">
                                                    {Math.round(localOverlayOpacity * 100)}%
                                                </span>
                                            </div>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={localOverlayOpacity * 100}
                                                onChange={(e) => handleOpacityChange(Number(e.target.value) / 100)}
                                                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                                style={{
                                                    background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${localOverlayOpacity * 100}%, #374151 ${localOverlayOpacity * 100}%, #374151 100%)`
                                                }}
                                            />
                                        </div>
                                    )}
                                    
                                    {availableOverlays.length > 1 && (
                                        <button
                                            onClick={() => {
                                                setShowOverlaySelector(true);
                                                setShowOverlayMenu(false);
                                            }}
                                            className="w-full px-3 py-2 text-left text-white hover:bg-gray-700 transition-colors border-t border-gray-700"
                                        >
                                            <span className="text-xs">Change Overlay</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        <button className="flex flex-col items-center justify-center w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <span className="text-white text-[9px] mt-0.5">Share</span>
                        </button>

                        <button 
                            onClick={() => navigate('/landing')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-all ml-1"
                        >
                            <span className="text-white text-xs font-medium">Leave</span>
                        </button>
                    </div>

                    <div className="flex items-center min-w-[150px] justify-end">
                        <button 
                            onClick={copyMeetingLink}
                            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-all"
                        >
                            <span className="text-white text-xs">
                                {copied ? '✓ Copied' : 'Copy Link'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <OverlaySelector
                overlays={availableOverlays}
                currentSelected={selectedOverlayUrl}
                onSelect={handleOverlaySelect}
                isOpen={showOverlaySelector}
                onClose={() => setShowOverlaySelector(false)}
            />
        </div>
    );
};