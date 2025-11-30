export class roomManager {
    rooms;
    constructor() {
        this.rooms = new Map();
    }
    createRoom(user1, user2, meetingId) {
        const roomId = meetingId;
        // Create a room with current users
        this.rooms.set(roomId, {
            user1,
            user2,
        });
        console.log('🏠 Room created:', roomId);
        // Add a small delay to ensure clients are ready
        setTimeout(() => {
            console.log('📤 Triggering offer creation');
            user1.socket.emit("send-offer", { roomId });
        }, 500); // 500ms delay
    }
    onOffer(roomId, sdp, sendingSocketId) {
        console.log('📄 Processing offer for room:', roomId);
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log('❌ Room not found:', roomId);
            return;
        }
        // Determine which user is receiving (the one who didn't send)
        const receivingUser = room.user1.socket.id === sendingSocketId
            ? room.user2
            : room.user1;
        console.log('📤 Forwarding offer to user:', receivingUser.socket.id);
        receivingUser.socket.emit("offer", {
            sdp,
            roomId
        });
    }
    onAnswer(roomId, sdp, sendingSocketId) {
        console.log('📄 Processing answer for room:', roomId);
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log('❌ Room not found:', roomId);
            return;
        }
        // Determine which user is receiving (the one who didn't send)
        const receivingUser = room.user1.socket.id === sendingSocketId
            ? room.user2
            : room.user1;
        console.log('📤 Forwarding answer to user:', receivingUser.socket.id);
        receivingUser.socket.emit("answer", {
            sdp,
            roomId
        });
    }
    onIceCandidate(roomId, sendingSocketId, candidate, type) {
        console.log('🧊 Processing ICE candidate for room:', roomId);
        const room = this.rooms.get(roomId);
        if (!room) {
            console.log('❌ Room not found:', roomId);
            return;
        }
        // Determine which user is receiving (the one who didn't send)
        const receivingUser = room.user1.socket.id === sendingSocketId
            ? room.user2
            : room.user1;
        console.log('📤 Forwarding ICE candidate to user:', receivingUser.socket.id);
        receivingUser.socket.emit("add-ice-candidate", { candidate, type });
    }
}
//# sourceMappingURL=roomManager.js.map