// MeetingPage.tsx - Complete Fixed Version
import { useParams } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { Room } from '../components/Room';
import PageBackground from '../components/PageBackground';
import { Video, VideoOff, Mic, MicOff, User } from 'lucide-react';
import { supabase } from '../components/supabaseAuth';
import { useAppData } from '../components/useAppData';
import type { Overlay } from '../types/overlayType';

export const MeetingPage = () => {
    const { meetingId } = useParams<{ meetingId: string }>();
    const [name, setName] = useState('');
    const [joined, setJoined] = useState(false);
    const [localAudioTrack, setLocalAudioTrack] = useState<MediaStreamTrack | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<MediaStreamTrack | null>(null);
    const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userOverlays, setUserOverlays] = useState<Overlay[]>([]);
    
    const videoRef = useRef<HTMLVideoElement>(null);

    // Call useAppData at the top level
    const appData = useAppData();

    // Check authentication status on mount
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const authenticated = !!session;
            setIsAuthenticated(authenticated);
            
            console.log('🔐 MeetingPage - Authentication status:', authenticated);
            
            if (authenticated) {
                console.log('📋 Overlay data from appData:', appData.overlays);
                setUserOverlays(appData.overlays || []);
                console.log('✅ Fetched user overlays:', appData.overlays?.length || 0);
            } else {
                console.log('👤 Guest user - no overlays to load');
                setUserOverlays([]);
            }
        };
        
        checkAuth();
    }, [appData.overlays]);

    useEffect(() => {
        if (videoRef.current && previewStream) {
            if (videoEnabled) {
                videoRef.current.srcObject = previewStream;
            }
        }
    }, [videoEnabled, previewStream]);

    useEffect(() => {
        initializePreview();
        
        return () => {
            if (previewStream) {
                previewStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const initializePreview = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            setPreviewStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error('Error accessing media devices:', error);
        }
    };

    const toggleAudio = () => {
        if (previewStream) {
            const audioTrack = previewStream.getAudioTracks()[0];
            if (audioTrack) {
                const newState = !audioEnabled;
                audioTrack.enabled = newState;
                setAudioEnabled(newState);
            }
        } else {
            setAudioEnabled(!audioEnabled);
        }
    };

    const toggleVideo = () => {
        if (previewStream) {
            const videoTrack = previewStream.getVideoTracks()[0];
            if (videoTrack) {
                const newState = !videoEnabled;
                videoTrack.enabled = newState;
                setVideoEnabled(newState);
            }
        } else {
            setVideoEnabled(!videoEnabled);
        }
    };

    const joinRoom = async () => {
        if (!name.trim()) {
            alert('Please enter your name');
            return;
        }

        setIsLoading(true);

        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                alert('Your browser does not support video/audio access. Please use a modern browser like Chrome, Firefox, or Edge.');
                setIsLoading(false);
                return;
            }

            let stream = previewStream;
            
            if (!stream) {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
            }
            
            const audioTrack = stream.getAudioTracks()[0];
            const videoTrack = stream.getVideoTracks()[0];
            
            if (audioTrack) audioTrack.enabled = audioEnabled;
            if (videoTrack) videoTrack.enabled = videoEnabled;
            
            setLocalAudioTrack(audioTrack || null);
            setLocalVideoTrack(videoTrack || null);
            setJoined(true);
        } catch (error) {
            console.error('Error accessing media devices:', error);
            alert('Failed to access camera/microphone. Please grant permissions and try again.');
            setIsLoading(false);
        }
    };

    if (!joined) {
        return (
            <PageBackground>
                <div className="h-screen flex items-center justify-center overflow-hidden p-4">
                    <div className="w-full max-w-4xl">
                        <div className="bg-slate-800/90 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl shadow-2xl overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
                                <h1 className="text-3xl font-bold text-white mb-2">Ready to join?</h1>
                                <p className="text-blue-100 text-sm">Meeting ID: <span className="font-mono font-semibold">{meetingId}</span></p>
                            </div>

                            <div className="p-8">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-white font-semibold text-lg mb-4">Camera Preview</h3>
                                        <div className="relative aspect-video bg-gray-900 rounded-2xl overflow-hidden border-2 border-slate-600 shadow-xl">
                                            {videoEnabled && previewStream ? (
                                                <video
                                                    ref={videoRef}
                                                    autoPlay
                                                    playsInline
                                                    muted
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                                                    <div className="text-center">
                                                        <div className="w-24 h-24 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                                                            <User size={48} className="text-slate-400" />
                                                        </div>
                                                        <p className="text-slate-400 text-sm">Camera is off</p>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-3">
                                                <button
                                                    onClick={toggleAudio}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                                                        audioEnabled
                                                            ? 'bg-slate-700 hover:bg-slate-600'
                                                            : 'bg-red-600 hover:bg-red-700'
                                                    }`}
                                                >
                                                    {audioEnabled ? (
                                                        <Mic size={20} className="text-white" />
                                                    ) : (
                                                        <MicOff size={20} className="text-white" />
                                                    )}
                                                </button>
                                                
                                                <button
                                                    onClick={toggleVideo}
                                                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg ${
                                                        videoEnabled
                                                            ? 'bg-slate-700 hover:bg-slate-600'
                                                            : 'bg-red-600 hover:bg-red-700'
                                                    }`}
                                                >
                                                    {videoEnabled ? (
                                                        <Video size={20} className="text-white" />
                                                    ) : (
                                                        <VideoOff size={20} className="text-white" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col justify-center space-y-6">
                                        <div>
                                            <label htmlFor="name" className="block text-white font-medium mb-3 text-lg">
                                                What's your name?
                                            </label>
                                            <input
                                                id="name"
                                                type="text"
                                                placeholder="Enter your name"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                onKeyPress={(e) => {
                                                    if (e.key === 'Enter' && name.trim()) {
                                                        joinRoom();
                                                    }
                                                }}
                                                className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                                disabled={isLoading}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <button
                                                onClick={joinRoom}
                                                disabled={isLoading || !name.trim()}
                                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg disabled:transform-none"
                                            >
                                                {isLoading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                        </svg>
                                                        Joining...
                                                    </span>
                                                ) : (
                                                    'Join Meeting'
                                                )}
                                            </button>

                                            <p className="text-slate-400 text-xs text-center">
                                                By joining, you agree to our terms of service
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-4 pt-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${audioEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-slate-300 text-sm">
                                                    {audioEnabled ? 'Mic On' : 'Mic Off'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${videoEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <span className="text-slate-300 text-sm">
                                                    {videoEnabled ? 'Camera On' : 'Camera Off'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </PageBackground>
        );
    }

    return (
        <Room
            name={name}
            localAudioTrack={localAudioTrack!}
            localVideoTrack={localVideoTrack!}
            meetingId={meetingId!}
            userOverlays={userOverlays}
        />
    );
};