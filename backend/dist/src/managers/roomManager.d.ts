import type { User } from "./user.js";
export declare class roomManager {
    private rooms;
    constructor();
    createRoom(user1: User, user2: User, meetingId: string): void;
    onOffer(roomId: string, sdp: string, sendingSocketId: string): void;
    onAnswer(roomId: string, sdp: string, sendingSocketId: string): void;
    onIceCandidate(roomId: string, sendingSocketId: string, candidate: any, type: "sender" | "receiver"): void;
}
//# sourceMappingURL=roomManager.d.ts.map