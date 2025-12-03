import { Socket } from "socket.io";
import { roomManager } from "./roomManager.js";
import type { User } from "./user.js";
import Filter from "bad-words";

const profanityFilter = new Filter();

export class userManager {
    private users: User[];
    private roomManager: roomManager;
    private meetingRooms: Map<string, string[]>; // meetingId -> [socketId1, socketId2, ...]

    constructor() {
        this.users = [];
        this.roomManager = new roomManager();
        this.meetingRooms = new Map<string, string[]>();
    }

    addUser(name: string, socket: Socket) {
        this.users.push({ name, socket });
        this.initHandlers(socket);
        return;
    }

    initHandlers(socket: Socket) {
        socket.on("join-meeting", ({ meetingId, name }: { meetingId: string, name: string }) => {
            this.handleJoinMeeting(socket, meetingId, name);
        });

        // WebRTC signaling handlers
        socket.on("offer", ({ roomId, sdp }: { roomId: string, sdp: string }) => {
            console.log('📨 Received offer from client:', socket.id);
            this.roomManager.onOffer(roomId, sdp, socket.id);
        });

        socket.on("answer", ({ roomId, sdp }: { roomId: string, sdp: string }) => {
            console.log('📨 Received answer from client:', socket.id);
            this.roomManager.onAnswer(roomId, sdp, socket.id);
        });

        socket.on("ice-candidate", ({ roomId, candidate, type }: { 
            roomId: string, 
            candidate: any, 
            type: "sender" | "receiver" 
        }) => {
            console.log('🧊 Received ICE candidate from client:', socket.id);
            this.roomManager.onIceCandidate(roomId, socket.id, candidate, type);
        });

        // Overlay data handler - NOW WITH OPACITY SUPPORT
        socket.on("overlay-data", ({ meetingId, landmarks, overlayUrl, opacity }: { 
            meetingId: string, 
            landmarks: any,
            overlayUrl: string | null,
            opacity: number | null  // ADDED: opacity parameter
        }) => {
            this.handleOverlayData(socket, meetingId, landmarks, overlayUrl, opacity);  // ADDED: opacity parameter
        });

        // NEW: Handle chat messages
        socket.on("send-message", ({ meetingId, text, senderName }: { meetingId: string, text: string, senderName: string }) => {
            this.handleChatMessage(socket, meetingId, text, senderName);
        });

        // NEW: Handle public key exchange for E2E encryption
        socket.on("public-key", ({ publicKey }: { publicKey: string }) => {
            this.handlePublicKeyExchange(socket, publicKey);
        });

        // NEW: Handle encrypted chat messages
        socket.on("encrypted-chat-message", ({ meetingId, encrypted }: { meetingId: string, encrypted: any }) => {
            this.handleEncryptedChatMessage(socket, meetingId, encrypted);
        });

    }

    // UPDATED: handleOverlayData now includes opacity parameter
    handleOverlayData(
        socket: Socket, 
        meetingId: string, 
        landmarks: any, 
        overlayUrl: string | null, 
        opacity: number | null  // ADDED: opacity parameter
    ) {
        const participants = this.meetingRooms.get(meetingId);
        
        if (!participants || participants.length < 2) {
            return; // No one to send to
        }
        
        // Find the other participant (not the sender)
        const otherSocketId = participants.find(id => id !== socket.id);
        
        if (otherSocketId) {
            const otherUser = this.users.find(u => u.socket.id === otherSocketId);
            
            if (otherUser) {
                // Forward overlay data, URL, AND opacity to the other participant
                otherUser.socket.emit("overlay-data", { 
                    landmarks,
                    overlayUrl,
                    opacity  // ADDED: forward opacity to remote user
                });
            }
        }
    }

    // NEW: Handle chat messages and relay to other participant
    handleChatMessage(socket: Socket, meetingId: string, text: string, senderName: string) {
        const participants = this.meetingRooms.get(meetingId);
        
        if (!participants || participants.length < 2) {
            return; // No one to send to
        }
        
        // Filter profanity from message
        const filteredText = profanityFilter.clean(text);
        
        // Find the other participant (not the sender)
        const otherSocketId = participants.find(id => id !== socket.id);
        
        if (otherSocketId) {
            const otherUser = this.users.find(u => u.socket.id === otherSocketId);
            
            if (otherUser) {
                console.log('💬 Relaying chat message from', senderName, 'in meeting:', meetingId);
                // Send the filtered message and sender name to the other participant
                otherUser.socket.emit("chat-message", { text: filteredText, senderName });
            }
        }
    }


