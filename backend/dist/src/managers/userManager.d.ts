import { Socket } from "socket.io";
export declare class userManager {
    private users;
    private roomManager;
    private meetingRooms;
    private transports;
    private producers;
    private consumers;
    private plainTransports;
    private plainTransportsOut;
    private processedProducers;
    private ffmpegProcesses;
    private ffmpegEncoders;
    private encoderStreams;
    private userSettings;
    private producerToSocket;
    private usedPorts;
    private nextPortBase;
    private producerDimensions;
    private encoderInitializing;
    private encoderReady;
    constructor();
    addUser(name: string, socket: Socket): void;
    initHandlers(socket: Socket): void;
    handleOverlayData(socket: Socket, meetingId: string, landmarks: any, overlayUrl: string | null, opacity: number | null): void;
    handleJoinMeeting(socket: Socket, meetingId: string, name: string): void;
    handleCreateTransport(socket: Socket, direction: 'send' | 'recv'): Promise<void>;
    handleConnectTransport(socket: Socket, transportId: string, dtlsParameters: any): Promise<void>;
    handleProduce(socket: Socket, transportId: string, kind: string, rtpParameters: any): Promise<void>;
    private allocatePorts;
    private freePorts;
    setupVideoProcessing(socket: Socket, producer: any): Promise<void>;
    handleConsume(socket: Socket, transportId: string, producerId: string, rtpCapabilities: any): Promise<void>;
    handleConsumerResume(socket: Socket, consumerId: string): Promise<void>;
    removeUser(socketId: string): void;
}
//# sourceMappingURL=userManager.d.ts.map