// Landing.tsx
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import PageBackground from '../components/PageBackground';
import { Video, Plus, LogIn, Users, Shield, Zap } from 'lucide-react';

export const Landing = () => {
    const navigate = useNavigate();
    const [meetingId, setMeetingId] = useState('');
    const [showJoinInput, setShowJoinInput] = useState(false);

    const createMeeting = () => {
        // Generate meeting ID here
        const newMeetingId = Math.random().toString(36).substring(2, 15);
        
        // Navigate to the meeting page with this ID
        navigate(`/meet/${newMeetingId}`);
    };

    const joinMeeting = () => {
        if (meetingId.trim()) {
            navigate(`/meet/${meetingId.trim()}`);
        }
    };

    const handleJoinKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && meetingId.trim()) {
            joinMeeting();
        }
    };

    return (
        <PageBackground>
            <div className="min-h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
                {/* Hero Section */}
                <div className="max-w-6xl w-full text-center mb-16">
                    {/* Logo/Brand */}
                    <div className="flex items-center justify-center gap-3 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                            <Video size={32} className="text-white" />
                        </div>
                        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            VideoMeet
                        </h1>
                    </div>

                    {/* Tagline */}
                    <p className="text-2xl text-slate-300 mb-4">
                        Connect with anyone, anywhere
                    </p>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        High-quality video calls with fun AR overlays. No downloads, no hassle.
                    </p>
                </div>

                {/* Main Action Cards */}
                <div className="max-w-4xl w-full grid md:grid-cols-2 gap-6 mb-12">
                    {/* Create Meeting Card */}
                    <div className="bg-slate-800/90 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/50 transition-all shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center">
                                <Plus size={24} className="text-blue-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">New Meeting</h2>
                        </div>
                        <p className="text-slate-400 mb-6">
                            Start an instant meeting and invite others to join
                        </p>
                        <button
                            onClick={createMeeting}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        >
                            Create Meeting
                        </button>
                    </div>

                    {/* Join Meeting Card */}
                    <div className="bg-slate-800/90 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/50 transition-all shadow-xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-purple-600/20 rounded-xl flex items-center justify-center">
                                <LogIn size={24} className="text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Join Meeting</h2>
                        </div>
                        <p className="text-slate-400 mb-6">
                            Enter a meeting code to join an existing call
                        </p>
                        
                        {!showJoinInput ? (
                            <button
                                onClick={() => setShowJoinInput(true)}
                                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-all"
                            >
                                Enter Code
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Enter meeting code"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    onKeyPress={handleJoinKeyPress}
                                    className="w-full px-4 py-3 bg-slate-700/50 border-2 border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setShowJoinInput(false);
                                            setMeetingId('');
                                        }}
                                        className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={joinMeeting}
                                        disabled={!meetingId.trim()}
                                        className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all"
                                    >
                                        Join
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Features Section */}
                <div className="max-w-4xl w-full">
                    <h3 className="text-2xl font-bold text-white text-center mb-8">Why Choose Us?</h3>
                    <div className="grid md:grid-cols-3 gap-6">
                        {/* Feature 1 */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center">
                            <div className="w-14 h-14 bg-blue-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Zap size={28} className="text-blue-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-2">Instant Start</h4>
                            <p className="text-slate-400 text-sm">
                                No sign-up required. Create or join meetings in seconds
                            </p>
                        </div>

                        {/* Feature 2 */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center">
                            <div className="w-14 h-14 bg-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Users size={28} className="text-purple-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-2">AR Overlays</h4>
                            <p className="text-slate-400 text-sm">
                                Fun face filters and overlays to enhance your calls
                            </p>
                        </div>

                        {/* Feature 3 */}
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 text-center">
                            <div className="w-14 h-14 bg-pink-600/20 rounded-xl flex items-center justify-center mx-auto mb-4">
                                <Shield size={28} className="text-pink-400" />
                            </div>
                            <h4 className="text-white font-semibold mb-2">Secure & Private</h4>
                            <p className="text-slate-400 text-sm">
                                End-to-end encrypted connections for your privacy
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center">
                    <p className="text-slate-500 text-sm">
                        Built with ❤️ for seamless video communication
                    </p>
                </div>
            </div>
        </PageBackground>
    );
};