    handleJoinMeeting(socket: Socket, meetingId: string, name: string) {
        console.log(`👤 User ${socket.id} (${name}) joining meeting ${meetingId}`);
        
        // Get or create participants list for this meeting
        if (!this.meetingRooms.has(meetingId)) {
            this.meetingRooms.set(meetingId, []);
        }
        
        const participants = this.meetingRooms.get(meetingId)!;
        
        // Check if meeting already has 2 people
        if (participants.length >= 2) {
            socket.emit("error", { message: "Meeting is full (maximum 2 participants)" });
            return;
        }
        
        // Add this user to the meeting
        participants.push(socket.id);
        
        // If this is the first person, put them in waiting
        if (participants.length === 1) {
            console.log(`⏳ User ${socket.id} waiting in meeting ${meetingId}`);
            socket.emit("waiting");
            return;
        }
        
        // If this is the second person, connect them via WebRTC
        if (participants.length === 2) {
            const user1SocketId = participants[0];
            const user2SocketId = participants[1];
            
            const user1 = this.users.find(u => u.socket.id === user1SocketId);
            const user2 = this.users.find(u => u.socket.id === user2SocketId);
            
            if (user1 && user2) {
                console.log(`✅ Creating WebRTC room for meeting ${meetingId}`);
                
                // Notify both users they're connected
                user1.socket.emit("partner-connected", { meetingId });
                user2.socket.emit("partner-connected", { meetingId });
                
                // Create WebRTC room - this triggers the signaling process
                this.roomManager.createRoom(user1, user2, meetingId);
            }
        }
    }

    // NEW: Handle public key exchange for E2E encryption
    handlePublicKeyExchange(socket: Socket, publicKey: string) {
        console.log('🔑 Received public key from:', socket.id);
        
        // Find all meetings this user is in
        for (const [meetingId, participants] of this.meetingRooms.entries()) {
            if (participants.includes(socket.id)) {
                // Find the other participant in this meeting
                const otherSocketId = participants.find(id => id !== socket.id);
                
                if (otherSocketId) {
                    const otherUser = this.users.find(u => u.socket.id === otherSocketId);
                    
                    if (otherUser) {
                        console.log('🔑 Forwarding public key from', socket.id, 'to', otherSocketId);
                        // Forward the public key to the other participant
                        otherUser.socket.emit("public-key", { publicKey });
                    }
                }
            }
        }
    }

    // NEW: Handle encrypted chat messages (just relay, server can't decrypt)
    handleEncryptedChatMessage(socket: Socket, meetingId: string, encrypted: any) {
        const participants = this.meetingRooms.get(meetingId);
        
        if (!participants || participants.length < 2) {
            return; // No one to send to
        }
        
        // Find the other participant (not the sender)
        const otherSocketId = participants.find(id => id !== socket.id);
        
        if (otherSocketId) {
            const otherUser = this.users.find(u => u.socket.id === otherSocketId);
            
            if (otherUser) {
                console.log('🔐 Relaying encrypted chat message from', socket.id, 'in meeting:', meetingId);
                // Forward the encrypted message to the other participant
                // Server cannot decrypt (only clients with matching keys can)
                otherUser.socket.emit("encrypted-chat-message", encrypted);
            }
        }
    }

    removeUser(socketId: string) {
        this.users = this.users.filter(x => x.socket.id !== socketId);
        
        // Remove from all meetings
        for (const [meetingId, participants] of this.meetingRooms.entries()) {
            const index = participants.indexOf(socketId);
            if (index !== -1) {
                participants.splice(index, 1);
                
                // Notify other participant if there is one
                if (participants.length > 0) {
                    const otherSocketId = participants[0];
                    const otherUser = this.users.find(u => u.socket.id === otherSocketId);
                    if (otherUser) {
                        otherUser.socket.emit("user-disconnected");
                    }
                }
                
                // Clean up empty meetings
                if (participants.length === 0) {
                    this.meetingRooms.delete(meetingId);
                }
            }
        }
    }
}